/* eslint-disable @typescript-eslint/no-explicit-any */

import { Actions } from './types'

interface EntitiesState {
  ids: string[]
  entities: Record<string, any>
}

export const entitiesActions = {
  addOne: (entity) => entity,
  addMany: (entities: any[]) => entities,
  updateOne: (entity) => entity,
  updateMany: (entities: any[]) => entities,
  upsertOne: (entity) => entity,
  upsertMany: (entities: any[]) => entities,
  setOne: (entity) => entity,
  setMany: (entities: any[]) => entities,
  setAll: (entities: any[]) => entities,
  removeOne: (entity) => entity,
  removeMany: (entities: any[]) => entities,
  removeAll: () => undefined,
}

export const entitiesReducer = (
  actions: Actions<string, typeof entitiesActions>,
  options: {
    selectId?: (entity) => string
    sortComparer?: (a, b) => number
    processEntity?: (entity) => typeof entity
  } = {},
) => {
  const selectId = options.selectId ?? ((entity) => entity.id)
  const processEntity = (entity) => entity

  function sorter(ids, entities) {
    if (!options.sortComparer) return ids
    return Object.values(entities).sort(options.sortComparer).map(selectId)
  }

  function addMany(items, state: EntitiesState) {
    const entities = Object.fromEntries([
      ...Object.entries(state.entities),
      ...items.map((entity) => [selectId(entity), processEntity(entity)]),
    ])

    return {
      ...state,
      entities,
      ids: sorter([...state.ids, ...items.map(selectId)], entities),
    }
  }

  function updateMany(updates, state: EntitiesState) {
    let entities = state.entities
    for (const entity of updates) {
      const id = selectId(entity)
      if (!(id in entities)) continue
      entities = { ...entities, [id]: { ...entities[id], ...processEntity(entity) } }
    }
    return state.entities === entities ? state : { ...state, entities }
  }

  function setMany(items, state: EntitiesState, strategy = replace) {
    let ids = state.ids
    let entities = state.entities
    for (const entity of items) {
      const id = selectId(entity)
      if (id in entities) entities = strategy(id, processEntity(entity), entities)
      else {
        ids = [...ids, id]
        entities = { ...entities, [id]: entity }
      }
    }
    return { ...state, ids: sorter(ids, entities), entities }
  }

  function removeMany(items, state: EntitiesState) {
    const ids = items.map(selectId)
    return {
      ...state,
      ids: state.ids.filter((id) => !ids.includes(id)),
      entities: Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Object.entries(state.entities).filter(([id, _]) => !ids.includes(id)),
      ),
    }
  }

  return {
    [actions.addOne.type]: (state, { payload }) => addMany([payload], state),
    [actions.addMany.type]: (state, { payload }) => addMany(payload, state),
    [actions.removeOne.type]: (state, { payload }) => removeMany([payload], state),
    [actions.removeMany.type]: (state, { payload }) => removeMany(payload, state),
    [actions.removeAll.type]: (state) => ({ ...state, ids: [], entities: {} }),
    [actions.updateOne.type]: (state, { payload }) => updateMany([payload], state),
    [actions.updateMany.type]: (state, { payload }) => updateMany(payload, state),
    [actions.upsertOne.type]: (state, { payload }) => setMany([payload], state, merge),
    [actions.upsertMany.type]: (state, { payload }) => setMany(payload, state, merge),
    [actions.setOne.type]: (state, { payload }) => setMany([payload], state),
    [actions.setMany.type]: (state, { payload }) => setMany(payload, state),
    [actions.setAll.type]: (state, { payload }) =>
      addMany(payload, { ...state, ids: [], entities: {} }),
  }
}

export const selectEntities = (state: EntitiesState) => state.ids.map((id) => state.entities[id])
export const selectEntitiesTotal = (state: EntitiesState) => state.ids.length

const merge = (id, entity, entities) => ({ ...entities, [id]: { ...entities[id], ...entity } })
const replace = (id, entity, entities) => ({ ...entities, [id]: entity })
