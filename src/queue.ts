import { AnyAction, Dispatch } from 'redux'

let DISPATCH: Dispatch | undefined = undefined
let DISPATCHING = false

export const queue: AnyAction[] = []

export function push(action) {
  if (DISPATCHING || !DISPATCH) return queue.push(action)
  return DISPATCH(action)
}

export const clear = () => queue.splice(0, queue.length)

export function middleware({ dispatch }) {
  DISPATCH = dispatch
  return (next) => (action) => {
    try {
      DISPATCHING = true
      return next(action)
    } finally {
      DISPATCHING = false
      if (queue.length > 0) {
        const action = queue.shift()
        if (action) dispatch(action)
      }
    }
  }
}
