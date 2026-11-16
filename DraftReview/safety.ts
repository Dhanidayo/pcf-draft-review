export type ReviewStatus = "pending" | "approved" | "edited" | "rejected";

export const REVIEW_STATUSES: readonly ReviewStatus[] = [
  "pending",
  "approved",
  "edited",
  "rejected",
];

export interface DraftFlag {
  kind: "link" | "email" | "markup";
  message: string;
  matches: string[];
}

const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
/**
 * HTML element names worth flagging. A known list rather than "any word after <",
 * so ordinary text like "x < 5 and y > 2" or "Ana <ana@example.com>" is not flagged.
 */
const TAG_NAMES = [
  "a",
  "applet",
  "audio",
  "b",
  "base",
  "body",
  "br",
  "button",
  "center",
  "code",
  "div",
  "em",
  "embed",
  "font",
  "form",
  "frame",
  "frameset",
  "h[1-6]",
  "head",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "link",
  "li",
  "marquee",
  "math",
  "meta",
  "object",
  "ol",
  "option",
  "p",
  "pre",
  "script",
  "select",
  "source",
  "span",
  "strong",
  "style",
  "svg",
  "table",
  "td",
  "textarea",
  "th",
  "tr",
  "u",
  "ul",
  "video",
].join("|");

const MARKUP = new RegExp(
  [
    // An HTML tag: "<" straight after by a known element name, e.g. <img ...>, </div>.
    `</?(?:${TAG_NAMES})\\b[^<>]*>`,
    // An HTML comment.
    "<!--",
    // An event handler with a quoted value, e.g. onerror="...". "online = yes" is not one.
    "\\bon[a-z]{3,}\\s*=\\s*[\"'`]",
    // A script URL, e.g. javascript:alert(1). "JavaScript: a language" is not one.
    "\\b(?:java|vb)script:(?=\\S)",
    "\\bdata:text/html",
  ].join("|"),
  "gi",
);

/**
 * Normalises a stored status value, treating anything unknown as pending.
 *
 * @param value - raw column value
 * @returns a known review status
 */
export function toReviewStatus(value: string | null | undefined): ReviewStatus {
  const v = (value ?? "").trim().toLowerCase();
  return (REVIEW_STATUSES as readonly string[]).includes(v)
    ? (v as ReviewStatus)
    : "pending";
}

/**
 * Finds content in an AI draft that a person should verify: links and email
 * addresses the model may have invented, and markup that should never reach a client.
 * The draft is always rendered as plain text; these flags only guide the reviewer.
 *
 * @param draft - the draft text
 * @returns one flag per kind of content found, with the matching snippets
 */
export function findDraftFlags(draft: string): DraftFlag[] {
  const unique = (re: RegExp) => Array.from(new Set(draft.match(re) ?? []));
  const flags: DraftFlag[] = [];

  const markup = unique(MARKUP);
  if (markup.length) {
    flags.push({
      kind: "markup",
      message:
        "Contains HTML or script-like text. It is shown as plain text; remove it before sending.",
      matches: markup,
    });
  }
  const links = unique(LINK);
  if (links.length) {
    flags.push({
      kind: "link",
      message: "Contains links. Check each one is real and intended.",
      matches: links,
    });
  }
  const emails = unique(EMAIL);
  if (emails.length) {
    flags.push({
      kind: "email",
      message: "Contains email addresses. Check they are correct.",
      matches: emails,
    });
  }
  return flags;
}
