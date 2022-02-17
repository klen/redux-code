/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyAction, ReducersMapObject } from 'redux'
import { Actions } from './types'

/**
 * Actions Mixin provides reset and update actions
 */
export const commonActions = {
  reset: undefined,
  update: function (payload: any) {
    return payload
  },
}

/**
 * Common reducer.
 * Supports UPDATE and RESET actions
 */
export const commonReducer = (
  actions: Actions<string, Record<string, any>>,
  DEFAULT: any,
): ReducersMapObject<any, AnyAction> => ({
  [actions.reset?.type ?? 'reset']: () => DEFAULT,
  [actions.update?.type ?? 'update']: (state: object, { payload }) => ({ ...state, ...payload }),
})

/**
 * Initial reducer.
 * Supports INIT action
 */
export const initReducer = (actions: Actions<string, Record<string, any>>): ReducersMapObject => ({
  [actions.init?.type ?? 'init']: (state) => ({ ...state, inited: true }),
})
