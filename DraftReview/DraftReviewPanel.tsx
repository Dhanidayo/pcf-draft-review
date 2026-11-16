import * as React from "react";
import {
  Badge,
  Button,
  Caption1,
  Card,
  CardHeader,
  FluentProvider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text,
  Textarea,
  makeStyles,
  tokens,
  webLightTheme,
} from "@fluentui/react-components";
import { DraftFlag, ReviewStatus, findDraftFlags } from "./safety";

export interface DraftReviewPanelProps {
  draft: string;
  status: ReviewStatus;
  sourceLabel: string;
  disabled: boolean;
  onDecision: (draft: string, status: ReviewStatus) => void;
}

const statusAppearance: Record<
  ReviewStatus,
  { color: "informative" | "success" | "warning" | "danger"; label: string }
> = {
  pending: { color: "informative", label: "Needs review" },
  approved: { color: "success", label: "Approved" },
  edited: { color: "warning", label: "Edited and approved" },
  rejected: { color: "danger", label: "Rejected" },
};

const useStyles = makeStyles({
  card: { maxWidth: "720px", width: "100%" },
  draft: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalS,
  },
  matches: { fontFamily: tokens.fontFamilyMonospace, overflowWrap: "anywhere" },
  badge: { whiteSpace: "nowrap", flexShrink: 0 },
});

export function DraftReviewPanel({
  draft,
  status,
  sourceLabel,
  disabled,
  onDecision,
}: DraftReviewPanelProps): React.ReactElement {
  const styles = useStyles();

  const [editing, setEditing] = React.useState<boolean>(false);
  // The reviewer's saved edit, shown until the host passes back a new draft.
  // Some hosts (the test harness, a canvas app without Patch) never do.
  const [saved, setSaved] = React.useState<string | null>(null);
  const current = saved ?? draft;
  const [edited, setEdited] = React.useState<string>(current);

  React.useEffect(() => {
    setSaved(null);
  }, [draft]);

  React.useEffect(() => {
    if (!editing) setEdited(current);
  }, [current, editing]);

  const flags: DraftFlag[] = React.useMemo(
    () => findDraftFlags(current),
    [current],
  );
  const appearance = statusAppearance[status];
  const hasDraft = current.trim().length > 0;
  const decided = status !== "pending";

  const saveEdit = () => {
    setEditing(false);
    setSaved(edited);
    onDecision(edited, "edited");
  };

  return (
    <FluentProvider theme={webLightTheme}>
      <Card className={styles.card}>
        <CardHeader
          header={<Text weight="semibold">{sourceLabel}</Text>}
          description={
            <Caption1>
              AI-generated. A person must review it before it is used.
            </Caption1>
          }
          action={
            <Badge
              className={styles.badge}
              appearance="tint"
              color={appearance.color}
            >
              {appearance.label}
            </Badge>
          }
        />

        {!hasDraft && (
          <MessageBar intent="info">
            <MessageBarBody>
              Waiting for a draft. It will appear here once generated.
            </MessageBarBody>
          </MessageBar>
        )}

        {hasDraft && !editing && (
          <div className={styles.stack}>
            <Text className={styles.draft} as="p">
              {current}
            </Text>
            {flags.map((flag) => (
              <MessageBar
                key={flag.kind}
                intent={flag.kind === "markup" ? "error" : "warning"}
              >
                <MessageBarBody>
                  <MessageBarTitle>{flag.message}</MessageBarTitle>
                  <span className={styles.matches}>
                    {flag.matches.join(", ")}
                  </span>
                </MessageBarBody>
              </MessageBar>
            ))}
          </div>
        )}

        {editing && (
          <Textarea
            aria-label="Edit draft"
            value={edited}
            onChange={(_, data) => setEdited(data.value)}
            resize="vertical"
            rows={10}
          />
        )}

        <div className={styles.actions}>
          {editing ? (
            <>
              <Button
                appearance="primary"
                onClick={saveEdit}
                disabled={disabled || !edited.trim()}
              >
                Save and approve
              </Button>
              <Button
                onClick={() => {
                  setEditing(false);
                  setEdited(current);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                appearance="primary"
                onClick={() => onDecision(current, "approved")}
                disabled={disabled || !hasDraft || decided}
              >
                Approve
              </Button>
              <Button
                onClick={() => setEditing(true)}
                disabled={disabled || !hasDraft}
              >
                Edit
              </Button>
              <Button
                onClick={() => onDecision(current, "rejected")}
                disabled={disabled || !hasDraft || status === "rejected"}
              >
                Reject
              </Button>
              {decided && (
                <Button
                  appearance="subtle"
                  onClick={() => onDecision(current, "pending")}
                  disabled={disabled}
                >
                  Reopen
                </Button>
              )}
            </>
          )}
        </div>
      </Card>
    </FluentProvider>
  );
}
