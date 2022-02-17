/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createActions, SKIP, createReducer } from '../src'
import thunk from 'redux-thunk'
import { skipMiddleware } from '../src'

describe('readme', () => {
  const store = global.createStore(thunk, skipMiddleware)
  beforeEach(store.reset)

  it('createActions1', () => {
    const actions = createActions('prefix/', {
      // Basic action creator without payload
      action1: undefined,

      // Basic action creator with static payload
      action2: true,

      // Basic action creator with dynamic payload
      action3: (num) => num,

      // You may return other actions as well
      random: () => (Math.random() < 0.5 ? actions.action1() : actions.action2()),
    })

    // Call creators to build actions
    expect(actions.action1()).toEqual({ type: 'prefix/action1' })
    expect(actions.action2()).toEqual({ type: 'prefix/action2', payload: true })
    expect(actions.action3(42)).toEqual({ type: 'prefix/action3', payload: 42 })
    expect([actions.action1(), actions.action2()]).toContainEqual(actions.random())

    // Get action types
    expect(actions.action1.type).toBe('prefix/action1')
    expect(actions.action2.type).toBe('prefix/action2')
    expect(actions.action3.type).toBe('prefix/action3')

    const actions2 = createActions('prefix/', ['init', 'update'])

    expect(actions2.init()).toEqual({ type: 'prefix/init' })
    expect(actions2.update(42)).toEqual({ type: 'prefix/update', payload: 42 })
  })

  it('createActions2', async () => {
    const actions = createActions('thunk:', {
      // Just an update action
      update: (payload) => payload,

      // Use redux-thunk
      init: () => (dispatch, getState) => {
        const state = getState()
        if (!state.inited) dispatch(actions.update({ inited: true }))
      },

      // Promises also supported
      load: async () => {
        // Just pretend we have an IO call here
        const res = await Promise.resolve(Math.random() * 100 + 1)
        return res
      },
    })
    store.dispatch(actions.init())
    expect(store.getActions()).toEqual([
      { type: actions.update.type, payload: { inited: true } },
      { type: actions.init.type },
    ])

    store.reset()
    const res = await store.dispatch(actions.load())
    expect(res.payload).toBeGreaterThan(0)
  })

  it('createActions3', async () => {
    const UpdateMixin = {
      update: (payload) => payload,
    }

    const DisableMixin = {
      // Pay attention that we don't use arrow function here to allow redux-code bind this to a created actions
      disable: function () {
        return async (dispatch) => {
          dispatch(this.update({ disabled: true }))
          await dispatch(this.save())
        }
      },
    }
    const usersActions = createActions('users/', UpdateMixin, DisableMixin, {
      save: async () => {
        // ...
      },
    })
    const commentsActions = createActions('comments/', UpdateMixin, DisableMixin, {
      save: async () => {
        // ...
      },
    })
    expect(usersActions.disable.type).toEqual('users/disable')
    expect(commentsActions.disable.type).toEqual('comments/disable')

    await store.dispatch(usersActions.disable())
    expect(store.getActions()).toEqual([
      { type: 'users/update', payload: { disabled: true } },
      { type: 'users/save' },
      { type: 'users/disable' },
    ])
  })

  it('createReducer', async () => {
    const initial = 42
    const reducer = createReducer(initial, {
      increment: (state, action) => state + 1,
      decrement: (state, action) => state - 1,
    })
    let state = reducer(initial, { type: 'increment' })
    expect(state).toBe(43)
    state = reducer(state, { type: 'decrement' })
    expect(state).toBe(42)
  })

  it('createReducer2', async () => {
    const actions = createActions('counter/', { increment: undefined, decrement: undefined })
    const initial = 42
    const reducer = createReducer(initial, {
      [actions.increment.type]: (state, action) => state + 1,
      [actions.decrement.type]: (state, action) => state - 1,
    })
    let state = reducer(initial, actions.increment())
    expect(state).toBe(43)
    state = reducer(state, actions.decrement())
    expect(state).toBe(42)
  })

  it('createReducer3', async () => {
    const CommonMixinCreator = (initial, actions) => ({
      [actions.reset.type]: (state) => initial,
      [actions.update.type]: (state, { payload }) => ({ ...state, ...payload }),
    })
    const actions = createActions('users/', {
      reset: true,
      update: (payload) => payload,
      load: () => async (dispatch) => {
        const result = await Promise.resolve({ data: 42 })
        dispatch(actions.update(result))
        return { type: actions.load.type }
      },
    })
    const initial = {}
    const reducer = createReducer(initial, CommonMixinCreator(initial, actions), {
      [actions.load.type]: (state) => ({ ...state, loaded: Date.now() }),
    })
    let state = reducer(initial, actions.update({ data: 42 }))
    expect(state).toEqual({ data: 42 })
    state = reducer(state, actions.reset())
    expect(state).toBe(initial)
  })
})
