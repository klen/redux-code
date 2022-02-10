/* eslint-disable @typescript-eslint/no-explicit-any */

import { Action, Reducer, ReducersMapObject } from 'redux'
import { IActionsTypes } from './types'

/**
 * A helper to create reducers
 */
export const createReducer = function (DEFAULT = {}, ...mixins: ReducersMapObject[]): Reducer<any> {
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
export const commonReducer = (types: IActionsTypes, DEFAULT: any): ReducersMapObject => ({
  [types.reset || 'reset']: () => DEFAULT,
  [types.update || 'update']: (state, action) => ({
    ...state,
    ...action.payload,
  }),
})

/**
 * Initial reducer.
 * Supports INIT action
 */
export const initialReducer = (types: IActionsTypes): ReducersMapObject => ({
  [types.init || 'init']: (state) => ({ ...state, inited: true }),
})
