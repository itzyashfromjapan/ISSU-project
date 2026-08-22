/**
 * ISSU v0.2 Trial UI — domain registry (whitelist).
 * Only these deterministic, frozen-barrel workflows are runnable from the UI.
 * Every runner is loaded by dynamic import from its public barrel only.
 */

export type DomainId =
  | "analytics"
  | "business"
  | "education"
  | "scientific"
  | "robotics"
  | "engineering"
  | "creative"
  | "productivity"
  | "industry";

export type DomainMeta = {
  readonly id: DomainId;
  readonly label: string;
  readonly phase: string;
  /** Module specifier of the frozen public barrel. */
  readonly specifier: string;
  /** Exported runner function name inside that barrel. */
  readonly runner: string;
};

export const DOMAINS: readonly DomainMeta[] = [
  {
    id: "analytics",
    label: "Data & Analytics",
    phase: "Phase 5",
    specifier: "@issue/analytics",
    runner: "runAnalyticsTask",
  },
  {
    id: "business",
    label: "Business Automation",
    phase: "Phase 10",
    specifier: "@issue/business",
    runner: "runBusinessTask",
  },
  {
    id: "education",
    label: "Education",
    phase: "Phase 11",
    specifier: "@issue/education",
    runner: "runEducationTask",
  },
  {
    id: "scientific",
    label: "Scientific",
    phase: "Phase 12",
    specifier: "@issue/scientific",
    runner: "runScientificTask",
  },
  {
    id: "robotics",
    label: "Robotics",
    phase: "Phase 13",
    specifier: "@issue/robotics",
    runner: "runRoboticsTask",
  },
  {
    id: "engineering",
    label: "Engineering",
    phase: "Phase 14",
    specifier: "@issue/engineering",
    runner: "runEngineeringTask",
  },
  {
    id: "creative",
    label: "Creative",
    phase: "Phase 15",
    specifier: "@issue/creative",
    runner: "runCreativeTask",
  },
  {
    id: "productivity",
    label: "Personal Productivity",
    phase: "Phase 16",
    specifier: "@issue/productivity",
    runner: "runProductivityTask",
  },
  {
    id: "industry",
    label: "Specialized Industry",
    phase: "Phase 17",
    specifier: "@issue/industry",
    runner: "runIndustryTask",
  },
];

export function getDomain(id: string): DomainMeta | undefined {
  return DOMAINS.find((d) => d.id === id);
}

/** Loads the frozen barrel and returns its runner as an opaque async callable. */
export async function loadRunner(
  meta: DomainMeta,
): Promise<(request: unknown, options?: unknown) => Promise<unknown>> {
  const mod = (await import(meta.specifier)) as Record<string, unknown>;
  const fn = mod[meta.runner];
  if (typeof fn !== "function") {
    throw new Error(`runner ${meta.runner} not found in ${meta.specifier}`);
  }
  return fn as (request: unknown, options?: unknown) => Promise<unknown>;
}
