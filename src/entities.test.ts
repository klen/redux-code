import { createReducer, createActions } from '.'
import { entitiesActions, entitiesReducer, selectEntities, selectEntitiesTotal } from './entities'

describe('entities', () => {
  const actions = createActions('base', entitiesActions)
  const initial = { ids: [], entities: {} }
  const reducer = createReducer(
    initial,
    entitiesReducer(actions, {
      sortComparer: (a, b) => a.order - b.order,
    }),
  )

  it('entitiesActions', () => {
    expect(actions).toBeTruthy()
    expect(actions.addOne).toBeTruthy()
    expect(actions.addMany).toBeTruthy()
    expect(actions.updateOne).toBeTruthy()
    expect(actions.updateMany).toBeTruthy()
    expect(actions.upsertOne).toBeTruthy()
    expect(actions.upsertMany).toBeTruthy()
    expect(actions.setOne).toBeTruthy()
    expect(actions.setMany).toBeTruthy()
    expect(actions.setAll).toBeTruthy()
    expect(actions.removeOne).toBeTruthy()
    expect(actions.removeMany).toBeTruthy()
    expect(actions.removeAll).toBeTruthy()
  })

  it('entitiesReducer', () => {
    expect(reducer).toBeTruthy()
  })

  it('addOne', () => {
    const item = { id: '1', body: 'b1' }
    const state = reducer(initial, actions.addOne(item))
    expect(state).toEqual({ ids: [item.id], entities: { [item.id]: item } })
  })

  it('addMany', () => {
    const item1 = { id: '1', body: 'b1', order: 2 }
    const item2 = { id: '2', body: 'b2', order: 1 }
    const state = reducer(initial, actions.addMany([item1, item2]))
    expect(state).toEqual({
      ids: [item2.id, item1.id],
      entities: { [item1.id]: item1, [item2.id]: item2 },
    })
  })

  it('updateOne', () => {
    const item = { id: '1', body: 'b1' }
    const state = reducer(initial, actions.addOne(item))
    const state2 = reducer(state, actions.updateOne({ id: 'unknown', body: 'updated' }))
    expect(state2.entities).toBe(state.entities)

    const state3 = reducer(state, actions.updateOne({ id: item.id, body: 'updated' }))
    expect(state3).toEqual({
      ids: state.ids,
      entities: { [item.id]: { ...item, body: 'updated' } },
    })
  })

  it('updateMany', () => {
    const item1 = { id: '1', body: 'b1', order: 1 }
    const item2 = { id: '2', body: 'b2', order: 2 }
    const state = reducer(initial, actions.addMany([item1, item2]))
    const state2 = reducer(
      state,
      actions.updateMany([
        { id: item1.id, body: 'updated', order: 2 },
        { id: item2.id, body: 'updated', order: 1 },
      ]),
    )
    expect(state2).toEqual({
      ids: [item2.id, item1.id],
      entities: {
        [item1.id]: { ...item1, body: 'updated', order: 2 },
        [item2.id]: { ...item2, body: 'updated', order: 1 },
      },
    })
  })

  it('upsertOne', () => {
    const item = { id: '1', body: 'b1' }
    const state = reducer(initial, actions.upsertOne(item))
    expect(state).toEqual({ ids: [item.id], entities: { [item.id]: item } })

    const state2 = reducer(state, actions.upsertOne({ id: item.id, more: 'updated' }))
    expect(state2).toEqual({
      ids: state.ids,
      entities: { [item.id]: { ...item, more: 'updated' } },
    })
  })

  it('upsertMany', () => {
    const item1 = { id: '1', body: 'b1' }
    const item2 = { id: '2', body: 'b2' }
    const state = reducer(initial, actions.upsertMany([item1, item2]))
    expect(state).toEqual({
      ids: [item1.id, item2.id],
      entities: { [item1.id]: item1, [item2.id]: item2 },
    })
    const state2 = reducer(
      state,
      actions.upsertMany([
        { id: item1.id, more: 'updated' },
        { id: item2.id, more: 'updated' },
      ]),
    )
    expect(state2).toEqual({
      ids: state.ids,
      entities: {
        [item1.id]: { ...item1, more: 'updated' },
        [item2.id]: { ...item2, more: 'updated' },
      },
    })
  })

  it('setOne', () => {
    const item = { id: '1', body: 'b1' }
    const state = reducer(initial, actions.setOne(item))
    expect(state).toEqual({ ids: [item.id], entities: { [item.id]: item } })
    const state2 = reducer(state, actions.setOne({ id: item.id, more: 'updated' }))
    expect(state2).toEqual({
      ids: state.ids,
      entities: { [item.id]: { id: item.id, more: 'updated' } },
    })
  })

  it('setMany', () => {
    const item1 = { id: '1', body: 'b1' }
    const item2 = { id: '2', body: 'b2' }
    const state = reducer(initial, actions.setMany([item1, item2]))
    expect(state).toEqual({
      ids: [item1.id, item2.id],
      entities: { [item1.id]: item1, [item2.id]: item2 },
    })
    const state2 = reducer(
      state,
      actions.setMany([
        { id: item1.id, more: 'updated' },
        { id: item2.id, more: 'updated' },
      ]),
    )
    expect(state2).toEqual({
      ids: state.ids,
      entities: {
        [item1.id]: { id: item1.id, more: 'updated' },
        [item2.id]: { id: item2.id, more: 'updated' },
      },
    })
  })

  it('setAll', () => {
    const item1 = { id: '1', body: 'b1' }
    const item2 = { id: '2', body: 'b2' }
    const state = reducer(initial, actions.addMany([item1, item2]))
    const state2 = reducer(state, actions.setAll([item1]))
    expect(state2).toEqual({
      ids: [item1.id],
      entities: {
        [item1.id]: item1,
      },
    })
  })

  it('removeOne', () => {
    const item1 = { id: '1', body: 'b1' }
    const item2 = { id: '2', body: 'b2' }
    const state = reducer(initial, actions.addMany([item1, item2]))
    const state2 = reducer(state, actions.removeOne(item2))
    expect(state2).toEqual({
      ids: [item1.id],
      entities: {
        [item1.id]: item1,
      },
    })
  })

  it('removeMany', () => {
    const item1 = { id: '1', body: 'b1' }
    const item2 = { id: '2', body: 'b2' }
    const state = reducer(initial, actions.addMany([item1, item2]))
    const state2 = reducer(state, actions.removeMany([item2]))
    expect(state2).toEqual({
      ids: [item1.id],
      entities: {
        [item1.id]: item1,
      },
    })
  })

  it('removeAll', () => {
    const item1 = { id: '1', body: 'b1' }
    const item2 = { id: '2', body: 'b2' }
    const state = reducer(initial, actions.addMany([item1, item2]))
    const state2 = reducer(state, actions.removeAll())
    expect(state2).toEqual({
      ids: [],
      entities: {},
    })
  })

  it('selectEntities', () => {
    const item1 = { id: '1', body: 'b1' }
    const item2 = { id: '2', body: 'b2' }
    const state = reducer(initial, actions.addMany([item1, item2]))
    expect(selectEntities(state)).toEqual([item1, item2])
  })

  it('selectEntitiesTotal', () => {
    const item1 = { id: '1', body: 'b1' }
    const item2 = { id: '2', body: 'b2' }
    const state = reducer(initial, actions.addMany([item1, item2]))
    expect(selectEntitiesTotal(state)).toBe(2)
  })
})
