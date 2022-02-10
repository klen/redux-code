# redux-code

[![npm version](https://badge.fury.io/js/redux-code.svg)](https://badge.fury.io/js/redux-code)
[![travis build](https://travis-ci.org/klen/redux-code.svg?branch=develop)](https://travis-ci.org/klen/redux-code)

Redux creators for actions and reducers

## Installation

```bash
npm install --save redux-code
```

## Usage

```javascript

import {createActions, SKIP, createReducer} from 'redux-code'


// Generate actions builders
const actions = createActions(

    // Optional prefix for actions types
    'prefix/',

    // Basic actions scheme
    {

        // autogenerate action (payload) => {type: 'init', payload: payload}
        init: true,

        // autogenerate action () => {type: 'custom', payload: payload}
        update: payload => payload,

        // redux-thunk is supported
        doThunk: () => async (dispatch, getState) => {

            // run nearest action
            dispatch(actions.build.update({value: 42}))

            // ability to skip an action
            const state = getState()
            if (state.inited) return SKIP

            // Emulate async io
            await Promise.resolve(true)

            dispatch(actions.build.init())

        }
    
    }
)

// Use your actions
await dispatch(
    actions.doThunk()
)

// Actions types are generated
// actions.types
// actions.types.init ('optional-prefix/init'), actions.types.update ('optional-prefix/update'), actions.types.doThunk ('optional-prefix/doThunk')

// Actions builders are generated
// actions.build
// actions.build.init() ({type: 'prefix/init', payload: true}), actions.build.update(42) ({type: 'prefix/update', payload: 42}), actions.types.doThunk() ...


// You can mix your actions schemas as well
const commonActionsScheme = {
    update: true,
    reset: true
}

const actions = createActions('APP', commonActionsScheme, {
    ...
})


// Let's see how create a reducer
const DEFAULT_STATE = {
    inited: false,
    value: null
}


const reducer = createReducer(DEFAULT_STATE, {
    [actions.types.update]: (state, action) => ({...state, ...action.payload}),
    [actions.types.init]: (state) => ({...state, inited: true})
})


// You can mix your reducers as well
const CommonReducerFactory = (types, DEFAULT) => {
    [types.UPDATE]: (state, action) => {...state, ...action.payload},
    [types.RESET]: (state) => DEFAULT
}

const reducer = createReducer(DEFAULT, CommonReducerFactory(actions.types, DEFAULT), {
    'CUSTOM': (state) => {state..., custom: true}
})

```
