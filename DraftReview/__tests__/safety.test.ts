import { test } from "node:test";
import assert from "node:assert/strict";
import { findDraftFlags, toReviewStatus } from "../safety.ts";

test("a plain draft has no flags", () => {
  assert.deepEqual(findDraftFlags("Dear Ms Chen,\n\nThank you for your instructions."), []);
});

test("links and email addresses are flagged for checking", () => {
  const flags = findDraftFlags("See https://example.com/terms or email help@example.com.");
  assert.deepEqual(flags.map((f) => f.kind), ["link", "email"]);
  assert.deepEqual(flags[0].matches, ["https://example.com/terms"]);
  assert.deepEqual(flags[1].matches, ["help@example.com"]);
});

test("markup and script-like text are flagged", () => {
  const flags = findDraftFlags('Hello <img src=x onerror="alert(1)"> and javascript:void(0)');
  assert.equal(flags[0].kind, "markup");
  assert.ok(flags[0].matches.length >= 2);
});

test("repeated matches are listed once", () => {
  const [flag] = findDraftFlags("www.example.com and www.example.com");
  assert.deepEqual(flag.matches, ["www.example.com"]);
});

test("unknown or empty statuses become pending", () => {
  assert.equal(toReviewStatus("Approved"), "approved");
  assert.equal(toReviewStatus("archived"), "pending");
  assert.equal(toReviewStatus(null), "pending");
});
