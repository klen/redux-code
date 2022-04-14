import { applyMiddleware, createStore } from 'redux'
import { createActions, createReducer, commonReducer } from '.'
import { push, middleware } from './queue'

describe('queue', () => {
  const initial = { value: null }
  const actions = createActions('test:', ['update', 'reset', 'push'])
  const reducer = createReducer(initial, commonReducer(actions, initial), {
    [actions.push.type]: () => push(actions.reset()),
  })
  const store = createStore(reducer, undefined, applyMiddleware(middleware))

  it('push', () => {
    push(actions.update({ value: 42 }))
    const state = store.getState()
    expect(state).toEqual({ value: 42 })

    push(actions.push())
    const state2 = store.getState()
    expect(state2).toEqual(initial)
  })
})
