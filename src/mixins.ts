/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyAction, ReducersMapObject } from 'redux'
import { Actions } from './types'

/**
 * Actions Mixin provides reset and update actions
 */
export const commonActions = {
  reset: undefined,
  update: (payload: any) => payload,
}

/**
 * Common reducer.
 * Supports UPDATE and RESET actions
 */
export const commonReducer = (
  actions: Actions<Record<string, string>>,
  DEFAULT: any,
): ReducersMapObject<any, AnyAction> => ({
  [actions.reset?.type ?? 'reset']: () => DEFAULT,
  [actions.update?.type ?? 'update']: (state: object, { payload }) => ({ ...state, ...payload }),
})

/**
 * Initial reducer.
 * Supports INIT action
 */
export const initReducer = (actions: Actions<Record<string, string>>): ReducersMapObject => ({
  [actions.init?.type ?? 'init']: (state) => ({ ...state, inited: true }),
})
