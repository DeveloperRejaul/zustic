"use client";

import { useSyncExternalStore } from "react";
import type {
  CreateParamsType,
  Listener,
  Middleware,
  SetSateParams,
} from "./types";

/**
 * Create a store with state and actions.
 *
 * Example usage:
 * ```ts
 * type CreateType = {
 *   count: number;
 *   inc: () => void;
 *   dec: () => void;
 * }
 * 
 * export const useCounter = create<CreateType>((set) => ({
 *   count: 1,
 *   inc: () => set((state) => ({ count: state.count + 1 })),
 *   dec: () => set((state) => ({ count: state.count - 1 })),
 * }));
 * 
 * // In a React component:
 * const Counter = () => {
 *   const { count, inc, dec } = useCounter();
 *   return (
 *     <>
 *       <Text>{count}</Text>
 *       <Button title="+" onPress={inc} />
 *       <Button title="-" onPress={dec} />
 *     </>
 *   );
 * }
 * ```
 * 
 * Example of Middleware
 * ```
 * const logger = <T extends object>(): Middleware<T> => (set, get) => (next) => async (partial) => {
 *     console.log('prev:', get());
 *     await next(partial);
 *     console.log('next:', get());
 * };
 * 
 * ```
 *
 * @param initializer Function that receives `set` and returns the initial state object.
 * @returns A hook that provides access to the store state and actions.
 */
function create<T extends object>(
  initializer: CreateParamsType<T>,
  middlewares: Middleware<T>[] = []
) {
  // -----------------------------
  // Internal State
  // -----------------------------
  let state: T;
  const listeners = new Set<Listener>();

  // -----------------------------
  // Get State
  // -----------------------------
  const getState = () => state;

  // -----------------------------
  // Set State
  // -----------------------------
  const setState = (partial: SetSateParams<T>) => {
    const partialState =
      typeof partial === "function"
        ? partial(state)
        : partial;

    state = {
      ...state,
      ...partialState,
    };

    listeners.forEach((listener) => listener());
  };

  // -----------------------------
  // Apply Middleware
  // -----------------------------
  const enhancedSet = applyMiddleware(
    setState,
    getState,
    middlewares
  );

  // -----------------------------
  // Initialize Store
  // -----------------------------
  state = initializer(enhancedSet, getState);

  // -----------------------------
  // Subscribe
  // -----------------------------
  const subscribe = (listener: Listener) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  // -----------------------------
  // Hook
  // -----------------------------
  function useStore<U = T>(
    selector: (state: T) => U = (state) => state as unknown as U
  ): U {
    const getSnapshot = () => selector(getState());

    return useSyncExternalStore(
      subscribe,
      getSnapshot,
      getSnapshot
    );
  }

  // Optional utilities
  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore;
}

/**
 * Apply middleware pipeline.
 */
function applyMiddleware<T>(
  set: (partial: SetSateParams<T>) => void,
  get: () => T,
  middlewares: Middleware<T>[] = []
) {
  if (!middlewares.length) {
    return set;
  }

  return middlewares.reduceRight(
    (next, middleware) => middleware(set, get)(next),
    set
  );
}

export { create };