import * as Module from './index'

describe('module', () => {
  it('test exports', () => {
    // Actions
    expect(Module.createActions).toBeTruthy()
    expect(Module.buildActionCreator).toBeTruthy()
    expect(Module.SKIP).toBeTruthy()
    // Reducer
    expect(Module.createReducer).toBeTruthy()
    // Middleware
    expect(Module.skipMiddleware).toBeTruthy()
    // Mixins
    expect(Module.commonReducer).toBeTruthy()
    expect(Module.initReducer).toBeTruthy()
    expect(Module.commonActions).toBeTruthy()
  })
})
