SKIP = type: null
DEFAULTS = JOIN: '/'

identity = (payload) -> payload
isFunction = (v) -> typeof(v) is 'function'

toSnakeCase = (s) ->
  s = s.toString()

  upperCharts = s.match(/[A-Z]/g)
  return s unless upperCharts

  s = s.replace(
    new RegExp("#{c}"),
    "_#{c.toLowerCase()}") for c in upperCharts

  return if s[0] == '_' then s.slice(1) else s

# Decorate results into actions with types and payloads
buildCreator = (type, creator) -> (args...) ->

    # Run creator
    res = creator(args...)

    return {type} unless res
    return res if res is SKIP

    # Support redux-thunk middleware
    if isFunction(res)
        fn = buildCreator(type, res)
        return (dispatch, getState, extra) ->
            res = fn(dispatch, getState, extra)
            return res if res is SKIP
            dispatch res

    # Support promises (requires redux-thunk)
    if isFunction(res.then)
        fn = buildCreator(type, identity)
        return (dispatch) ->
            r = await res
            res = fn(r)
            dispatch(res) unless res is SKIP
            return r

    res = { type, payload: res } unless res.type
    return res

commonReducer = (TYPES, DEFAULT) ->
  reducers = {}
  reducers[TYPES.UPDATE or 'UPDATE'] = (state, action) -> {state..., action.payload...}
  reducers[TYPES.RESET or 'RESET'] = (state, action) -> DEFAULT
  return reducers

initialReducer = (TYPES) ->
  reducers = {}
  reducers[TYPES.INIT or 'INIT'] = (state, action) -> {state..., inited: true}
  return reducers

createReducer = (DEFAULT={}, mixins...) ->
  reducers = {}
  reducers = {reducers..., mixin...} for mixin in mixins

  (state=DEFAULT, action) ->
    reducer = reducers[action.type]
    return if reducer then reducer(state, action) else state

createActions = (prefix, creators...) ->

  created = TYPES: {}
  creator = Object.assign(creators...)

  for name, actionCreator of creator

    actionType = type = toSnakeCase(name).toUpperCase()
    actionType = "#{prefix}#{DEFAULTS.JOIN}#{actionType}" if prefix

    actionCreator = identity unless isFunction(actionCreator)
    actionCreator = buildCreator(actionType, actionCreator.bind(created))

    created.TYPES[type] = actionType
    created[name] = actionCreator

  return created

skipMiddleware = (store) -> (next) -> (action) -> next(action) unless action.type is null
reducerEnhancer = (createStore) -> (reducer, initialState, enhancer) ->
    queue = []
    schedule = (action) -> queue.push(action)

    enhancedReducer = (state, action) ->
        state = reducer(state, action)
        state = state(schedule, store.getState) if isFunction(state)
        return state

    store = createStore(enhancedReducer, initialState, enhancer)
    return {
        store...,
        dispatch: (action) ->
            action = store.dispatch(action)
            while next = queue.shift()
                action = store.dispatch(next)
            return action
    }

combineReducers = (reducers) -> (state={}, action) ->
    hasChanged = false
    nextState = {}
    callbacks = []

    for k, r of reducers
        previousReducerState = state[k]
        nextReducerState = r(previousReducerState, action)
        nextState[k] = nextReducerState
        if isFunction(nextReducerState)
            callbacks.push(k)
            continue

        hasChanged = hasChanged or nextReducerState != previousReducerState

    if callbacks.length
        return (schedule, getState) ->
            for k in callbacks
                nextState[k] = nextState[k](schedule, getState)
            return nextState

    return if hasChanged then nextState else state


module.exports = {
  SKIP
  DEFAULTS

  skipMiddleware
  reducerEnhancer
  combineReducers

  createActions

  createReducer
  commonReducer
  initialReducer
}
