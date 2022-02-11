/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyAction } from 'redux'

export type Thunk = (dispatch: Dispatch, getState?: GetState) => any
export type Dispatch = (action: AnyAction | Thunk) => AnyAction

export interface ActionCreator<T> {
  type: T
  (...arguments_: any): AnyAction | Thunk
}

// export type ActionCreator = (...arguments_: any) => AnyAction | Thunk

export type Actions<Type> = {
  [K in keyof Type]: ActionCreator<string>
}

type GetState = () => any
