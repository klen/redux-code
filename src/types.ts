/* eslint-disable @typescript-eslint/no-explicit-any */

import { Action, AnyAction } from 'redux'

export type IActionBuilder = (...arguments_: any) => AnyAction

export interface IActionsBuilders {
  [index: string]: IActionBuilder
}

export interface IActions {
  build: IActionsBuilders
  types: IActionsTypes
}

export interface IActionsTypes {
  [index: string]: string
}

type GetState = () => any
export type Thunk = (dispatch: Dispatch, getState?: GetState) => any
export type Dispatch = (action: AnyAction | Thunk) => AnyAction
