SKIP = {}
identity = (payload) -> payload
isFunction = (v) -> typeof(v) == 'function'

toSnakeCase = (s) ->
    s = s.toString()

    upperCharts = s.match(/[A-Z]/g)
    return s unless upperCharts

    s = s.replace(
        new RegExp("#{c}"),
        "_#{c.toLowerCase()}") for c in upperCharts

    return if s[0] == '_' then s.slice(1) else s

wrapCreator = (creator, type, async) -> (args...) ->
    action = creator(args...)

    # Support redux-thunk middleware
    if isFunction(action)
        return wrapCreator(action, type, true)

    # If creator return SKIP do nothing more
    return if action is SKIP

    unless action and action.type
        action = type: type, payload: action

    return action unless async

    dispatch = args[0]
    result = dispatch(action)
    return if result.payload? then result.payload else result

commonReducer = (TYPES, DEFAULT) ->
    reducers = {}
    reducers[TYPES.UPDATE or 'UPDATE'] = (state, action) -> {state..., action.payload...}
    reducers[TYPES.RESET or 'RESET'] = (state, action) -> DEFAULT
    return reducers

initialReducer = (TYPES) ->
    reducers = {}
    reducers[TYPES.INIT or 'INIT'] = (state, action) -> {state..., inited: true}
    return reducers

createReducer = (TYPES, DEFAULT={}, mixins...) ->
    reducers = {}
    for mixin in mixins
        mixin = mixin(TYPES, DEFAULT) if isFunction(mixin)
        reducers = {reducers..., mixin...}

    (state=DEFAULT, action) ->
        reducer = reducers[action.type] or identity
        return reducer(state, action)

createActions = (creators, prefix, join="/") ->

    created = TYPES: {}

    for name, creator of creators

        actionType = type = toSnakeCase(name).toUpperCase()
        actionType = "#{prefix}#{join}#{actionType}" if prefix

        creator = identity unless isFunction(creator)
        creator = wrapCreator(creator.bind(created), actionType)

        created.TYPES[type] = actionType
        created[name] = creator

    return created

module.exports = {
    SKIP

    createActions

    createReducer
    commonReducer
    initialReducer
}
