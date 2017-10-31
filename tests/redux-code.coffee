RC = require('../src/redux-code.coffee')

exports.ReduxCode =

  'Create actions': (test) ->

    actions = RC.createActions 'TESTS', {
      'select', 'update'

      customAction: -> 'custom'

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
      type: 'TESTS/MIXIN_ACTION', payload: undefined
    )

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