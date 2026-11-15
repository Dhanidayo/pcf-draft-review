/** Review states written back to the record. */
export type ReviewStatus = "pending" | "approved" | "edited" | "rejected";

export const REVIEW_STATUSES: readonly ReviewStatus[] = ["pending", "approved", "edited", "rejected"];

/** Something in a draft a reviewer should check before it is sent. */
export interface DraftFlag {
  kind: "link" | "email" | "markup";
  message: string;
  matches: string[];
}

const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const MARKUP = /<\s*\/?\s*[a-z][^>]*>|\bon[a-z]+\s*=|javascript:/gi;

/**
 * Normalises a stored status value, treating anything unknown as pending.
 *
 * @param value - raw column value
 * @returns a known review status
 */
export function toReviewStatus(value: string | null | undefined): ReviewStatus {
  const v = (value ?? "").trim().toLowerCase();
  return (REVIEW_STATUSES as readonly string[]).includes(v) ? (v as ReviewStatus) : "pending";
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
    flags.push({ kind: "markup", message: "Contains HTML or script-like text. It is shown as plain text; remove it before sending.", matches: markup });
  }
  const links = unique(LINK);
  if (links.length) {
    flags.push({ kind: "link", message: "Contains links. Check each one is real and intended.", matches: links });
  }
  const emails = unique(EMAIL);
  if (emails.length) {
    flags.push({ kind: "email", message: "Contains email addresses. Check they are correct.", matches: emails });
  }
  return flags;
}
