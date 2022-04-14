import { createStore } from 'redux'
import { createActions, createReducer, commonReducer } from '.'
import { persistReducer, REHYDRATE, persistStore } from './persist'

export const memoryStorage = (function () {
  const storage = {}
  return {
    setItem: async function (key, value) {
      storage[key] = value
    },
    getItem: async function (key) {
      return storage[key]
    },
  }
})()

describe('persist', () => {
  const initial = { value: null }
  const actions = createActions('test:', ['update', 'reset'])
  const reducer = createReducer(initial, commonReducer(actions, initial))
  const persist = persistReducer({ key: 'test', storage: memoryStorage }, reducer)

  beforeEach(async () => await memoryStorage.setItem('test', undefined))

  it('persistReducer', async () => {
    const state = persist(undefined, { type: REHYDRATE, persist: 'test', payload: { value: 7 } })
    expect(state).toEqual({ value: 7 })

    const state2 = persist(undefined, actions.update({ value: 42 }))
    expect(state2).toEqual({ value: 42 })

    await new Promise((resolve) => setTimeout(resolve, 0))
    const stored = await memoryStorage.getItem('test')
    expect(stored).toBe(JSON.stringify(state2))
  })

  describe('persistStore', () => {
    it('rehydrate unknown', async () => {
      const store = createStore(persist)
      persistStore(store)

      await new Promise((resolve) => setTimeout(resolve, 0))
      const state = store.getState()
      expect(state).toEqual(initial)
    })

    it('rehydrate stored', async () => {
      await memoryStorage.setItem('test', JSON.stringify({ value: 'initial' }))
      const store = createStore(persist, {})
      persistStore(store)

      await new Promise((resolve) => setTimeout(resolve, 0))
      const state = store.getState()
      expect(state).toEqual({ value: 'initial' })
    })

    it('persist', async () => {
      const store = createStore(persist, {})
      persistStore(store)

      store.dispatch(actions.update({ value: 42 }))
      const state = store.getState()
      expect(state).toEqual({ value: 42 })

      await new Promise((resolve) => setTimeout(resolve, 0))
      const stored = await memoryStorage.getItem('test')
      expect(stored).toBe(JSON.stringify(state))
    })

    it('purge', async () => {
      const store = createStore(persist, {})
      const persistor = persistStore(store)

      store.dispatch(actions.update({ value: 42 }))

      persistor.purge('test')
      await new Promise((resolve) => setTimeout(resolve, 0))
      const stored = await memoryStorage.getItem('test')
      expect(stored).toBeUndefined()
    })

    it('pause', async () => {
      await memoryStorage.setItem('test', JSON.stringify({ value: 'initial' }))

      const store = createStore(persist, {})
      const persistor = persistStore(store)

      store.dispatch(actions.update({ value: 42 }))

      persistor.pause('test')
      store.dispatch(actions.update({ value: 77 }))

      await new Promise((resolve) => setTimeout(resolve, 0))
      const stored = await memoryStorage.getItem('test')
      expect(stored).toEqual(JSON.stringify({ value: 42 }))
    })
  })
})
