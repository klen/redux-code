/* eslint-disable @typescript-eslint/no-explicit-any */

import thunk from 'redux-thunk'
import { createActions, buildActionCreator, SKIP } from '../src'
import { skipMiddleware } from '../src'

describe('actions:', () => {
  it('build creator', () => {
    expect(buildActionCreator).toBeTruthy()

    const action1 = buildActionCreator('test1', (v: any) => v)
    expect(action1).toBeTruthy()
    expect(action1.type).toBe('test1')
    expect(action1(22)).toEqual({ type: 'test1', payload: 22 })

    const action2 = buildActionCreator('test2', () => 42)
    expect(action2.type).toBe('test2')
    expect(action2()).toEqual({ type: 'test2', payload: 42 })
  })

  it('create actions', () => {
    expect(createActions).toBeTruthy()
    const actions = createActions('prefix:', { testOne: 11 }, { test2: 22 })
    expect(actions).toBeTruthy()
    expect(actions.testOne.type).toBe('prefix:testOne')
    expect(actions.test2.type).toBe('prefix:test2')
    expect(actions.testOne()).toEqual({
      type: actions.testOne.type,
      payload: 11,
    })
    expect(actions.test2()).toEqual({
      type: actions.test2.type,
      payload: 22,
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
    const action = buildActionCreator('test', (v: number) => (v > 10 ? v / 10 : SKIP))
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
      store.dispatch(actions.thunk(false))
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
      })
      await store.dispatch(actions.asyncAction())
      await Promise.resolve(true)
      const log = store.getActions()
      expect(log).toEqual([{ type: 'test/asyncAction', payload: 42 }])
    })
  })
})
