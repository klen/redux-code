import * as Module from './index'

describe('module', () => {
  it('test exports', () => {
    expect(Module.createReducer).toBeTruthy()
    expect(Module.commonReducer).toBeTruthy()
    expect(Module.initialReducer).toBeTruthy()
    expect(Module.createActions).toBeTruthy()
    expect(Module.buildActionCreator).toBeTruthy()
    expect(Module.skipMiddleware).toBeTruthy()
    expect(Module.SKIP).toBeTruthy()
  })
})
