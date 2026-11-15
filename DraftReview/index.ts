import * as React from "react";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { DraftReviewPanel } from "./DraftReviewPanel";
import { ReviewStatus, toReviewStatus } from "./safety";

/** PCF entry point: binds the review panel to the draft and status columns. */
export class DraftReview implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  private notifyOutputChanged!: () => void;
  private outputs: IOutputs = {};

  /**
   * Called once when the control loads.
   *
   * @param context - the framework context
   * @param notifyOutputChanged - tells the framework new outputs are ready
   */
  public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void): void {
    this.notifyOutputChanged = notifyOutputChanged;
  }

  /**
   * Renders the panel whenever bound values or the context change.
   *
   * @param context - the framework context
   * @returns the React element to render
   */
  public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    return React.createElement(DraftReviewPanel, {
      draft: context.parameters.draftText.raw ?? "",
      status: toReviewStatus(context.parameters.reviewStatus.raw),
      sourceLabel: context.parameters.sourceLabel.raw || "AI draft",
      disabled: context.mode.isControlDisabled,
      onDecision: this.handleDecision,
    });
  }

  /**
   * Records the reviewer's decision and the (possibly edited) draft.
   *
   * @param draft - the draft text to save
   * @param status - the decision
   */
  private handleDecision = (draft: string, status: ReviewStatus): void => {
    this.outputs = { draftText: draft, reviewStatus: status };
    this.notifyOutputChanged();
  };

  /** @returns the values to write back to the bound columns */
  public getOutputs(): IOutputs {
    return this.outputs;
  }

  /** Nothing to clean up: React unmounting is handled by the framework. */
  public destroy(): void {}
}
