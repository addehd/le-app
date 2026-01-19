import { vi } from 'vitest';
import * as actualZustand from 'zustand';

const { create: actualCreate } = actualZustand;

// Store reset function set
export const storeResetFns = new Set<() => void>();

// Wrap create to capture initial state
const create = (<T extends unknown>(stateCreator: actualZustand.StateCreator<T>) => {
  const store = actualCreate(stateCreator);
  const initialState = store.getState();
  storeResetFns.add(() => {
    store.setState(initialState, true);
  });
  return store;
}) as typeof actualCreate;

export default { create };
