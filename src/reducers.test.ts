import { createReducer, commonReducer, initialReducer } from '../src'

describe('reducers:', () => {
  it('create reducer', () => {
    expect(createReducer).toBeTruthy()

    const reducer = createReducer(
      0,
      {
        action1: () => 1,
        action2: () => 21,
      },
      {
        action2: () => 22,
      },
    )

    expect(reducer(0, { type: 'action1' })).toBe(1)
    expect(reducer(0, { type: 'action2' })).toBe(22)
  })

  it('common reducer', () => {
    expect(commonReducer).toBeTruthy()

    const defaultState = { value: 'initial' }

    const mixin = commonReducer({}, defaultState)
    expect(mixin).toBeTruthy()
    expect(mixin.reset).toBeTruthy()
    expect(mixin.update).toBeTruthy()

    const reducer = createReducer(defaultState, mixin)
    expect(reducer).toBeTruthy()

    let state = 0
    state = reducer(state, { type: 'update', payload: { value: 'updated' } })
    expect(state).toEqual({ value: 'updated' })

    state = reducer(state, { type: 'reset' })
    expect(state).toEqual(defaultState)
  })

  it('initial reducer', () => {
    expect(initialReducer).toBeTruthy()
    const mixin = initialReducer({})
    expect(mixin).toBeTruthy()
    expect(mixin.init).toBeTruthy()

    const reducer = createReducer({}, mixin)
    expect(reducer).toBeTruthy()
    let state = 0
    state = reducer(state, { type: 'init' })
    expect(state).toEqual({ inited: true })
  })
})
