/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import produce, { Draft, isDraft, isDraftable } from 'immer'
import { Action, combineReducers, Reducer } from 'redux'

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

const isPlainObject = (v) =>
  !!v && typeof v === 'object' && (v.__proto__ === null || v.__proto__ === Object.prototype)

export const buildStructuredReducer = function (reducer) {
  if (isPlainObject(reducer)) {
    const combined = Object.fromEntries(
      Object.entries(reducer).map(([key, value]) => [key, buildStructuredReducer(value)]),
    )
    return combineReducers(combined)
  }
  return reducer
}
