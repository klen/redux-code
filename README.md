# redux-code

[![Tests](https://github.com/klen/redux-code/actions/workflows/test.yml/badge.svg)](https://github.com/klen/redux-code/actions/workflows/test.yml)
[![Build](https://github.com/klen/redux-code/actions/workflows/build.yml/badge.svg)](https://github.com/klen/redux-code/actions/workflows/build.yml)
[![npm version](https://badge.fury.io/js/redux-code.svg)](https://badge.fury.io/js/redux-code)

A simple set of tools to make using Redux easier

Features:

* [createReducer](#createreducer) -- A utility to create reducers (with immer support)
* [createActions](#createactions) -- A utility to create actions (with thunk, promises support)
* [skipMiddleware](#skipmiddleware) -- A Redux middleware to add ability to skip actions

## Installation

```bash
npm install --save redux-code
```

## Usage

### createActions

```javascript
import {createActions} from 'redux-code'

const actions = createActions('prefix:', {

    // Basic action creator without payload
    increment: undefined,

    // Basic action creator with payload
    decrement: true,

    // Basic action creator with custom payload
    update: (num) => num,

    // You may call other actions as well
    random: () => (Math.random() < 0.5 ? actions.increment() : actions.decrement()),
})

// Call creators to build actions
expect(actions.increment()).toEqual({ type: 'prefix:increment' })
expect(actions.decrement()).toEqual({ type: 'prefix:decrement', payload: true })
expect(actions.update(42)).toEqual({ type: 'prefix:update', payload: 42 })
expect([actions.increment(), actions.decrement()]).toContainEqual(actions.random())

// Get action types
expect(actions.increment.type).toBe('prefix:increment')
expect(actions.decrement.type).toBe('prefix:decrement')
expect(actions.update.type).toBe('prefix:update')

```

#### Promises and thunks

```javascript
import {SKIP} from 'redux-code'

const actions = createActions('thunk:', {
    
    // Just an update action
    update: (payload) => payload,

    // Use redux-thunk
    init: (dispatch, getState) => {
        const state = getState()
        if (state.inited) return SKIP
        return actions.update({inited: true})
    },

    // Promises also supported
    load: async () => {
        // Just pretend we have an IO call here
        const res = await Promise.resolve(Math.random() * 100 + 1)
        return res
    }

})

store.dispatch(actions.init())
await store.dispatch(actions.load())
```

#### Mixins

You may create and use mixins with different actions.

```javascript
const UpdateMixin = {
    update: (payload) => payload
}

const DisableMixin = {
    // Pay attention that we don't use arrow function here to allow redux-code bind this to a created actions
    disable: async function(dispatch) {
        this.update({disabled: true})
        await self.save()
    }
}
const usersActions = createActions('users/', UpdateMixin, DisableMixin, {
    save: async () => {
        // ...
    }
})
const commentsActions = createActions('comments/', UpdateMixin, DisableMixin, {
    save: async () => {
        // ...
    }
})

expect(usersActions.disable.type).toEqual('users/disable')
expect(commentsActions.disable.type).toEqual('comments/disable')
```

### createReducer

#### Basic Usage

Simplifying Reducers with `createReducer`:

```javascript
import { createReducer } from 'redux-code'

const initial = 42

// instead this
const oldReducer(state=initial, action) {
    switch(action.type) {
        case 'increment':
            return state + 1
        case 'decrement':
            return state - 1
        default:
            return state
    }
}

// Write this
const newReducer = createReducer(initial, {
    // Map actions types to handlers
    increment: (state, action) => state + 1,
    decrement: (state, action) => state - 1,
})

```

Internally `createReducer` uses [Immer](https://github.com/mweststrate/immer)
library, which lets you write code that "mutates" some data, but actually
applies the updates immutably.

#### Using with `createActions`

Sure you may use `createActions` with the `createReducer` together

```javascript
    const actions = createActions('counter/', { increment: undefined, decrement: undefined })

    const reducer = createReducer(initial, {
      [actions.increment]: (state, action) => state + 1,

      // For typescript use `action.type`
      [actions.decrement.type]: (state, action) => state - 1,
    })
```

#### Mixins

You may create and use mixins with your reducers.

```javascript

// Common Reducer, supports reset (reset state) and update (update state with the given payload) actions
const CommonMixinCreator = (initial, actions) => ({
    [actions.reset.type]: (state) => initial,
    [actions.update.type]: (state, { payload }) => ({ ...state, ...payload }),
})

const actions = createActions('users/', {
    reset: true,
    update: (payload) => payload,
    load: () => {
        // ...
    }
})

const initial = {}

// Create a reducer with your mixin
const reducer = createReducer(initial, CommonMixinCreator(initial, actions), {
    // Only define new actions
    [actions.load.type]: (state) => ({ ...state, loaded: Date.now() }),
})

let state = reducer(initial, actions.update({ data: 42 }))
expect(state).toEqual({ data: 42 })
state = reducer(state, actions.reset())
expect(state).toBe(initial)

```

### skipMiddleware

You may use `skipMiddleware` with `SKIP` action to (surprise) skip some actions.
Just return SKIP from actions creators every where you want to skip.

```javascript
import { SKIP, skipMiddleware } from 'redux-code'

// .. Add skipMiddleware to your store

const initial = {}

const actions = createActions('example/', {

    // The actions is skipable by an condition
    conditionalAction: () => {
        // Skip the action
        if (Math.round() < 0.5) return SKIP
        // Or do it as well
        return true
    }

})
```

### Mixins

The package includes some mixins for actions and reducers

#### Common
```javascript
import {commonActions, commonReducer} from 'redux-code'

const actions = createActions('example/', commonActions, {
    // .. your other action creators here
})
const reducer = createReducer(initial, commonReducer(actions, initial), {
    // .. your other actions handlers here
})

// commonActions, commonReducer supports such actions as:
// * reset -- to reset your reducer state
// actions.reset()

// * update -- to update your reducer state from the provided payload
// actions.update({'updates': 'here'})
```

## License

This project is licensed under the MIT license, Copyright (c) 2017 Kirill Klenov. For more information see `LICENSE.md`.

## Acknowledgements

[Dan Abramov](https://github.com/gaearon) for Redux


