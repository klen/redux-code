import { skipMiddleware } from '../src'
import { SKIP } from '../src'

describe('middleware', () => {
  const store = global.createStore(skipMiddleware)
  beforeEach(store.reset)

  it('skip', () => {
    store.dispatch({ type: 'test' })
    store.dispatch(SKIP)
    const actions = store.getActions()
    expect(actions).toEqual([{ type: 'test' }])
  })
})
