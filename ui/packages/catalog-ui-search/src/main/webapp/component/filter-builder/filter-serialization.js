var Backbone = require('backbone')
var FilterModel = require('../filter/filter.js')
var FilterBuilderModel = require('./filter-builder')
var FilterView = require('../filter/filter.view.js')

const CQLUtils = require('../../js/CQLUtils.js')
const metacardDefinitions = require('../singletons/metacard-definitions.js')

function comparatorToCQL() {
  return {
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
}

function FilterViewgetFilters(model) {
  var property = model.get('type')
  var comparator = model.get('comparator')
  var value = model.get('value')[0]

  if (comparator === 'NEAR') {
    return CQLUtils.generateFilterForFilterFunction('proximity', [
      property,
      value.distance,
      value.value,
    ])
  }

  var type = comparatorToCQL()[comparator]
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
  } else {
    return CQLUtils.generateFilter(
      type,
      property,
      value === undefined ? null : value
    )
  }
}

function getFiltersAll(model) {
  if (model instanceof FilterBuilderModel) {
    return getFilters(model)
  }

  if (model instanceof FilterModel) {
    return FilterViewgetFilters(model)
  }
}

function getFilters(model) {
  var operator = model.get('operator')
  const filters = model.get('filters') || []

  if (operator === 'NONE') {
    return {
      type: 'NOT',
      filters: [
        {
          type: 'AND',
          filters: filters.map(getFiltersAll),
        },
      ],
    }
  } else {
    return {
      type: operator,
      filters: filters.map(getFiltersAll).filter(filter => filter),
    }
  }
}

// model->json
export const serialize = model => {
  return getFiltersAll(model)
}

const defaultJson = {
  value: '',
  type: 'anyText',
  comparator: 'CONTAINS',
}

const FilterBuilderCollection = Backbone.Collection.extend({
  comparator: 'sortableOrder',
  model(attrs) {
    const sortableOrder = this.length + 1

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
      ...FilterView.setFilter({
        ...attrs,
        type: attrs.type === undefined ? 'anyText' : attrs.type,
        property: attrs.type === undefined ? 'anyText' : attrs.type,
        value: attrs.value === undefined ? '' : attrs.value,
      }),
    })
  },
})

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

  const stuff = json.filters || [
    {
      ...defaultJson,
      sortableOrder: 1,
      isResultFilter: Boolean(model.get('isResultFilter')),
    },
  ]

  const collection = new FilterBuilderCollection()

  model.set('filters', collection)

  json.filters.forEach(function(filter) {
    if (filter.filters) {
      collection.push(deserialize(undefined, filter))
    } else {
      collection.push({
        isResultFilter: Boolean(model.get('isResultFilter')),
        ...FilterView.setFilter(filter),
      })
    }
  })

  return model
}
