/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import produce, { Draft } from 'immer'
import { Action, Reducer } from 'redux'

/**
 * A helper to create reducers
 */
export const createReducer = function <S>(DEFAULT: S, ...mixins: object[]): Reducer<S> {
  const reducers = Object.assign({}, ...mixins)
  return function (state = DEFAULT, action: Action) {
    const reducer = reducers[action.type]
    if (!reducer) return state
    return produce(state, (draft: Draft<S>) => reducer(draft, action))
  }
}
