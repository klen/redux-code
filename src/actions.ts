/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Action, AnyAction } from 'redux'
import { Actions, Dispatch, Thunk, ActionCreator } from './types'

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
function processResult(type: string, result: Promise<any>): Thunk
function processResult<T extends string, R extends undefined>(type: T, result: R): { type: T }
function processResult<T extends string, R>(type: T, result: R): { type: T; payload: R }
function processResult(type: string, result: any) {
  // Support redux-thunk
  if (result instanceof Function) return result

  // Support promises with redux-thunk
  if (result instanceof Promise)
    return (dispatch: Dispatch) => {
      result.then((value: any) => {
        const result = processResult(type, value)
        dispatch(result)
      })
    }

  if (result === undefined) return { type }
  if (result.type !== undefined) return result

  return { type, payload: result }
}

/**
 * Build an action creator
 */
export function buildActionCreator(type: string, payload: any) {
  const action = payload instanceof Function ? payload : () => payload
  const creator = (...args: unknown[]) => processResult(type, action(...args))
  creator.toString = () => `${type}`
  creator.type = creator.toString()
  return creator
}

/**
 * A helper to create actions
 */
export function createActions<M1>(prefix: string, m1: M1): Actions<M1>
export function createActions<M1, M2>(prefix: string, m1: M1, m2: M2): Actions<M1 & M2>
export function createActions<M1, M2, M3>(prefix: string, m1: M1, m2: M2, m3: M3): Actions<M1 & M2 & M3>
export function createActions<M1, M2, M3, M4>(prefix: string, m1: M1, m2: M2, m3: M3): Actions<M1 & M2 & M3 & M4>
export function createActions<M1, M2, M3, M4, M5>(prefix: string, m1: M1, m2: M2, m3: M3): Actions<M1 & M2 & M3 & M4 & M5>
export function createActions(prefix: string, ...mixins: any[]) {
  const source = Object.assign({}, ...mixins)
  const actions = {}
  for (const [name, payload] of Object.entries(source)) {
    const actionType = `${prefix || ''}${name}`
    actions[name] = buildActionCreator(actionType, payload).bind(actions)
    actions[name].type = actionType
  }
  return actions
}
