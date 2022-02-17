/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Action } from 'redux'
import { ThunkAction } from 'redux-thunk'

type StringKeys<Object> = Extract<keyof Object, string>

export type ActionCreatorReturn<TypeName extends string, Result> = Result extends Action
  ? Result
  : Result extends (dispatch, getState: () => any, extraArgument: infer Arg) => infer R
  ? ThunkAction<R, any, Arg, any>
  : Result extends Promise<infer R>
  ? ThunkAction<R, any, never, never>
  : { type: TypeName; payload: Result }

export interface ActionCreator<TypeName extends string, Result> {
  type: TypeName
  toString(): TypeName
  (...args: any): ActionCreatorReturn<TypeName, Result>
}

export type MixType<T> = T extends string[]
  ? { [K in T[number]]: undefined }
  : { [K in Extract<keyof T, string>]: T[K] }

export type Actions<Prefix extends string, Source> = {
  readonly [K in StringKeys<Source>]: ActionCreator<
    `${Prefix}${K}`,
    Source[K] extends (...args: any) => infer R ? R : Source[K]
  >
}
