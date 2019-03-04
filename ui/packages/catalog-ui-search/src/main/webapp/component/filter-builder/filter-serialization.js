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

function CQLtoComparator() {
  var comparator = {}
  for (var key in comparatorToCQL) {
    comparator[comparatorToCQL[key]] = key
  }
  return comparator
}

function getComparatorForFilter(filter) {
  const propertyDefinition = metacardDefinitions.metacardTypes[filter.property]
  if (
    propertyDefinition &&
    propertyDefinition.type === 'DATE' &&
    filter.type === '='
  ) {
    return 'RELATIVE'
  } else {
    return CQLtoComparator()[filter.type]
  }
}

function setFilterFromFilterFunction(filter) {
  if (filter.filterFunctionName === 'proximity') {
    var property = filter.params[0]
    var distance = filter.params[1]
    var value = filter.params[2]

    return {
      value: [
        {
          value: value,
          distance: distance,
        },
      ],
      // this is confusing but 'type' on the model is actually the name of the property we're filtering on
      type: property,
      comparator: 'NEAR',
    }
  } else {
    throw new Error(
      'Unsupported filter function in filter view: ' + filterFunctionName
    )
  }
}

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

function transformFilter(filter) {
  if (CQLUtils.isGeoFilter(filter.type)) {
    filter.value = _.clone(filter)
  }
  if (_.isObject(filter.property)) {
    // if the filter is something like NEAR (which maps to a CQL filter function such as 'proximity'),
    // there is an enclosing filter that creates the necessary '= TRUE' predicate, and the 'property'
    // attribute is what actually contains that proximity() call.
    setFilterFromFilterFunction(filter.property)
  } else {
    let value = [filter.value]
    if (filter.type === 'DURING') {
      value = [`${filter.from}/${filter.to}`]
    }
    return {
      value,
      type: filter.property,
      comparator: getComparatorForFilter(filter),
    }
  }
}

// json->model
export const deserialize = (model, json = defaultJson) => {
  if (model === undefined) {
    model = new FilterBuilderModel()
  }

  if (!json.filters) {
    json = {
      filters: [json],
      type: 'AND',
    }
  }
  model.set('operator', json.type)

  const collection = new FilterBuilderCollection()

  model.set('filters', collection)

  json.filters.forEach(function(filter) {
    if (filter.filters) {
      collection.push(deserialize(undefined, filter))
    } else {
      collection.push({
        isResultFilter: Boolean(model.get('isResultFilter')),
        ...filter,
      })
    }
  })

  return model
}
