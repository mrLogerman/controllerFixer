import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createFeedbackToken,
  displayStatus,
  firstName,
  formatRepairDate,
  isFeedbackToken,
  pageKind,
  repairDateError,
} from "./feedback-invite.ts";

const now = new Date("2026-11-08T20:00:00Z");
const nowMs = now.getTime();

describe("feedback invites", () => {
  it("creates an unguessable token", () => {
    const token = createFeedbackToken();
    assert.equal(token.length, 43);
    assert.equal(isFeedbackToken(token), true);
    assert.equal(isFeedbackToken("short"), false);
    assert.equal(isFeedbackToken(`${token}extra`), false);
  });

  it("uses the customer's first name", () => {
    assert.equal(firstName("Alex Morgan"), "Alex");
    assert.equal(firstName("Marcus T."), "Marcus");
    assert.equal(firstName("   "), "there");
  });

  it("formats the repair date in Vancouver's calendar", () => {
    assert.equal(formatRepairDate("2026-11-08", now), "November 8");
    assert.equal(formatRepairDate("2024-03-02", now), "March 2, 2024");
  });

  it("rejects future and nonsense repair dates", () => {
    assert.equal(repairDateError("2026-11-08", now), null);
    assert.equal(repairDateError("2026-11-09", now), "The repair date can't be in the future.");
    assert.equal(repairDateError("2026-02-31", now), "Add a real repair date.");
  });

  it("expires unused links after 90 days and keeps submitted ones", () => {
    const fresh = new Date(nowMs - 2 * 24 * 60 * 60 * 1000).toISOString();
    const old = new Date(nowMs - 91 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(displayStatus({ status: "pending", issuedAt: fresh }, nowMs), "pending");
    assert.equal(displayStatus({ status: "pending", issuedAt: old }, nowMs), "expired");
    assert.equal(displayStatus({ status: "submitted", issuedAt: old }, nowMs), "submitted");
  });

  it("maps link state to a customer-facing page", () => {
    assert.equal(pageKind({ sanityReady: false, tokenValid: true, status: "pending" }), "unavailable");
    assert.equal(pageKind({ sanityReady: true, tokenValid: false, status: "pending" }), "invalid");
    assert.equal(
      pageKind({ sanityReady: true, tokenValid: true, status: "pending", issuedAt: now.toISOString(), now: nowMs }),
      "ready",
    );
    assert.equal(pageKind({ sanityReady: true, tokenValid: true, status: "submitted", issuedAt: now.toISOString() }), "used");
    assert.equal(pageKind({ sanityReady: true, tokenValid: true, status: "approved", issuedAt: now.toISOString() }), "used");
    assert.equal(pageKind({ sanityReady: true, tokenValid: true, status: "disabled", issuedAt: now.toISOString() }), "disabled");
  });
});
