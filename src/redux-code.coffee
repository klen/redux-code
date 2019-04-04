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

# Wrap results into actions with types and payloads
wrapCreator = (type, creator) -> (args...) ->
  action = creator(args...)

  return {type} unless action

  return SKIP if action is SKIP

  # Support redux-thunk middleware
  if isFunction(action)
      m = wrapCreator(type, action)
      return (dispatch, args...) -> dispatch m(dispatch, args...)

  # Support promises (requires redux-thunk)
  if isFunction(action.then)
    m = wrapCreator(type, identity)
    return (dispatch) -> action.then (a) ->
        dispatch m(a)
        return a

  return if action.type then action else type: type, payload: action

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

  for creator in creators
    for name, actionCreator of creator

      actionType = type = toSnakeCase(name).toUpperCase()
      actionType = "#{prefix}#{DEFAULTS.JOIN}#{actionType}" if prefix

      actionCreator = identity unless isFunction(actionCreator)
      actionCreator = wrapCreator(actionType, actionCreator.bind(created))

      created.TYPES[type] = actionType
      created[name] = actionCreator

  return created

skipMiddleware = (store) -> (next) -> (action) -> next(action) unless action.type is null
reducerEnhancer = (createStore) -> (reducer, args...) ->
    queue = []
    schedule = (action) -> queue.push(action)

    enhancedReducer = (state, action) ->
        state = reducer(state, action)
        state = state(schedule, store.getState) if isFunction(state)
        return state

    store = createStore(enhancedReducer, args...)
    return {
        store...,
        dispatch: (action) ->
            action = store.dispatch(action)
            while next = queue.shift()
                action = store.dispatch(next)
            return action
    }

module.exports = {
  SKIP
  DEFAULTS

  skipMiddleware
  reducerEnhancer

  createActions

  createReducer
  commonReducer
  initialReducer
}
