import { createActions, SKIP, createReducer } from '../src'
import thunk from 'redux-thunk'
import { skipMiddleware } from '../src'

describe('readme', () => {
  const store = global.createStore(thunk, skipMiddleware)
  beforeEach(store.reset)

  it('test examples', async () => {
    const actions = createActions('optional-prefix/', {
      init: true,

      update: (payload) => payload,

      doThunk: () => async (dispatch, getState) => {
        // run nearest action
        dispatch(actions.update({ value: 42 }))

        // ability to skip an action
        const state = getState()
        if (state.inited) return SKIP

        // Emulate async io
        await Promise.resolve(true)

        dispatch(actions.init())
      },
    })
    expect(actions).toBeTruthy()

    await store.dispatch(actions.doThunk())
    const logs = store.getActions()
    expect(logs).toEqual([
      { type: 'optional-prefix/update', payload: { value: 42 } },
      { type: 'optional-prefix/init', payload: true },
    ])

    const DEFAULT_STATE = {
      inited: false,
      value: null,
    }

    const reducer = createReducer(DEFAULT_STATE, {
      [actions.init.type]: (state) => ({ ...state, inited: true }),
      [actions.update.type]: (state, action) => ({
        ...state,
        ...action.payload,
      }),
    })
    expect(reducer).toBeTruthy()

    let state = reducer(undefined, actions.init())
    expect(state).toEqual({ inited: true, value: null })
    state = reducer(state, actions.update({ value: 42 }))
    expect(state).toEqual({ inited: true, value: 42 })
  })
})
