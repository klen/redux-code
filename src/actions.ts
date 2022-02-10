/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import isPlainObject from 'lodash-es/isPlainObject'
import { Action, AnyAction } from 'redux'
import { IActionsTypes } from '.'
import { IActions, Dispatch, Thunk } from './types'

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
export function buildActionCreator<P extends Action>(type: string, payload: P): () => P
export function buildActionCreator<T extends string, P extends Function>(
  type: T,
  payload: P,
): (...args) => P
export function buildActionCreator<T extends string, P extends Exclude<any, Function>>(
  type: T,
  payload: P,
): () => { type: T; payload: P }
export function buildActionCreator(type: string, payload: any) {
  if (isPlainObject(payload) && payload.type) return () => payload
  const action = payload instanceof Function ? payload : () => payload
  return (...args: unknown[]) => processResult(type, action(...args))
}

/**
 * A helper to create actions
 */
export function createActions<M1>(prefix: string, m1: M1): { types: IActionsTypes; build: M1 }
export function createActions<M1, M2>(
  prefix: string,
  m1: M1,
  m2: M2,
): { types: IActionsTypes; build: M1 & M2 }
export function createActions<M1, M2, M3>(
  prefix: string,
  m1: M1,
  m2: M2,
  m3: M3,
): { types: IActionsTypes; build: M1 & M2 & M3 }
export function createActions<M1, M2, M3, M4>(
  prefix: string,
  m1: M1,
  m2: M2,
  m3: M3,
  m4: M4,
): { types: IActionsTypes; build: M1 & M2 & M3 & M4 }
export function createActions<M1, M2, M3, M4, M5>(
  prefix: string,
  m1: M1,
  m2: M2,
  m3: M3,
  m4: M4,
  m5: M5,
): { types: IActionsTypes; build: M1 & M2 & M3 & M4 & M5 }
export function createActions(prefix: string, ...mixins: object[]): IActions {
  const actions: IActions = { types: {}, build: {} }
  const source = Object.assign({}, ...mixins)
  for (const [name, payload] of Object.entries(source)) {
    const actionType = `${prefix || ''}${name}`
    actions.build[name] = buildActionCreator(actionType, payload).bind(actions)
    actions.types[name] = actionType
  }
  return actions
}

const actions = createActions(
  'test',
  {
    indent: () => 42,
    some: () => 12,
  },
  {
    diff: () => 77,
  },
)
const test = actions.build.indent()
