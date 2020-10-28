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
processRes = (type, res) ->
    return {type} unless res
    return res if res is SKIP

    # Support redux-thunk middleware
    if isFunction(res)
        return (dispatch) ->
            res = processRes(type, dispatch(res))
            return res if res is SKIP
            return dispatch(res)

    # Support promises (requires redux-thunk)
    if isFunction(res.then)
        return (dispatch) ->
            value = await res
            res = processRes(type, value)
            dispatch(res) unless res is SKIP
            return value

    res = { type, payload: res } unless res.type
    return res

buildCreator = (type, creator) ->
    fn = (args...) -> processRes type, creator(args...)
    fn.rcAction = true
    return fn

createActions = (prefix, creators...) ->

  created = TYPES: {}
  creator = Object.assign(creators...)

  for name, actionCreator of creator

    actionType = type = toSnakeCase(name).toUpperCase()
    actionType = "#{prefix}#{DEFAULTS.JOIN}#{actionType}" if prefix

    actionCreator = identity unless isFunction(actionCreator)
    actionCreator = buildCreator(actionType, actionCreator.bind(created)) unless actionCreator.rcAction

    created.TYPES[type] = actionType
    created[name] = actionCreator

  return created

commonReducer = (actions, DEFAULT) ->
  reducers = {}
  reducers[actions.TYPES.UPDATE or 'UPDATE'] = (state, action) -> {state..., action.payload...}
  reducers[actions.TYPES.RESET or 'RESET'] = (state, action) -> DEFAULT
  return reducers

initialReducer = (actions) ->
  reducers = {}
  reducers[actions.TYPES.INIT or 'INIT'] = (state, action) -> {state..., inited: true}
  return reducers

createReducer = (DEFAULT={}, mixins...) ->
  reducers = {}
  reducers = {reducers..., mixin...} for mixin in mixins

  (state=DEFAULT, action) ->
    reducer = reducers[action.type]
    return if reducer then reducer(state, action) else state

skipMiddleware = (store) -> (next) -> (action) -> next(action) unless action.type is null

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

  createActions

  createReducer
  commonReducer
  initialReducer

  skipMiddleware
  combineReducers
}
