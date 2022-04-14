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

  it('persistReducer', async () => {
    const state = persist(undefined, { type: REHYDRATE, persist: 'test', payload: { value: 7 } })
    expect(state).toEqual({ value: 7 })

    const state2 = persist(undefined, actions.update({ value: 42 }))
    expect(state2).toEqual({ value: 42 })

    await new Promise((resolve) => setTimeout(resolve, 0))
    const stored = await memoryStorage.getItem('test')
    expect(stored).toBe(JSON.stringify(state2))
  })

  it('persistStore', async () => {
    await memoryStorage.setItem('test', JSON.stringify({ value: 'initial' }))

    const store = createStore(persist, {})
    const persistor = persistStore(store)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const state = store.getState()
    expect(state).toEqual({ value: 'initial' })

    store.dispatch(actions.update({ value: 42 }))
    const state2 = store.getState()
    expect(state2).toEqual({ value: 42 })

    await new Promise((resolve) => setTimeout(resolve, 0))
    const stored = await memoryStorage.getItem('test')
    expect(stored).toBe(JSON.stringify(state2))

    persistor.purge('test')
    await new Promise((resolve) => setTimeout(resolve, 0))
    const stored2 = await memoryStorage.getItem('test')
    expect(stored2).toBeUndefined()

    persistor.pause('test')
    store.dispatch(actions.update({ value: 42 }))
    await new Promise((resolve) => setTimeout(resolve, 0))
    const stored3 = await memoryStorage.getItem('test')
    expect(stored3).toBeUndefined()
  })
})
