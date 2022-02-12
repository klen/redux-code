/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Action, AnyAction } from 'redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { Actions, ActionCreator } from './types'

/**
 * SKIP actions
 */
export const SKIP: AnyAction = { type: null }

/**
 * Process a result from an action creator
 * @param type an action type
 * @param result a result from action creator
 */
function processResult<R extends Action | Function>(type: string, result: R): R
function processResult(type: string, result: Promise<any>): ThunkAction<any, any, any, any>
function processResult<T extends string, R extends undefined>(type: T, result: R): { type: T }
function processResult<T extends string, R>(type: T, result: R): { type: T; payload: R }
function processResult(type: string, result: any) {
  // Support redux-thunk
  if (result instanceof Function) return result

  // Support promises with redux-thunk
  if (result instanceof Promise)
    return (dispatch: ThunkDispatch<any, any, any>) =>
      result.then((value: any) => {
        const action = processResult(type, value)
        return dispatch(action)
      })

  if (result === undefined) return { type }
  if (result.type !== undefined) return result

  return { type, payload: result }
}

/**
 * Build an action creator
 */
export function buildActionCreator(type: string, action: Function) {
  const creator = (...args: unknown[]) => processResult(type, action(...args))
  creator.type = `${type}`
  creator.toString = () => `${type}`
  return creator
}

/**
 * A helper to create actions
 */
export function createActions<Prefix extends string, M1>(prefix: Prefix, m1: M1): Actions<M1, Prefix>
export function createActions<Prefix extends string, M1, M2>(prefix: Prefix, m1: M1, m2: M2): Actions<M1 & M2, Prefix> // prettier-ignore
export function createActions<Prefix extends string, M1, M2, M3>(prefix: Prefix, m1: M1, m2: M2, m3: M3): Actions<M1 & M2 & M3, Prefix> // prettier-ignore
export function createActions<Prefix extends string, M1, M2, M3, M4>(prefix: Prefix, m1: M1, m2: M2, m3: M3, m4: M4): Actions<M1 & M2 & M3 & M4, Prefix> // prettier-ignore
export function createActions<Prefix extends string, M1, M2, M3, M4, M5>(prefix: Prefix, m1: M1, m2: M2, m3: M3, m4: M4, m5: M5): Actions<M1 & M2 & M3 & M4 & M5, Prefix> // prettier-ignore
export function createActions(prefix: string, ...mixins: any[]) {
  const source = Object.assign({}, ...mixins)
  const actions = {}
  // eslint-disable-next-line prefer-const
  for (let [name, payload] of Object.entries(source)) {
    const actionType = `${prefix || ''}${name}`
    const action = payload instanceof Function ? payload.bind(actions) : () => payload
    actions[name] = buildActionCreator(actionType, action)
    actions[name].type = actionType
  }
  return actions
}
