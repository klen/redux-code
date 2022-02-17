/* eslint-disable @typescript-eslint/no-explicit-any */

import thunk from 'redux-thunk'
import { createActions, createAction, SKIP, identity } from '../src'
import { skipMiddleware } from '../src'

describe('actions', () => {
  it('createAction', () => {
    expect(createAction).toBeTruthy()

    const action1 = createAction('test1', identity)
    expect(action1).toBeTruthy()
    expect(action1.type).toBe('test1')
    expect(action1(22)).toEqual({ type: 'test1', payload: 22 })

    const action2 = createAction('test2', () => 42)
    expect(action2.type).toBe('test2')
    expect(action2()).toEqual({ type: 'test2', payload: 42 })
  })

  describe('createActions', () => {
    it('basic1', () => {
      const actions = createActions('prefix:', {
        action1: 1,
        action2: (payload) => payload,
        action3: () => ({ type: 'custom' }),
      })
      expect(actions).toBeTruthy()
      expect(actions.action1.type).toBe('prefix:action1')
      const test1 = actions.action1()
      expect(test1).toEqual({
        type: actions.action1.type,
        payload: 1,
      })
      const test2 = actions.action2(42)
      expect(test2).toEqual({
        type: actions.action2.type,
        payload: 42,
      })
      const test3 = actions.action3()
      expect(test3).toEqual({
        type: 'custom',
      })
    })
    it('basic2', () => {
      const actions = createActions('prefix:', ['action1', 'action2'])
      expect(actions).toBeTruthy()
      expect(actions.action1.type).toBe('prefix:action1')
      expect(actions.action2.type).toBe('prefix:action2')
      const test1 = actions.action1()
      expect(test1).toEqual({ type: actions.action1.type })
      const test2 = actions.action2()
      expect(test2).toEqual({ type: actions.action2.type })
    })
    it('mixins1', () => {
      const actions = createActions('prefix:', { action1: 11 }, { action2: 22 }, { action2: 23 })
      expect(actions.action1()).toEqual({
        type: actions.action1.type,
        payload: 11,
      })
      expect(actions.action2()).toEqual({
        type: actions.action2.type,
        payload: 23,
      })
    })
    it('mixins2', () => {
      const actions = createActions('prefix:', { action1: 11 }, ['action2'])
      const test1 = actions.action1()
      expect(test1).toEqual({
        type: actions.action1.type,
        payload: 11,
      })
      const test2 = actions.action2(42)
      expect(test2).toEqual({
        type: actions.action2.type,
        payload: 42,
      })
    })
  })

  it('actions scope', () => {
    const actions = createActions('test/', {
      testOne: 'testOne',
      testTwo: function () {
        return this.testOne()
      },
    })
    expect(actions.testOne()).toEqual({
      type: 'test/testOne',
      payload: 'testOne',
    })
    expect(actions.testTwo()).toEqual({
      type: 'test/testOne',
      payload: 'testOne',
    })
  })

  it('skip', () => {
    const action = createAction('test', (v: number) => (v > 10 ? v / 10 : SKIP))
    expect(action(5)).toEqual(SKIP)
    expect(action(15)).toEqual({ type: 'test', payload: 1.5 })
  })

  describe('redux-thunk', () => {
    const store = global.createStore(thunk, skipMiddleware)

    beforeEach(store.reset)

    it('thunk', () => {
      const actions = createActions('test/', {
        action: true,
        thunk: (cond: boolean) => (dispatch: typeof store.dispatch) => {
          cond ? dispatch(actions.action()) : false
        },
      })
      const test1 = actions.thunk(false)
      store.dispatch(test1)
      store.dispatch(actions.thunk(true))

      const log = store.getActions()
      expect(log).toEqual([
        { type: actions.thunk.type },
        { type: actions.action.type, payload: true },
        { type: actions.thunk.type },
      ])
    })

    it('async', async () => {
      const actions = createActions('test/', {
        asyncAction: async () => {
          await Promise.resolve(true)
          return 42
        },
        asyncErr: async () => {
          throw { error: true }
        },
      })
      const test1 = actions.asyncAction()
      await store.dispatch(test1)
      await Promise.resolve(true)
      const log = store.getActions()
      expect(log).toEqual([
        // { type: 'test/asyncAction:pending' },
        // { type: 'test/asyncAction:fulfilled' },
        { type: 'test/asyncAction', payload: 42 },
      ])
      // store.reset()
      //
      // await store.dispatch(actions.asyncErr())
      // await Promise.resolve(true)
      // log = store.getActions()
      // expect(log).toEqual([
      //   // { type: 'test/asyncErr:pending' },
      //   // { type: 'test/asyncErr:rejected', payload: { error: true } },
      // ])
    })
  })
})
