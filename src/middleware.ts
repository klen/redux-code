import { Middleware } from 'redux'
import { SKIP } from './actions'

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
