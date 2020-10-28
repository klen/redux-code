RC = require('../src/redux-code.coffee')
Redux = require('redux')

exports.ReduxCode =

  'Create actions': (test) ->

    actions = RC.createActions 'TESTS', {
      'select', 'update'

      customAction: -> 'custom'

      thunkAction: -> (dispatch) =>
          dispatch @customAction()
          return 'thunk'

      promiseAction: -> Promise.resolve('promise')

      thunkPromiseAction: -> (dispatch) -> Promise.resolve('tp')

      skippedAction: -> return RC.SKIP

    }, { 'mixinAction' }

    test.ok(actions)
    test.ok(actions.TYPES)
    test.equal(actions.TYPES.SELECT, 'TESTS/SELECT')
    test.equal(actions.TYPES.CUSTOM_ACTION, 'TESTS/CUSTOM_ACTION')

    test.deepEqual(actions.select('payload'),
      type: 'TESTS/SELECT', payload: 'payload'
    )
    test.deepEqual(actions.customAction('some'),
      type: 'TESTS/CUSTOM_ACTION', payload: 'custom'
    )
    test.deepEqual(actions.mixinAction(),
      type: 'TESTS/MIXIN_ACTION'
    )
    test.deepEqual(actions.skippedAction(), RC.SKIP)

    log = []
    logMiddleware = (store) -> (next) -> (action) ->
        log.push(action.type)
        return next(action)

    { dispatch } = Redux.createStore(((state) -> state), {}, Redux.applyMiddleware(require('redux-thunk').default, logMiddleware))

    # Test Redux-thunk
    dispatch actions.thunkAction()
    test.deepEqual(log, ['TESTS/CUSTOM_ACTION', 'TESTS/THUNK_ACTION'])

    actions2 = RC.createActions 'tests2',
        thunkAction2: actions.thunkAction

    log.length = 0
    dispatch actions2.thunkAction2()
    test.deepEqual(log, ['TESTS/CUSTOM_ACTION', 'TESTS/THUNK_ACTION'])

    # Test Promises
    log.length = 0
    res = dispatch actions.promiseAction()
    res.then (r) ->
        test.deepEqual(r, 'promise')
        test.deepEqual(log, ['TESTS/PROMISE_ACTION'])

    test.done()

  'Create reducers': (test) ->

    actions = RC.createActions('TESTS', {'init', 'update', 'reset', 'custom'})

    DEFAULT = value: 'default'

    reducer = RC.createReducer DEFAULT,  RC.initialReducer(actions), RC.commonReducer(actions, DEFAULT), {
      "#{actions.TYPES.CUSTOM}": (state, action) -> {state..., value: 'custom'}
    }

    state = reducer(undefined, type: null)
    test.deepEqual(state, DEFAULT)

    state = reducer(state, type: 'TESTS/INIT')
    test.ok(state.inited)

    state = reducer(state, type: 'TESTS/UPDATE', payload: value: 'updated')
    test.equal(state.value, 'updated')

    state = reducer(state, type: 'TESTS/RESET')
    test.deepEqual(state, DEFAULT)

    state = reducer(state, type: 'TESTS/CUSTOM')
    test.equal(state.value, 'custom')

    test.done()
