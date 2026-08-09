export interface SimulationEvent {
  id: string;
  index: number;
  kind: string;
  message: string;
}

export interface SimulationValidation {
  valid: boolean;
  violations: string[];
}

export interface SimulationSpec<State, Action, Metrics> {
  id: string;
  createInitialState(seed: number): State;
  reduce(state: State, action: Action): State;
  deriveMetrics(state: State): Metrics;
  validateInvariants(state: State): SimulationValidation;
  serialize(state: State): string;
  deserialize(serialized: string): State;
}

export interface SimulationSnapshot<State> {
  actionIndex: number;
  state: State;
}
