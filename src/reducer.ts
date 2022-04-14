/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import produce, { Draft, isDraft, isDraftable } from 'immer'
import { Action, Reducer } from 'redux'

/**
 * A helper to create reducers (uses immer)
 */
export const createReducer = function <S>(DEFAULT: S, ...mixins: object[]): Reducer<S> {
  const reducer = createBaseReducer(DEFAULT, ...mixins)
  return function (state = DEFAULT, action: Action) {
    if (isDraft(state) || !isDraftable(state)) return reducer(state, action)
    return produce(state, (draft: Draft<S>) => reducer(draft, action))
  }
}

/**
 * A helper to create reducers (without immer)
 */
export const createBaseReducer = function <S>(DEFAULT: S, ...mixins: object[]): Reducer<S> {
  const reducers = Object.assign({}, ...mixins)
  return function (state = DEFAULT, action: Action) {
    const producer = reducers[action.type]
    if (producer) state = producer(state, action)
    return state
  }
}
