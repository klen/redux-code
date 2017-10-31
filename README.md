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


// Generate actions
const actions = createActions('PREFIX', {

    // autogenerate action (payload) => {type: 'init', payload: payload}
    init: true,

    // autogenerate action () => {type: 'custom', payload: 'payload'}
    custom: => 'payload'

    // redux-thunk is supported
    doAsync: (payload) => (dispatch, getState) =>

        // this points on the actions
        dispatch( this.custom() )

        // ability to skip an action
        state = getState()
        if (state.inited) return SKIP
        
        return axios.get('/some').then( () => dispatch(this.init()) )
    
})

// Use your actions
dispatch(
    actions.doAsync()
).then(...)

// Actions types are generated
// actions.TYPES
// actions.TYPES.INIT ('PREFIX/INIT'), actions.TYPES.CUSTOM ('PREFIX/CUSTOM'), actions.TYPES.DO_ASYNC ('PREFIX/DO_ASYNC')


// You can mix your actions as well
commonActions = {
    update: true,
    reset: true
}

const actions = createActions('APP', commonActions, {
    ...
})


// Let's see how create a reducer

const DEFAULT = {
    inited: false,
    value: null
}


const reducer = createReducer(DEFAULT, {
    [actions.TYPES.UPDATE]: (state, action) => {state..., action.payload...},
    [actions.TYPES.RESET]: (state) => DEFAULT
})


// You can mix your reducers as well

const CommonReducerFactory = (TYPES, DEFAULT) => {
    [TYPES.UPDATE]: (state, action) => {state..., action.payload...},
    [TYPES.RESET]: (state) => DEFAULT
}

const reducer = createReducer(DEFAULT, CommonReducerFactory(actions.TYPES, DEFAULT), {
    'CUSTOM': (state) => {state..., custom: true}
})

```
