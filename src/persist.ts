/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyAction, Reducer, Store } from 'redux'

export const REHYDRATE = 'persist/rehydrate'
export const PURGE = 'persist/purge'
export const PAUSE = 'persist/pause'
export const PERSIST = 'persist/persist'

export const localStorage = createAsyncStorage(globalThis.localStorage)
export const sessionStorage = createAsyncStorage(globalThis.sessionStorage)

export type PersistConfig = {
  /** Persist key (name in storage, persist key in action) */
  key: string

  /** A storage object to save state */
  storage: { setItem: (key: string, value) => Promise<any>; getItem: (key: string) => Promise<any> }

  /** A function to serialize state to storage */
  serialize?: (state) => string

  /** A function to deserialize state from storage */
  deserialize?: (stored: string) => any

  /** A function to compare states */
  compare?: <S>(state: S, oldState: S, action: AnyAction) => boolean

  /** A function to merge states */
  merge?: <S>(stored: S, state: S) => S

  /** Throttle save in ms */
  throttle?: number
}

const PERSISTORS: PersistConfig[] = []

export const persistReducer = (config: PersistConfig, reducer: Reducer) => {
  const { key, storage, serialize, throttle, merge, compare } = config
  const deserialize_ = serialize || JSON.stringify
  const merge_ = merge || ((stored) => stored)
  const throttle_ = throttle || 0
  const compare_ = compare || ((state, oldState) => state !== oldState)

  PERSISTORS.push(config)

  let waitForSave = null
  let toSave = {}
  let isPaused = true

  async function save() {
    const state = toSave
    await storage.setItem(key, deserialize_(state))
    waitForSave = state === toSave ? null : setTimeout(save, throttle_)
  }

  function persist(state) {
    toSave = state
    if (!waitForSave) waitForSave = setTimeout(save, throttle_)
  }

  return (state, action) => {
    if (action.persist !== undefined && action.persist === key) {
      switch (action.type) {
        case REHYDRATE:
          if (action.payload !== undefined) state = merge_(action.payload, state)
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
    if (!isPaused && compare_(newState, state, action)) persist(newState)
    return newState
  }
}

export const persistStore = (store: Store) => {
  // Rehydrate
  for (const cfg of PERSISTORS) {
    const { storage, deserialize, key } = cfg
    storage.getItem(key).then((stored) => {
      store.dispatch({
        type: REHYDRATE,
        payload: stored ? (deserialize || JSON.parse)(stored) : undefined,
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

function createAsyncStorage(storage: Storage) {
  return {
    setItem: (key, value) =>
      new Promise((resolve) => {
        resolve(storage.setItem(key, value))
      }),
    getItem: (key) => new Promise((resolve) => resolve(storage.getItem(key))),
    removeItem: (key) => new Promise((resolve) => resolve(storage.removeItem(key))),
    clear: () => new Promise((resolve) => resolve(storage.clear())),
  }
}
