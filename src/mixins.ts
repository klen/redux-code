/* eslint-disable @typescript-eslint/no-explicit-any */

import { Actions } from './types'

/**
 * Actions Mixin provides reset and update actions
 */
export const commonActions = {
  reset: undefined,
  update: <T>(payload: T): T => payload,
}

/**
 * Common reducer.
 * Supports UPDATE and RESET actions
 */
export const commonReducer = <T extends Record<string, any> & typeof commonActions, S>(
  actions: Actions<string, T>,
  DEFAULT: S,
) => ({
  [actions.reset.type]: () => DEFAULT,
  [actions.update.type]: (state: object, { payload }) => ({ ...state, ...payload }),
})

/**
 * Initial reducer.
 * Supports INIT action
 */
export const initReducer = (actions: Actions<string, Record<string, any>>) => ({
  [actions.init.type]: (state) => ({ ...state, inited: true }),
})
