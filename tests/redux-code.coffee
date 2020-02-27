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

    # Test Redux-thunk
    log = []

    dispatch = (action) ->
        return action(dispatch) if typeof action is 'function'
        log.push(action.type) if action.type
        return action

    dispatch actions.thunkAction()

    test.deepEqual(log, ['TESTS/CUSTOM_ACTION', 'TESTS/THUNK_ACTION'])

    test.deepEqual(actions.skippedAction(), RC.SKIP)

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

    reducer = RC.createReducer DEFAULT,  RC.initialReducer(actions.TYPES), RC.commonReducer(actions.TYPES, DEFAULT), {
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


  'Enchance store': (test) ->

    DEFAULT = value: 'default'
    actions = RC.createActions('TESTS', {'sync', 'multi', 'double'})
    reducer = RC.createReducer DEFAULT, {
        [actions.TYPES.SYNC]: (state) -> { value: 'sync' }
        [actions.TYPES.DOUBLE]: (state) -> {value: state.value * 2}
        [actions.TYPES.MULTI]: (state) -> (schedule) ->
            schedule actions.double()
            schedule actions.double()
            return { value: 1 }
    }

    store = Redux.createStore(reducer, {}, RC.reducerEnhancer)

    store.dispatch actions.sync()
    test.deepEqual(store.getState(), {value: 'sync'})
    store.dispatch actions.multi()
    test.deepEqual(store.getState(), {value: 4})

    actions = RC.createActions('TESTS', {'one', 'two', 'three', 'four', 'reset'})

    reducer = RC.combineReducers

        first: RC.createReducer 0, {

            [actions.TYPES.ONE]: (state, action) -> (schedule) ->
                schedule actions.two()
                schedule actions.four()
                return 1

            [actions.TYPES.TWO]: (state, action) -> (schedule) ->
                return 2

            [actions.TYPES.RESET]: (state, action) ->
                return 0
            
        }

        last: RC.createReducer 0, {

            [actions.TYPES.FOUR]: (state, action) -> (schedule) ->
                schedule actions.three()
                return 4

            [actions.TYPES.THREE]: (state, action) ->
                return 3

            [actions.TYPES.RESET]: (state, action) ->
                return 0

        }

    store = Redux.createStore(reducer, {}, RC.reducerEnhancer)

    store.dispatch actions.one()
    test.deepEqual(store.getState(), {first: 2, last: 3})

    store.dispatch actions.reset()
    test.deepEqual(store.getState(), {first: 0, last: 0})

    test.done()
