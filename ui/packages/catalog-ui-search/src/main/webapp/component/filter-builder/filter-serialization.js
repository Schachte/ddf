var Backbone = require('backbone')
var FilterView = require('../filter/filter.view.js')

const CQLUtils = require('../../js/CQLUtils.js')
const metacardDefinitions = require('../singletons/metacard-definitions.js')
const _ = require('underscore')

const FilterBuilderModel = Backbone.Model.extend({
  defaults: {
    operator: 'AND',
    sortableOrder: 0,
  },
  type: 'filter-builder',
})

const FilterModel = Backbone.Model.extend({
  defaults: {
    value: [''],
    type: 'anyText',
    comparator: 'CONTAINS',
    sortableOrder: 0,
  },
  type: 'filter',
})

const comparatorToCQL = {
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
  RELATIVE: '=',
  BETWEEN: 'DURING',
  INTERSECTS: 'INTERSECTS',
  CONTAINS: 'ILIKE',
  MATCHCASE: 'LIKE',
  EQUALS: '=',
  '>': '>',
  '<': '<',
  '=': '=',
  '<=': '<=',
  '>=': '>=',
}

const transformFilter = filter => {
  const { type, value, property } = filter
  if (CQLUtils.isGeoFilter(type)) {
    filter.value = _.clone(filter)
  }

  if (_.isObject(property)) {
    // if the filter is something like NEAR (which maps to a CQL filter function such as 'proximity'),
    // there is an enclosing filter that creates the necessary '= TRUE' predicate, and the 'property'
    // attribute is what actually contains that proximity() call.
    const { filterFunctionName, params } = property

    if (filterFunctionName !== 'proximity') {
      throw new Error(
        'Unsupported filter function in filter view: ' + filterFunctionName
      )
    }

    const [property, distance, value] = params

    return {
      // this is confusing but 'type' on the model is actually the name of the property we're filtering on
      type: property,
      comparator: 'NEAR',
      value: [{ value, distance }],
    }
  }

  let comparator
  const definition = metacardDefinitions.metacardTypes[property]

  if (definition && definition.type === 'DATE' && type === '=') {
    comparator = 'RELATIVE'
  } else {
    for (var key in comparatorToCQL) {
      if (type === comparatorToCQL[key]) {
        comparator = key
        break
      }
    }
  }

  return {
    type: property,
    comparator,
    value: [type === 'DURING' ? `${filter.from}/${filter.to}` : value],
  }
}

const FilterBuilderCollection = Backbone.Collection.extend({
  comparator: 'sortableOrder',
  model(attrs, { collection }) {
    const sortableOrder = collection.length + 1

    if (attrs.filterBuilder === true) {
      const operator = attrs.type
      return new FilterBuilderModel({
        operator,
        sortableOrder,
        filters: new FilterBuilderCollection([defaultJson]),
        ...attrs,
      })
    }

    return new FilterModel({
      sortableOrder,
      ...transformFilter(attrs),
    })
  },
})

// model->json
export const serialize = model => {
  if (model instanceof FilterBuilderModel) {
    const operator = model.get('operator')
    const filters = model.get('filters') || []

    if (operator === 'NONE') {
      return {
        type: 'NOT',
        filters: [
          {
            type: 'AND',
            filters: filters.map(serialize),
          },
        ],
      }
    }
    return {
      type: operator,
      filters: filters.map(serialize).filter(filter => filter),
    }
  }

  if (model instanceof FilterModel) {
    const property = model.get('type')
    const comparator = model.get('comparator')
    const value = model.get('value')[0]

    if (comparator === 'NEAR') {
      return CQLUtils.generateFilterForFilterFunction('proximity', [
        property,
        value.distance,
        value.value,
      ])
    }

    const type = comparatorToCQL[comparator]
    if (metacardDefinitions.metacardTypes[model.get('type')].multivalued) {
      return {
        type: 'AND',
        filters: model
          .get('value')
          .getValue()
          .map(function(currentValue) {
            return CQLUtils.generateFilter(type, property, currentValue)
          }),
      }
    }
    return CQLUtils.generateFilter(
      type,
      property,
      value === undefined ? null : value
    )
  }
}

const defaultJson = {
  value: '',
  type: 'anyText',
  comparator: 'CONTAINS',
}

// json->model
export const deserialize = (filter = defaultJson, model) => {
  if (model === undefined) {
    model = new FilterBuilderModel()
  }

  const { type, filters } = filter

  model.set('operator', type)

  if (!filters) {
    filter = {
      filters: [filter],
      type: 'AND',
    }
  }

  const collection = new FilterBuilderCollection()

  model.set('filters', collection)

  collection.reset(
    filters.map(function(filter) {
      if (filter.filters) {
        return deserialize(filter)
      } else {
        return {
          isResultFilter: model.get('isResultFilter'),
          ...filter,
        }
      }
    })
  )

  return model
}
