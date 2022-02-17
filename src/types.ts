/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Action } from 'redux'
import { ThunkAction } from 'redux-thunk'

type ThunkActionAny = ThunkAction<any, any, any, any>
type StringKeys<Object> = Extract<keyof Object, string>

export type ActionCreatorReturn<Result, TypeName extends string> = Result extends Action | Function
  ? Result
  : Result extends Promise<any>
  ? ThunkActionAny
  : { type: TypeName; payload: Result }

export interface ActionCreator<Result, TypeName extends string = string> {
  type: TypeName
  toString(): TypeName
  (...args: any): ActionCreatorReturn<Result, TypeName>
}

export type Actions<Type, Prefix extends string = string> = {
  [K in StringKeys<Type>]: ActionCreator<
    Type[K] extends (...args: never[]) => any ? ReturnType<Type[K]> : Type[K],
    `${Prefix}${K}`
  >
}
