"use client";

import { useCallback, useMemo, useState } from "react";
import type { SimulationSnapshot, SimulationSpec } from "./types";

export function useSimulation<State, Action, Metrics>(
  spec: SimulationSpec<State, Action, Metrics>,
  initialState: State,
) {
  const [origin, setOrigin] = useState(initialState);
  const [actions, setActions] = useState<Action[]>([]);
  const [state, setState] = useState(initialState);
  const [snapshots, setSnapshots] = useState<SimulationSnapshot<State>[]>([{ actionIndex: 0, state: initialState }]);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useCallback((action: Action) => {
    try {
      const next = spec.reduce(state, action);
      const validation = spec.validateInvariants(next);
      if (!validation.valid) throw new Error(validation.violations.join(" "));
      const nextActions = [...actions, action];
      setState(next);
      setActions(nextActions);
      setSnapshots((current) => [...current, { actionIndex: nextActions.length, state: next }]);
      setError(null);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "模拟器无法执行这一步。");
      return false;
    }
  }, [actions, spec, state]);

  const dispatchMany = useCallback((batch: Action[]) => {
    if (!batch.length) return true;
    try {
      let nextState = state;
      const nextSnapshots = [] as SimulationSnapshot<State>[];
      for (const action of batch) {
        nextState = spec.reduce(nextState, action);
        const validation = spec.validateInvariants(nextState);
        if (!validation.valid) throw new Error(validation.violations.join(" "));
        nextSnapshots.push({ actionIndex: actions.length + nextSnapshots.length + 1, state: nextState });
      }
      const nextActions = [...actions, ...batch];
      setState(nextState);
      setActions(nextActions);
      setSnapshots((current) => [...current, ...nextSnapshots]);
      setError(null);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "模拟器无法执行这组步骤。");
      return false;
    }
  }, [actions, spec, state]);

  const reset = useCallback((nextOrigin = origin) => {
    setOrigin(nextOrigin);
    setState(nextOrigin);
    setActions([]);
    setSnapshots([{ actionIndex: 0, state: nextOrigin }]);
    setError(null);
  }, [origin]);

  const replayTo = useCallback((actionIndex: number) => {
    const safeIndex = Math.max(0, Math.min(actionIndex, actions.length));
    let replayed = origin;
    for (const action of actions.slice(0, safeIndex)) replayed = spec.reduce(replayed, action);
    setState(replayed);
    setActions((current) => current.slice(0, safeIndex));
    setSnapshots((current) => current.filter((snapshot) => snapshot.actionIndex <= safeIndex));
    setError(null);
  }, [actions, origin, spec]);

  return {
    state,
    metrics: useMemo(() => spec.deriveMetrics(state), [spec, state]),
    validation: useMemo(() => spec.validateInvariants(state), [spec, state]),
    actions,
    snapshots,
    error,
    dispatch,
    dispatchMany,
    reset,
    replayTo,
  };
}
