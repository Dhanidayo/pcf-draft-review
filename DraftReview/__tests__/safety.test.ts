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

/** The markup snippets found in a draft, or [] when none are. */
const markupIn = (draft: string) =>
  findDraftFlags(draft).find((f) => f.kind === "markup")?.matches ?? [];

test("common tags, comments, handlers and script URLs are flagged", () => {
  assert.deepEqual(markupIn("<script>alert(1)</script>"), ["<script>", "</script>"]);
  assert.deepEqual(markupIn('Click <a href="https://x.test">here</a>'), ['<a href="https://x.test">', "</a>"]);
  assert.deepEqual(markupIn("<SVG onload=alert(1)>"), ["<SVG onload=alert(1)>"]);
  assert.deepEqual(markupIn("Hi <!-- hidden -->"), ["<!--"]);
  assert.deepEqual(markupIn("onmouseover='steal()'"), ["onmouseover='"]);
  assert.deepEqual(markupIn("vbscript:msgbox and data:text/html,<b>"), ["vbscript:", "data:text/html", "<b>"]);
});

test("ordinary text that looks a bit like markup is not flagged", () => {
  const harmless = [
    "If x < 5 and y > 2, we proceed.",
    "Costs went from <10% to >20%.",
    "Contact Ana Silva <ana@example.com> for details.",
    "Use the <client name> placeholder.",
    "The online = yes setting is enabled.",
    "We write it in JavaScript: a popular language.",
    "Ratings: 3<4 and 5>4.",
  ];
  for (const text of harmless) assert.deepEqual(markupIn(text), [], text);
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
