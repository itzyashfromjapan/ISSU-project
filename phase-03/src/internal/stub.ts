import type {
  ActionRef,
  Assessment,
  DecisionProvider,
  OutcomeClass,
} from "@issue/tool-runtime";

const VALID_OUTCOME_CLASSES: readonly OutcomeClass[] = [
  "success",
  "invalidContent",
  "notFound",
  "accessDenied",
  "tooLarge",
  "invalidInput",
  "executionError",
  "internalError",
];

function isValidOutcomeClass(value: unknown): value is OutcomeClass {
  return (
    typeof value === "string" &&
    (VALID_OUTCOME_CLASSES as readonly string[]).includes(value)
  );
}

function sameActionRef(a: ActionRef, b: ActionRef): boolean {
  if (a.operation !== b.operation || a.target !== b.target) return false;
  if (a.operation === "readFile") {
    return (
      a.read?.maxBytes === b.read?.maxBytes &&
      a.read?.chunkSize === b.read?.chunkSize
    );
  }
  return a.list?.includeHidden === b.list?.includeHidden;
}

/**
 * Optional fixed-decision table for the deterministic stub (§30.2). Each entry
 * is validated to be a valid `DecisionProvider` response at use time: a forced
 * selection must be present in the available set, and a forced assessment must
 * be a valid `OutcomeClass`.
 */
export interface DeterministicStubTable {
  /** Fixed selection preference: the first entry present in `available` is returned. */
  readonly selectionOrder?: readonly ActionRef[];
  /** Fixed assessment mapping: target → forced `OutcomeClass` (mirror when absent). */
  readonly assessments?: ReadonlyMap<string, OutcomeClass>;
}

export interface DeterministicProviderStubConfig {
  readonly table?: DeterministicStubTable;
}

/**
 * Deterministic provider stub (§30): implements the frozen Phase 2
 * `DecisionProvider` seam. Baseline policies (§30.2) are "first-available"
 * selection and "mirror" assessment. An optional fixed-decision table
 * (`DeterministicStubTable`) overrides both. The stub is deterministic,
 * model-free, and contains no provider SDK or network access.
 */
export function createDeterministicProviderStub(
  config?: DeterministicProviderStubConfig,
): DecisionProvider {
  const table = config?.table;
  return {
    async selectAction(available): Promise<ActionRef> {
      const forced = table?.selectionOrder;
      if (forced !== undefined) {
        for (const ref of forced) {
          const match = available.find((item) => sameActionRef(item.ref, ref));
          if (match !== undefined) return match.ref;
        }
      }
      const first = available[0];
      if (first === undefined) {
        throw new Error(
          "Deterministic provider stub: selectAction requires a non-empty available set",
        );
      }
      return first.ref;
    },
    async assess(result): Promise<Assessment> {
      const forced = table?.assessments?.get(result.action.target);
      if (forced !== undefined && isValidOutcomeClass(forced)) {
        return { classification: forced };
      }
      return { classification: result.classification };
    },
  };
}
