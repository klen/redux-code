identity = (payload) -> payload
isFunction = (v) -> typeof(v) == 'function'

snakeCase = (s) ->
    s = s.toString()

    upperCharts = s.match(/[A-Z]/g)
    return s unless upperCharts

    s = s.replace(
        new RegExp("#{c}"),
        "_#{c.toLowerCase()}") for c in upperCharts

    return if s[0] == '_' then s.slice(1) else s


SKIP = {}

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
    dispatch(action)
    return


createActions = (creators, prefix, join="/") ->

    created = TYPES: {}

    for name, creator of creators

        actionType = type = snakeCase(name).toUpperCase()
        actionType = "#{prefix}#{join}#{actionType}" if prefix

        creator = identity unless isFunction(creator)
        creator = wrapCreator(creator.bind(created), actionType)

        created.TYPES[type] = actionType
        created[name] = creator

    return created

module.exports = {SKIP, createActions}
