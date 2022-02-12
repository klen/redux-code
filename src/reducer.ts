import produce, { Draft, isDraft, isDraftable } from 'immer'
import { Action, Reducer } from 'redux'

/**
 * A helper to create reducers
 */
export const createReducer = function <S>(DEFAULT: S, ...mixins: object[]): Reducer<S> {
  const reducers = Object.assign({}, ...mixins)
  return function (state = DEFAULT, action: Action) {
    const reducer = reducers[action.type]
    if (!reducer) return state
    if (isDraft(state) || !isDraftable(state)) return reducer(state, action)
    return produce(state, (draft: Draft<S>) => reducer(draft, action))
  }
}
