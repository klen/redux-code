import { createReducer, createActions } from '.'
import { commonReducer, initReducer, commonActions } from './mixins'

describe('mixins:', () => {
  it('commonReducer,commonActions', () => {
    expect(commonActions).toBeTruthy()
    expect(commonReducer).toBeTruthy()

    const defaultState = { value: 'default' }

    const actions = createActions('test/', commonActions, {
      another: () => true,
    })
    expect(actions.update).toBeTruthy()
    expect(actions.reset).toBeTruthy()

    const mixin = commonReducer(actions, defaultState)
    expect(mixin).toBeTruthy()
    expect(mixin[actions.reset.type]).toBeTruthy()
    expect(mixin[actions.update.type]).toBeTruthy()

    const reducer = createReducer(defaultState, mixin)
    expect(reducer).toBeTruthy()

    let state = defaultState
    state = reducer(state, actions.update({ value: 'updated' }))
    expect(state).toEqual({ value: 'updated' })

    state = reducer(state, actions.reset())
    expect(state).toEqual(defaultState)
  })

  it('initReducer', () => {
    expect(initReducer).toBeTruthy()

    const defaultState = { inited: false }

    const actions = createActions('test/', { init: undefined, another: () => false })
    expect(actions.init).toBeTruthy()

    const mixin = initReducer(actions)
    expect(mixin).toBeTruthy()
    expect(mixin[actions.init.type]).toBeTruthy()

    const reducer = createReducer(defaultState, mixin)
    expect(reducer).toBeTruthy()
    const state = reducer(defaultState, actions.init())
    expect(state).toEqual({ inited: true })
  })
})
