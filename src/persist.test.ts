import { createStore } from 'redux'
import { createActions, createReducer, commonReducer } from '.'
import { persistReducer, persistTypes, persistStore, memoryStorage } from './persist'

describe('persist', () => {
  const initial = { value: null }
  const actions = createActions('test:', ['update', 'reset'])
  const reducer = createReducer(initial, commonReducer(actions, initial))
  const persist = persistReducer({ key: 'test', storage: memoryStorage }, reducer)

  beforeEach(async () => await memoryStorage.removeItem('test'))

  it('persistReducer', async () => {
    const state = persist(undefined, {
      type: `${persistTypes.REHYDRATE}/test`,
      persist: 'test',
      payload: { value: 7 },
    })
    expect(state).toEqual({ value: 7 })

    const state2 = persist(undefined, actions.update({ value: 42 }))
    expect(state2).toEqual({ value: 42 })

    await new Promise((resolve) => setTimeout(resolve, 0))
    const stored = await memoryStorage.getItem('test')
    expect(stored).toBe(JSON.stringify(state2))
  })

  describe('persistStore', () => {
    it('delayed setup', async () => {
      const persist = persistReducer({ key: 'delayed' }, reducer)
      const store = createStore(persist)
      await persistStore(store, memoryStorage)

      store.dispatch(actions.update({ value: 42 }))
      const state = store.getState()
      expect(state).toEqual({ value: 42 })

      await new Promise((resolve) => setTimeout(resolve, 0))
      const stored = await memoryStorage.getItem('delayed')
      expect(stored).toBe(JSON.stringify(state))
    })

    it('rehydrate unknown', async () => {
      const store = createStore(persist)
      await persistStore(store)

      const state = store.getState()
      expect(state).toEqual(initial)

      store.dispatch(actions.update({ value: 42 }))
      await new Promise((resolve) => setTimeout(resolve, 0))
      const stored = await memoryStorage.getItem('test')
      expect(stored).toBe(JSON.stringify({ value: 42 }))
    })

    it('rehydrate null', async () => {
      await memoryStorage.setItem('test', '')
      const store = createStore(persist)
      await persistStore(store)

      const state = store.getState()
      expect(state).toEqual(initial)

      store.dispatch(actions.update({ value: 42 }))
      await new Promise((resolve) => setTimeout(resolve, 0))
      const stored = await memoryStorage.getItem('test')
      expect(stored).toBe(JSON.stringify({ value: 42 }))
    })

    it('rehydrate stored', async () => {
      await memoryStorage.setItem('test', JSON.stringify({ value: 'initial' }))
      const store = createStore(persist, initial)
      await persistStore(store)

      const state = store.getState()
      expect(state).toEqual({ value: 'initial' })
    })

    it('rehydrate again', async () => {
      await memoryStorage.setItem('test', JSON.stringify({ value: 'initial' }))
      const store = createStore(persist, initial)
      const persistor = persistStore(store)
      await persistor

      const state = store.getState()
      expect(state).toEqual({ value: 'initial' })

      await memoryStorage.setItem('test', JSON.stringify({ value: 'another' }))
      await persistor.rehydrate()
      const state2 = store.getState()
      expect(state2).toEqual({ value: 'another' })
    })

    it('persist', async () => {
      const store = createStore(persist, initial)
      persistStore(store)

      store.dispatch(actions.update({ value: 42 }))
      const state = store.getState()
      expect(state).toEqual({ value: 42 })

      await new Promise((resolve) => setTimeout(resolve, 0))
      const stored = await memoryStorage.getItem('test')
      expect(stored).toBe(JSON.stringify(state))
    })

    it('purge', async () => {
      const store = createStore(persist, initial)
      const persistor = persistStore(store)

      store.dispatch(actions.update({ value: 42 }))
      await new Promise((resolve) => setTimeout(resolve, 0))

      persistor.purge('test')
      const stored = await memoryStorage.getItem('test')
      expect(stored).toBeUndefined()
    })

    it('pause', async () => {
      await memoryStorage.setItem('test', JSON.stringify({ value: 'initial' }))

      const store = createStore(persist, initial)
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
