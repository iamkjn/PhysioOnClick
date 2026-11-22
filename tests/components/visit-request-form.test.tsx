import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const trackGrowthEvent = vi.fn();
vi.mock("@/lib/growth-tracking", () => ({
  trackGrowthEvent: (...a: unknown[]) => trackGrowthEvent(...a),
  currentVisitSource: () => ({ channel: "fb-east-kilbride", referrerHost: "" }),
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { VisitRequestForm } from "@/components/visit-request-form";

const fetchMock = vi.fn();

function fill(name: string, phone: string, postcode: string) {
  fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: phone } });
  fireEvent.change(screen.getByLabelText(/postcode/i), { target: { value: postcode } });
}

describe("VisitRequestForm", () => {
  beforeEach(() => {
    trackGrowthEvent.mockReset();
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("asks only for name, phone and postcode, with optional times and a note", () => {
    render(<VisitRequestForm />);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /saturday/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).toBeNull();
    expect(screen.getByRole("button", { name: /request a call back/i })).toBeInTheDocument();
  });

  it("shows what's missing instead of sending", async () => {
    render(<VisitRequestForm />);
    fireEvent.click(screen.getByRole("button", { name: /request a call back/i }));
    expect(await screen.findByText("Add a phone number so we can call you back.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tells the visitor straight away whether we visit their postcode", () => {
    render(<VisitRequestForm />);
    fireEvent.change(screen.getByLabelText(/postcode/i), { target: { value: "g72 8fe" } });
    expect(screen.getByText("We visit G72.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/postcode/i), { target: { value: "EH1 1AA" } });
    expect(screen.getByText(/EH1 is outside our usual area/)).toBeInTheDocument();
  });

  it("sends the request with the visit's source and confirms the call back", async () => {
    render(<VisitRequestForm />);
    fill("John Smith", "07518 953611", "G72 8FE");
    fireEvent.click(screen.getByRole("checkbox", { name: /weekday evening/i }));
    fireEvent.click(screen.getByRole("button", { name: /request a call back/i }));

    expect(await screen.findByRole("heading", { name: /thanks, john/i })).toBeInTheDocument();
    expect(screen.getByText(/nothing to pay until/i)).toBeInTheDocument();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/visit-request");
    expect(body).toMatchObject({
      name: "John Smith",
      phone: "07518 953611",
      postcode: "G72 8FE",
      times: ["weekday-evening"],
      channel: "fb-east-kilbride",
      website: "",
    });
    await waitFor(() =>
      expect(trackGrowthEvent).toHaveBeenCalledWith("visit_request_sent", { source: "request_visit_page", covered: true }),
    );
  });

  it("starts the note with the topic when it comes from a service or exercise page", async () => {
    window.history.pushState({}, "", "/request-visit?about=Neurological%20rehabilitation");
    render(<VisitRequestForm />);
    await waitFor(() => expect(screen.getByLabelText(/what.s it for/i)).toHaveValue("About: Neurological rehabilitation\n"));
    window.history.pushState({}, "", "/");
  });

  it("records once that someone started filling in the form", () => {
    render(<VisitRequestForm />);
    expect(trackGrowthEvent).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "J" } });
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Jo" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "07" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /saturday/i }));
    const started = trackGrowthEvent.mock.calls.filter(([event]) => event === "visit_request_started");
    expect(started).toEqual([["visit_request_started", { source: "request_visit_page", step: "name" }]]);
  });

  it("records which fields stopped the form, never what was typed", async () => {
    render(<VisitRequestForm />);
    fill("Jo Bloggs", "12345", "");
    fireEvent.click(screen.getByRole("button", { name: /request a call back/i }));
    await screen.findByText("Enter a UK phone number, e.g. 07123 456789.");
    expect(trackGrowthEvent).toHaveBeenCalledWith("visit_request_error", {
      source: "request_visit_page",
      fields: "phone:invalid,postcode:missing",
    });
    expect(JSON.stringify(trackGrowthEvent.mock.calls)).not.toContain("12345");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("records a send that the server turned down, with its status", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: "Please call or text 07557 684395." }) });
    render(<VisitRequestForm />);
    fill("John Smith", "07518 953611", "G72 8FE");
    fireEvent.click(screen.getByRole("button", { name: /request a call back/i }));
    await screen.findByRole("alert");
    expect(trackGrowthEvent).toHaveBeenCalledWith("visit_request_failed", { source: "request_visit_page", status: 503 });
    expect(trackGrowthEvent).not.toHaveBeenCalledWith("visit_request_sent", expect.anything());
  });

  it("records a send that never reached the server", async () => {
    fetchMock.mockRejectedValue(new TypeError("Load failed"));
    render(<VisitRequestForm />);
    fill("John Smith", "07518 953611", "G72 8FE");
    fireEvent.click(screen.getByRole("button", { name: /request a call back/i }));
    await screen.findByRole("alert");
    expect(trackGrowthEvent).toHaveBeenCalledWith("visit_request_failed", { source: "request_visit_page", status: 0 });
  });

  it("keeps the details and shows the error if sending fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Please call or text 07557 684395." }) });
    render(<VisitRequestForm />);
    fill("John Smith", "07518 953611", "G72 8FE");
    fireEvent.click(screen.getByRole("button", { name: /request a call back/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please call or text 07557 684395.");
    expect(screen.getByLabelText(/your name/i)).toHaveValue("John Smith");
  });
});
