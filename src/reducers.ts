/* eslint-disable @typescript-eslint/no-explicit-any */

import { Action, AnyAction, Reducer, ReducersMapObject } from 'redux'
import { Actions } from './types'

/**
 * A helper to create reducers
 */
export const createReducer = function (DEFAULT = {}, ...mixins: object[]): Reducer<any> {
  const reducers = Object.assign({}, ...mixins)
  return function (state = DEFAULT, action: Action) {
    const reducer = reducers[action.type]
    return reducer ? reducer(state, action) : state
  }
}

/**
 * Common reducer.
 * Supports UPDATE and RESET actions
 */
export const commonReducer = (actions: Actions<Record<string, string>>, DEFAULT: any): ReducersMapObject<any, AnyAction> => ({
  [actions.reset?.type ?? 'reset']: () => DEFAULT,
  [actions.update?.type ?? 'update']: (state: object, {payload}) => ({ ...state, ...payload }),
})

/**
 * Initial reducer.
 * Supports INIT action
 */
export const initialReducer = (actions: Actions<Record<string, string>>): ReducersMapObject => ({
  [actions.init?.type ?? 'init']: (state) => ({ ...state, inited: true }),
})
