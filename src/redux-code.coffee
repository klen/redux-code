SKIP = {}
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

  # If creator return SKIP do nothing more
  return if action is SKIP

  # Support redux-thunk middleware
  if isFunction(action)
      m = wrapCreator(type, action)
      return (dispatch, getState) ->
          dispatch m(dispatch, getState)

  # Support promises (requires redux-thunk)
  if isFunction(action.then)
    m = wrapCreator(type, identity)
    return (dispatch) -> action.then (a) -> dispatch m(a)

  unless action.type
    action = type: type, payload: action

  return action

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

module.exports = {
  SKIP
  DEFAULTS

  createActions

  createReducer
  commonReducer
  initialReducer
}
