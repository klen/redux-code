import { Middleware, AnyAction } from 'redux'

/**
 *
 * A special object to make an ability to skip actions.
 * This is only can be used with skipMiddleware
 */
export const SKIP: AnyAction = { type: null }

export const skipMiddleware: Middleware = function () {
  return function (next) {
    return function (action) {
      if (action === SKIP) {
        return action
      }
      return next(action)
    }
  }
}
