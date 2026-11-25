import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const trackGrowthEvent = vi.fn();
vi.mock("@/lib/growth-tracking", () => ({
  trackGrowthEvent: (...a: unknown[]) => trackGrowthEvent(...a),
  currentVisitSource: () => ({ channel: "fb-east-kilbride", referrerHost: "" }),
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { VisitRequestForm } from "@/components/visit-request-form";

let reply: () => Promise<unknown>;
const fetchMock = vi.fn((_url: string, _init?: RequestInit) => reply());

const next = () => fireEvent.click(screen.getByRole("button", { name: /continue/i }));
const type = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const pick = (name: RegExp) => fireEvent.click(screen.getByRole("radio", { name }));

function toDetails() {
  next();
  type(/^postcode/i, "g72 8fe");
  type(/town/i, "Cambuslang");
  next();
  pick(/this week/i);
  next();
  type(/preferred date/i, "2099-01-05");
  pick(/evening/i);
  next();
}
function fillDetails() {
  type(/full name/i, "John Smith");
  pick(/^male/i);
  type(/date of birth/i, "1950-04-02");
  type("Phone", "07518 953611");
  type("Email", "john@example.com");
  next();
}
const agree = () => screen.getAllByRole("checkbox").forEach((box) => fireEvent.click(box));
const send = () => fireEvent.click(screen.getByRole("button", { name: /send booking request/i }));

describe("VisitRequestForm", () => {
  beforeEach(() => {
    trackGrowthEvent.mockReset();
    fetchMock.mockClear();
    window.sessionStorage.clear();
    reply = () => Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends every answer after consent, with nothing to pay first", async () => {
    render(<VisitRequestForm />);
    pick(/falls/i);
    toDetails();
    fillDetails();
    agree();
    send();
    expect(await screen.findByRole("heading", { name: /thanks, john/i })).toBeInTheDocument();
    expect(screen.getByText(/you pay after your session/i)).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toMatchObject({
      visitType: "home", concern: "falls", town: "Cambuslang", urgency: "week",
      preferredDate: "2099-01-05", preferredTime: "evening", gender: "male",
      dateOfBirth: "1950-04-02", email: "john@example.com", emergencyPhone: "", consent: true,
    });
  });

  it("makes email compulsory and the emergency contact optional", () => {
    render(<VisitRequestForm />);
    toDetails();
    next();
    expect(screen.getByText("Add your email address.")).toBeInTheDocument();
    expect(screen.queryByText(/leave this empty/i)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fills the town from the postcode, keeping one the patient typed", () => {
    render(<VisitRequestForm />);
    next();
    type(/^postcode/i, "pa1 1aa");
    expect(screen.getByLabelText(/town/i)).toHaveValue("Paisley");
    type(/town/i, "Ralston");
    type(/^postcode/i, "g31 4hs");
    expect(screen.getByLabelText(/town/i)).toHaveValue("Ralston");
    expect(screen.getByText(/helps us arrange your visit faster/i)).toBeInTheDocument();
  });

  it("starts the preferred date at tomorrow", () => {
    render(<VisitRequestForm />);
    next();
    type(/^postcode/i, "g72 8fe");
    next();
    next();
    const input = screen.getByLabelText(/preferred date/i) as HTMLInputElement;
    expect(input.value).toBe(input.min);
    expect(input.value).not.toBe("");
  });

  it("comes back to the same step with answers kept, and forgets once sent", async () => {
    const first = render(<VisitRequestForm />);
    toDetails();
    fillDetails();
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    first.unmount();

    render(<VisitRequestForm />);
    expect(screen.getByText("Step 6 of 6")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
    screen.getAllByRole("checkbox").slice(1).forEach((box) => fireEvent.click(box));
    send();
    expect(await screen.findByRole("heading", { name: /thanks, john/i })).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toMatchObject({ name: "John Smith", town: "Cambuslang" });
    expect(window.sessionStorage.getItem("poc-request-form")).toBeNull();
  });

  it("skips the address for video", () => {
    render(<VisitRequestForm />);
    pick(/video call/i);
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    next();
    expect(screen.queryByLabelText(/^postcode/i)).toBeNull();
  });

  it("will not send until every box is ticked", () => {
    render(<VisitRequestForm />);
    toDetails();
    fillDetails();
    send();
    expect(screen.getByText(/tick all three/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the postcode from the homepage check", () => {
    window.sessionStorage.setItem("poc-request-postcode", "G31 4HS");
    render(<VisitRequestForm />);
    next();
    expect(screen.getByLabelText(/^postcode/i)).toHaveValue("G31 4HS");
  });

  it("records the status if sending fails", async () => {
    reply = () => Promise.resolve({ ok: false, status: 503, json: async () => ({ error: "Please call or text 07557 684395." }) });
    render(<VisitRequestForm />);
    toDetails();
    fillDetails();
    agree();
    send();
    expect(await screen.findByRole("alert")).toHaveTextContent("Please call or text");
    expect(trackGrowthEvent).toHaveBeenCalledWith("visit_request_failed", { source: "request_visit_page", status: 503 });
  });
});
