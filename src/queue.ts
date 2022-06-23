import { AnyAction, Dispatch } from 'redux'

let DISPATCH: Dispatch | undefined = undefined
let DISPATCHING = false

export const queue: AnyAction[] = []

/**
 *
 * Dispatch an action to the store.
 * @param {action} action The action to dispatch.
 * @returns {action} The action.
 */
export function push(action) {
  if (DISPATCHING || !DISPATCH) return queue.push(action)
  return DISPATCH(action)
}

/**
 *
 * Clear the queue.
 */
export const clear = () => queue.splice(0, queue.length)

/**
 *
 * Create middleware that dispatches actions from the queue.
 */
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
