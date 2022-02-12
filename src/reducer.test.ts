import { createReducer } from './reducer'

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

  it('immutability', () => {
    const initial = { data: [], value: false }
    const reducer = createReducer(initial, {
      push: (state: typeof initial) => {
        state.data.push(state.data.length)
        return state
      },
      update: (state: typeof initial) => {
        state.value = !state.value
        return state
      },
    })
    let state = reducer(undefined, { type: 'any' })
    expect(state).toBe(initial)
    state = reducer(state, { type: 'any' })
    expect(state).toBe(initial)
    state = reducer(state, { type: 'push' })
    expect(state).not.toBe(initial)
    expect(state).toEqual({ data: [0], value: false })
    const state1 = state
    state = reducer(state, { type: 'push' })
    expect(state).not.toBe(state1)
    state = reducer(state, { type: 'update' })
    expect(state).toEqual({ data: [0, 1], value: true })
  })
})
