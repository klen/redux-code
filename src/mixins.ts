/* eslint-disable @typescript-eslint/no-explicit-any */

import { Actions } from './types'

/**
 * Actions Mixin provides reset and update actions
 */
export const commonActions = {
  /**
   *
   * Creates an action to reset the state
   */
  reset: undefined,
  /**
   *
   * Creates an action to update the state with the given payload
   */
  update: <T>(payload: T): T => payload,
}

/**
 *
 * Creates a mixin for a reducer that adds the ability to reset and update the state
 * @param {actions} actions The actions to handle.
 * @param {initial} initial The initial state.
 */
export const commonReducer = <T extends Record<string, any> & typeof commonActions, S>(
  actions: Actions<string, T>,
  initial: S,
) => ({
  [actions.reset.type]: () => initial,
  [actions.update.type]: (state: object, { payload }) => ({ ...state, ...payload }),
})

/**
 * Initial reducer.
 * Supports INIT action
 */
export const initReducer = (actions: Actions<string, Record<string, any>>) => ({
  [actions.init.type]: (state) => ({ ...state, inited: true }),
})
