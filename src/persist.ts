/* eslint-disable @typescript-eslint/no-explicit-any */

import { Reducer, Store } from 'redux'

export const REHYDRATE = 'persist/rehydrate'
export const PURGE = 'persist/purge'
export const PAUSE = 'persist/pause'
export const PERSIST = 'persist/persist'

export const localStorage = createAsyncStorage(globalThis.localStorage)
export const sessionStorage = createAsyncStorage(globalThis.sessionStorage)

export type PersistConfig = {
  key: string
  storage: { setItem: (key: string, value) => Promise<any>; getItem: (key: string) => Promise<any> }
  stringify?: (state) => string
  parse?: (stored: string) => any
  merge?: <S>(stored: S, state: S) => S
  throttle?: number
}

const PERSISTORS: PersistConfig[] = []

export const persistReducer = (config: PersistConfig, reducer: Reducer) => {
  const { key, storage, stringify, throttle, merge } = config
  const stringify_ = stringify || JSON.stringify
  const merge_ = merge || ((stored) => stored)

  PERSISTORS.push(config)

  let timeout = null
  let toSave = undefined
  let isPaused = true

  function persist(state) {
    toSave = state
    if (!timeout) timeout = setTimeout(storeState, throttle || 0)
  }

  async function storeState() {
    const state = toSave
    await storage.setItem(key, stringify_(state))
    timeout = null
    if (state !== toSave) persist(toSave)
    return state
  }

  return (state, action) => {
    if (action.persist !== undefined && action.persist === key) {
      switch (action.type) {
        case REHYDRATE:
          state = merge_(action.payload, state)
          isPaused = false
          break

        case PURGE:
          persist(undefined)
          return state

        case PAUSE:
          isPaused = true
          break

        case PERSIST:
          isPaused = false
          break

        default:
          break
      }
    }
    const newState = reducer(state, action)
    if (state != newState && !isPaused) persist(newState)
    return newState
  }
}

export const persistStore = (store: Store) => {
  // Rehydrate
  for (const cfg of PERSISTORS) {
    const { storage, parse, key } = cfg
    const parse_ = parse || JSON.parse
    storage.getItem(key).then((stored) => {
      if (!stored) return
      store.dispatch({
        type: REHYDRATE,
        payload: parse_(stored),
        persist: key,
      })
    })
  }
  return {
    purge: (key) => dispatchByKey(store.dispatch, PURGE, key),
    pause: (key) => dispatchByKey(store.dispatch, PAUSE, key),
    persist: (key) => dispatchByKey(store.dispatch, PERSIST, key),
  }
}

const dispatchByKey = (dispatch, type, key: string | undefined) => {
  for (const cfg of PERSISTORS) {
    if (key === undefined || cfg.key === key) dispatch({ type, persist: key })
  }
}

function createAsyncStorage(storage) {
  return {
    setItem: (key, value) =>
      new Promise((resolve) => {
        resolve(storage.setItem(key, value))
      }),
    getItem: (key) => new Promise((resolve) => resolve(storage.getItem(key))),
  }
}
