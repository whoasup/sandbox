/** Session / export presentation style for 2D plans. */
export type PlanStyle = 'clean' | 'draft';

/**
 * Options for annotated plan SVG / PNG export (Epic 22).
 * `projectId` / `floorId` select the floor; presentation flags control layers.
 */
export interface PlanExportOptions {
  projectId: string;
  floorId: string;
  style?: PlanStyle;
  includeDimensions?: boolean;
  includeLegend?: boolean;
}

export interface SvgPlanBuildOptions {
  includeGrid?: boolean;
  style?: PlanStyle;
  includeDimensions?: boolean;
  includeLegend?: boolean;
  projectName?: string;
  floorName?: string;
  /** Injected for deterministic tests. */
  legendDate?: Date | string;
}
