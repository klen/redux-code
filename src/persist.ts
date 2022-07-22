/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyAction, Reducer, Store } from 'redux'

/**
 *
 * Types of persist actions
 */
export const persistTypes = {
  /** Rehydrate an reducer */
  REHYDRATE: 'persist/rehydrate',

  /** All reducers were completely rehydrated */
  COMPLETE: 'persist/complete',

  /** Purge an reducer state */
  PURGE: 'persist/purge',

  /** Pause an reducer persistence */
  PAUSE: 'persist/pause',

  /** Resume an reducer persistence */
  RESUME: 'persist/resume',
} as const

type PersistStorage = {
  setItem: (key: string, value) => Promise<void>
  getItem: (key: string) => Promise<any>
  removeItem: (key: string) => Promise<void>
}

export type PersistConfig = {
  /**
   *
   * Persist key (name in storage, persist key in action)
   */
  key: string

  /**
   *
   * Storage to use
   */
  storage?: PersistStorage

  /**
   *
   * Rehydrate reducer state
   */
  serialize?: (state) => string

  /**
   *
   * Deserialize function
   */
  deserialize?: (stored: string) => any

  /**
   *
   * A function to compare different states
   */
  compare?: <S>(state: S, oldState: S, action: AnyAction) => boolean

  /** A function to merge states */
  merge?: <S>(stored: S, state: S) => S

  /** Throttle save in ms */
  throttle?: number
}

const PERSISTORS: PersistConfig[] = []

/**
 *
 * Create a mixin for a reducer that adds the ability to handle persistence.
 * @param {config} config The configuration.
 * @param {reducer} reducer The reducer to handle.
 */
export function persistReducer<S = any, A extends AnyAction = AnyAction>(
  config: PersistConfig,
  reducer: Reducer<S, A>,
): Reducer<S, A> {
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
        case `${persistTypes.REHYDRATE}/${key}`:
          if (action.payload !== undefined) state = merge(action.payload, state)
          isPaused = false
          break

        case `${persistTypes.PURGE}/${key}`:
          config.storage.removeItem(key)
          return state

        case `${persistTypes.PAUSE}/${key}`:
          isPaused = true
          break

        case `${persistTypes.RESUME}/${key}`:
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

/**
 *
 * Create a store enhancer that rehydrates the state of reducers
 * @param {store} store The store to enhance.
 * @param {storage} storage The storage to use.
 */
export function persistStore(store: Store, storage?: PersistStorage) {
  function rehydrate() {
    return Promise.all(
      PERSISTORS.map((cfg) => {
        const { deserialize, key } = cfg
        cfg.storage = cfg.storage === undefined ? storage : cfg.storage
        if (!cfg.storage)
          throw `Persistent reducer (${key}) doesn't have a storage and no default storage is provided`
        return cfg.storage.getItem(key).then((stored) => {
          store.dispatch({
            type: `${persistTypes.REHYDRATE}/${key}`,
            payload: stored ? (deserialize || JSON.parse)(stored) : undefined,
            persist: key,
          })
        })
      }),
    ).then(() => store.dispatch({ type: persistTypes.COMPLETE }))
  }
  const promise = rehydrate()
  return {
    rehydrate,
    then: promise.then.bind(promise),
    purge: (key?: string) => dispatchByKey(store.dispatch, { type: persistTypes.PURGE }, key),
    pause: (key?: string) => dispatchByKey(store.dispatch, { type: persistTypes.PAUSE }, key),
    resume: (key?: string) => dispatchByKey(store.dispatch, { type: persistTypes.RESUME }, key),
  }
}

const dispatchByKey = (
  dispatch,
  action: { type: typeof persistTypes[keyof typeof persistTypes]; payload?: any },
  key?: string,
) => {
  for (const cfg of PERSISTORS) {
    if (key === undefined || cfg.key === key)
      dispatch({ ...action, type: `${action.type}/${cfg.key}`, persist: cfg.key })
  }
}

function createAsyncStorage(storage: Storage) {
  return {
    setItem: (key, value) =>
      new Promise<void>((resolve) => {
        resolve(storage.setItem(key, value))
      }),
    getItem: (key) => new Promise<string>((resolve) => resolve(storage.getItem(key))),
    removeItem: (key) => new Promise<void>((resolve) => resolve(storage.removeItem(key))),
    clear: () => new Promise<void>((resolve) => resolve(storage.clear())),
  }
}

/**
 *
 * Create a storage that uses localStorage
 */
export const localStorage = createAsyncStorage(globalThis.localStorage)
/**
 *
 * Create a storage that uses sessionStorage
 */
export const sessionStorage = createAsyncStorage(globalThis.sessionStorage)
/**
 *
 * Create a storage that uses memory
 */
export const memoryStorage = (function () {
  const storage = {}
  return {
    setItem: async function (key, value) {
      storage[key] = String(value)
    },
    getItem: async function (key) {
      return storage[key]
    },
    removeItem: async function (key) {
      delete storage[key]
    },
  }
})()
