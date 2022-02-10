import * as Redux from 'redux'
import testsEnhancer from 'redux-testing'

const createStore = (...middlewares: Redux.Middleware[]) => {
  return Redux.createStore(
    (state = {}) => state,
    {},
    Redux.compose(testsEnhancer, Redux.applyMiddleware(...middlewares)),
  )
}

global.createStore = createStore
