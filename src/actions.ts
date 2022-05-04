/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Action } from 'redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { Actions, MixType, ActionCreatorResult } from './types'

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
  if (result instanceof Function)
    return (dispatch: ThunkDispatch<any, any, any>) => {
      const action = processResult(type, dispatch(result))
      return dispatch(action)
    }

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
export function createAction<TypeName extends string, Action extends (...args: any[]) => any>(
  type: TypeName,
  action: Action,
) {
  const creator = (...args: unknown[]): ActionCreatorResult<TypeName, ReturnType<Action>> =>
    processResult(type, action(...args))
  creator.type = type as TypeName
  creator.toString = (): TypeName => type
  return creator
}

// taken from https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never

/**
 * A helper to create actions
 */
export function createActions<
  Prefix extends string,
  M extends S[] | Record<S, V>,
  S extends string,
  V extends string | number | boolean | object,
>(prefix: Prefix, mixin: M): Actions<Prefix, MixType<M>>
export function createActions<
  Prefix extends string,
  Ms extends Array<S[] | Record<S, unknown>>, // we have to use any to prevent never
  // Ms extends Array<S[] | Record<S, V>>,
  S extends string,
  // V extends string | number | boolean | object,
>(prefix: Prefix, ...mixins: Ms): Actions<Prefix, UnionToIntersection<MixType<Ms[number]>>>
export function createActions(prefix, ...mixins) {
  const source = Object.assign(
    {},
    ...mixins.map((mix) =>
      Array.isArray(mix) ? Object.fromEntries(mix.map((val) => [val, identity])) : mix,
    ),
  )
  const actions = {}
  // eslint-disable-next-line prefer-const
  for (let [name, payload] of Object.entries(source)) {
    const actionType = `${prefix || ''}${name}`
    const action = payload instanceof Function ? payload.bind(actions) : () => payload
    actions[name] = createAction(actionType, action)
    actions[name].type = actionType
  }
  return actions
}

/**
 * Just a helper to create identity actions
 * createActions('prefix/', {update:identity, save:identity})
 */
export const identity = <T>(arg: T): T => arg

// export function wrapAsync(action: ActionCreator<any>) {
//   const wrapped = function (dispatch: ThunkDispatch<any, any, any>) {}
//   wrapped.pending = createAction(`${action.type}:pending`, () => undefined)
//   wrapped.fulfilled = createAction(`${action.type}:fulfilled`, () => undefined)
//   wrapped.rejected = createAction(`${action.type}:rejected`, (err) => err)
//   return wrapped
// }
