import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();
const getGenerativeModel = vi.fn(() => ({ generateContent }));

vi.mock("@google/generative-ai", () => ({
  FunctionCallingMode: { AUTO: "AUTO", ANY: "ANY", NONE: "NONE" },
  GoogleGenerativeAI: vi.fn(function GoogleGenerativeAI() {
    return { getGenerativeModel };
  }),
}));
vi.mock("@/lib/rate-limit", () => ({ clientIp: () => "1.2.3.4", isRateLimited: async () => false }));
vi.mock("@/lib/firebase-admin", () => ({
  FieldValue: { serverTimestamp: () => "ts", arrayUnion: (...v: unknown[]) => v },
  getAdminAuth: () => null,
  getAdminDb: () => ({}),
}));
const executeFunction = vi.fn(async () => JSON.stringify([{ title: "Gait and mobility" }]));
vi.mock("@/lib/chat-tools", () => ({
  GUEST_TOOL_DECLARATIONS: [{ name: "get_services" }],
  AUTH_TOOL_DECLARATIONS: [{ name: "get_services" }, { name: "get_appointments" }],
  executeFunction: (...args: unknown[]) => executeFunction(...(args as [])),
}));

import { POST } from "@/app/api/chat/route";

function reply(text: string) {
  return { response: { text: () => text, functionCalls: () => undefined, candidates: [] } };
}

function functionCallTurn() {
  const call = { name: "get_services", args: {} };
  const content = { role: "model", parts: [{ functionCall: call, thoughtSignature: "sig-123" }] };
  return { response: { text: () => "", functionCalls: () => [call], candidates: [{ content }] } };
}

function post(body: unknown) {
  return POST(
    new Request("https://physioonclick.co.uk/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }) as never,
  );
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    generateContent.mockReset();
    getGenerativeModel.mockClear();
    executeFunction.mockClear();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("answers a tool-using question without the rejected 'function' role", async () => {
    generateContent.mockResolvedValueOnce(functionCallTurn()).mockResolvedValueOnce(reply("Gait and mobility suits you."));

    const res = await post({
      message: "Which PhysioOnClick service is right for me?",
      history: [{ role: "model", text: "Hi! How can I help?" }],
    });
    const json = await res.json();

    expect(json.reply).toBe("Gait and mobility suits you.");
    expect(executeFunction).toHaveBeenCalledTimes(1);
    expect(generateContent).toHaveBeenCalledTimes(2);

    const { contents } = generateContent.mock.calls[1][0];
    expect(contents.map((c: { role: string }) => c.role)).toEqual(["user", "model", "user"]);
    expect(contents.some((c: { role: string }) => c.role === "function")).toBe(false);
    // The model's own turn goes back unchanged so Gemini 3 gets its thoughtSignature.
    expect(contents[1].parts[0].thoughtSignature).toBe("sig-123");
    expect(contents[2].parts[0].functionResponse.name).toBe("get_services");
  });

  it.each(["Do you visit Cambuslang?", "Can you come out to G72 8FE please", "Are you in East Kilbride at all?"])(
    "treats the area question %j as on-topic and links to home visits",
    async (message) => {
      generateContent.mockResolvedValueOnce(reply("Yes, I visit there."));
      const json = await (await post({ message })).json();
      expect(json.reply).toBe("Yes, I visit there.");
      expect(json.action).toMatchObject({ url: "/physiotherapy-home-visits-glasgow" });
    },
  );

  it("still declines clearly off-topic requests", async () => {
    generateContent.mockResolvedValueOnce(reply("Here is a poem about cats..."));
    const json = await (await post({ message: "Write me a long poem about my cats please" })).json();
    expect(json.reply).toMatch(/I can help with PhysioOnClick services/);
  });

  it("answers in words, with the button, when the model only asks to show a button", async () => {
    const call = { name: "redirect", args: { label: "Home visits", url: "/physiotherapy-home-visits-glasgow" } };
    generateContent
      .mockResolvedValueOnce({ response: { text: () => "", functionCalls: () => [call], candidates: [] } })
      .mockResolvedValueOnce(reply("Yes, I visit Cambuslang. The first visit is £80, all in."));

    const json = await (await post({ message: "Do you visit Cambuslang?" })).json();

    expect(json.reply).toBe("Yes, I visit Cambuslang. The first visit is £80, all in.");
    expect(json.action).toMatchObject({ type: "redirect", url: "/physiotherapy-home-visits-glasgow" });
    expect(executeFunction).not.toHaveBeenCalled();
    // Second call: same conversation, tools switched off so it must write the answer.
    const second = generateContent.mock.calls[1][0];
    expect(second.toolConfig).toEqual({ functionCallingConfig: { mode: "NONE" } });
    expect(second.contents.map((c: { role: string }) => c.role)).toEqual(["user"]);
  });

  it("tries the fast model first", async () => {
    generateContent.mockResolvedValueOnce(reply("Hello"));
    await post({ message: "Hello" });
    expect(getGenerativeModel.mock.calls[0][0]).toMatchObject({ model: "gemini-3.1-flash-lite" });
    expect(getGenerativeModel.mock.calls[0][1]).toMatchObject({ timeout: expect.any(Number) });
  });

  it("falls back to the next model when one times out", async () => {
    const abort = Object.assign(new Error("[GoogleGenerativeAI Error]: Request aborted"), { name: "AbortError" });
    generateContent.mockRejectedValueOnce(abort).mockResolvedValueOnce(reply("Back up and running"));

    const json = await (await post({ message: "Do you visit Cambuslang?" })).json();

    expect(json.reply).toBe("Back up and running");
    expect(getGenerativeModel.mock.calls.map((c) => (c as unknown as [{ model: string }])[0].model)).toEqual([
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
    ]);
  });
});
