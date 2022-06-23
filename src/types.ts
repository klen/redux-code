/* eslint-disable @typescript-eslint/no-explicit-any */

import { Action } from 'redux'
import type { ThunkAction } from 'redux-thunk'

export type ActionCreatorResult<TypeName extends string, Result> = Result extends Action
  ? Result
  : Result extends ThunkAction<any, any, any, any>
  ? Result
  : Result extends Promise<infer R>
  ? ThunkAction<Promise<R>, any, never, never>
  : { type: TypeName; payload: Result }

interface ActionCreatorProps<TypeName extends string> {
  type: TypeName
  toString(): TypeName
}

interface ActionCreatorSimple<TypeName extends string, Source>
  extends ActionCreatorProps<TypeName> {
  (): ActionCreatorResult<TypeName, Source>
}

interface ActionCreatorFn<TypeName extends string, Source extends (...args: any) => any>
  extends ActionCreatorProps<TypeName> {
  (...args: Parameters<Source>): ActionCreatorResult<TypeName, ReturnType<Source>>
}

export type ActionCreator<TypeName extends string, Source> = Source extends (...args: any) => any
  ? ActionCreatorFn<TypeName, Source>
  : ActionCreatorSimple<TypeName, Source>

export type MixType<T> = T extends string[] ? { [K in T[number]]: <A>(arg?: A) => A } : T

export type Actions<Prefix extends string, Source> = {
  readonly [K in keyof Source]: K extends string ? ActionCreator<`${Prefix}${K}`, Source[K]> : never
}
