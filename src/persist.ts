/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyAction, Reducer, Store } from 'redux'

export const REHYDRATE = 'persist/rehydrate'
export const PURGE = 'persist/purge'
export const PAUSE = 'persist/pause'
export const PERSIST = 'persist/persist'
export type PersistTypes = typeof REHYDRATE | typeof PURGE | typeof PAUSE | typeof PERSIST

export const localStorage = createAsyncStorage(globalThis.localStorage)
export const sessionStorage = createAsyncStorage(globalThis.sessionStorage)

type PersistStorage = {
  setItem: (key: string, value) => Promise<any>
  getItem: (key: string) => Promise<any>
}

export type PersistConfig = {
  /** Persist key (name in storage, persist key in action) */
  key: string

  /** A storage object to save state */
  storage?: PersistStorage

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

export function persistReducer(config: PersistConfig, reducer: Reducer) {
  const { key } = config
  const serialize = config.serialize || JSON.stringify
  const merge = config.merge || ((stored) => stored)
  const throttle = config.throttle || 0
  const compare = config.compare || ((state, oldState) => state !== oldState)

  let waitForSave = null
  let toSave = {}
  let isPaused = true

  async function save() {
    const state = toSave
    await config.storage.setItem(key, serialize(state))
    waitForSave = state === toSave ? null : setTimeout(save, throttle)
  }

  function persist(state) {
    toSave = state
    if (!waitForSave) waitForSave = setTimeout(save, throttle)
  }

  PERSISTORS.push(config)

  return (state, action) => {
    if (action.persist !== undefined && action.persist === key) {
      switch (action.type) {
        case `${REHYDRATE}/${key}`:
          if (action.payload !== undefined) state = merge(action.payload, state)
          isPaused = false
          break

        case `${PURGE}/${key}`:
          persist(undefined)
          return state

        case `${PAUSE}/${key}`:
          isPaused = true
          break

        case `${PERSIST}/${key}`:
          isPaused = false
          break

        default:
          break
      }
    }
    const newState = reducer(state, action)
    if (!isPaused && compare(newState, state, action)) persist(newState)
    return newState
  }
}

/** @param storage a default storage */
export function persistStore(store: Store, storage?: PersistStorage) {
  // Rehydrate
  for (const cfg of PERSISTORS) {
    const { deserialize, key } = cfg
    cfg.storage = cfg.storage ?? storage
    if (!cfg.storage)
      throw `Persistent reducer (${key}) doesn't have a storage and no default storage is provided`
    cfg.storage.getItem(key).then((stored) => {
      store.dispatch({
        type: `${REHYDRATE}/${key}`,
        payload: stored ? (deserialize || JSON.parse)(stored) : undefined,
        persist: key,
      })
    })
  }
  return {
    purge: (key?: string) => dispatchByKey(store.dispatch, { type: PURGE }, key),
    pause: (key?: string) => dispatchByKey(store.dispatch, { type: PAUSE }, key),
    persist: (key?: string) => dispatchByKey(store.dispatch, { type: PERSIST }, key),
  }
}

const dispatchByKey = (dispatch, action: { type: PersistTypes; payload?: any }, key?: string) => {
  for (const cfg of PERSISTORS) {
    if (key === undefined || cfg.key === key)
      dispatch({ ...action, type: `${action.type}/${cfg.key}`, persist: cfg.key })
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
