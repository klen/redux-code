/* eslint-disable @typescript-eslint/no-explicit-any */

import { Actions } from './types'

interface EntitiesState<Entity = any> {
  ids: string[]
  entities: Record<string, Entity>
}

export const entitiesActions = {
  /**
   * Creates an action to add a new entity to the store.
   * @param {entity} entity The entity to add.
   */
  addOne: (entity) => entity,
  /**
   * Creates an action to add multiple entities to the store.
   * @param {entities} entities The entities to add.
   */
  addMany: (entities: any[]) => entities,
  /**
   * Creates an action to update an entity in the store.
   * @param {entity} entity The entity to update.
   */
  updateOne: (entity) => entity,
  /**
   * Creates an action to update multiple entities in the store.
   * @param {entities} entities The entities to update.
   */
  updateMany: (entities: any[]) => entities,
  /**
   * Creates an action to insert or update an entity in the store.
   * @param {entity} entity The entity to insert or update.
   */
  upsertOne: (entity) => entity,
  /**
   * Create an action to insert or update multiple entities in the store.
   * @param {entities} entities The entities to insert or update.
   */
  upsertMany: (entities: any[]) => entities,
  /**
   * Creates an action to replace an entity in the store.
   * @param {entity} entity The entity to replace.
   */
  setOne: (entity) => entity,
  /**
   * Creates an action to replace multiple entities in the store.
   * @param {entities} entities The entities to replace.
   */
  setMany: (entities: any[]) => entities,
  /**
   * Creates an action to replace all entities in the store.
   * @param {entities} entities The entities to replace.
   */
  setAll: (entities: any[]) => entities,
  /**
   * Creates an action to remove an entity from the store.
   * @param {entity} entity The entity to remove.
   */
  removeOne: (entity) => entity,
  /**
   * Creates an action to remove multiple entities from the store.
   * @param {entities} entities The entities to remove.
   */
  removeMany: (entities: any[]) => entities,
  /**
   * Creates an action to remove all entities from the store.
   */
  removeAll: () => undefined,
}

/**
 * Create a mixin for a reducer that adds the ability to handle entities.
 * @param {actions} actions The actions to handle.
 * @param {config} config The configuration.
 */
export const entitiesReducer = (
  actions: Actions<string, typeof entitiesActions>,
  {
    processEntity = (entity) => entity,
    selectId = (entity) => entity.id,
    sortComparer,
    updateComparer = (a, b) => a === b,
  }: {
    processEntity?: <T>(entity: T) => T
    selectId?: (entity: any) => any
    sortComparer?: (a, b) => number
    updateComparer?: <T>(a: T, b: T) => boolean
  } = {},
) => {
  function merge(id, entity, entities) {
    const source = entities[id]
    if (updateComparer(source, entity)) return entities
    return { ...entities, [id]: { ...source, ...entity } }
  }

  function sorter(ids, entities) {
    if (!sortComparer) return ids
    return Object.values(entities).sort(sortComparer).map(selectId)
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
    for (let entity of updates) {
      const id = selectId(entity)
      if (!(id in entities)) continue
      const source = entities[id]
      entity = processEntity(entity)
      if (!updateComparer(entity, source))
        entities = { ...entities, [id]: { ...source, ...entity } }
    }
    if (state.entities === entities) return state
    return {
      ...state,
      entities,
      ids: sorter(state.ids, entities),
    }
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
    [actions.setAll.type]: (state, { payload }) => {
      const items = payload.map((item) => {
        const id = selectId(item)
        return updateComparer(item, state.entities[id]) ? state.entities[id] : item
      })
      return addMany(items, { ...state, ids: [], entities: {} })
    },
  }
}

/**
 * Select the entities from the state.
 * @param {state} state The state.
 */
export const selectEntities = <Entity>(state: EntitiesState<Entity>) =>
  state.ids.map((id) => state.entities[id])
/**
 * Select the entity with the given id from the state.
 * @param {state} state The state.
 */
export const selectEntityById = <Entity>(state: EntitiesState<Entity>, id) => state.entities[id]
/**
 * Select the total number of entities in the state.
 * @param {state} state The state.
 */
export const selectEntitiesTotal = (state: EntitiesState) => state.ids.length

// const merge = (id, entity, entities) => ({ ...entities, [id]: { ...entities[id], ...entity } })
const replace = (id, entity, entities) => ({ ...entities, [id]: entity })
