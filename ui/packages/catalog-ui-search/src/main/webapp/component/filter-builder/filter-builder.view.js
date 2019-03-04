/**
 * Copyright (c) Codice Foundation
 *
 * This is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details. A copy of the GNU Lesser General Public License
 * is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 *
 **/
/*global define, alert, setTimeout*/
var Marionette = require('marionette')
var Backbone = require('backbone')
var $ = require('jquery')
var _ = require('underscore')
var template = require('./filter-builder.hbs')
var CustomElements = require('../../js/CustomElements.js')
var FilterBuilderModel = require('./filter-builder')
var FilterModel = require('../filter/filter.js')
var FilterCollectionView = require('../filter/filter.collection.view.js')
var DropdownModel = require('../dropdown/dropdown.js')
var FilterView = require('../filter/filter.view.js')
var cql = require('../../js/cql.js')
var DropdownView = require('../dropdown/dropdown.view.js')
var CQLUtils = require('../../js/CQLUtils.js')

import { serialize, deserialize } from './filter-serialization'

const FilterBuilderCollection = Backbone.Collection.extend({
  model(attrs) {
    if (attrs.type === 'filter-builder') {
      return new FilterBuilderModel(attrs)
    }

    return new FilterModel(FilterView.setFilter(attrs))
  },
})

module.exports = Marionette.LayoutView.extend({
  template: template,
  tagName: CustomElements.register('filter-builder'),
  events: {
    'click > .filter-header > .contents-buttons .getValue': 'printValue',
    'click > .filter-header > .filter-remove': 'delete',
    'click > .filter-header > .contents-buttons .add-filter': 'addFilter',
    'click > .filter-header > .contents-buttons .add-filterBuilder':
      'addFilterBuilder',
  },
  modelEvents: {},
  regions: {
    filterOperator: '.filter-operator',
    filterContents: '.contents-filters',
  },
  initialize: function() {
    if (this.model === undefined) {
      debugger
      this.model = deserialize(this.model, this.options.data)
    }

    this.collection = this.model.get('filters')
    this.$el.attr('data-id', this.model.cid)
    this.listenTo(this.model, 'change:operator', this.updateOperatorDropdown)
    if (this.options.isForm === true) {
      if (this.options.isFormBuilder !== true) {
        this.turnOffFieldAdditions()
      }
      this.turnOffNesting()
      this.turnOffRootOperator()
    }
  },
  onBeforeShow: function() {
    this.$el.toggleClass('is-sortable', this.options.isSortable || false)
    this.filterOperator.show(
      DropdownView.createSimpleDropdown({
        list: [
          {
            label: 'AND',
            value: 'AND',
          },
          {
            label: 'OR',
            value: 'OR',
          },
          {
            label: 'NOT AND',
            value: 'NOT AND',
          },
          {
            label: 'NOT OR',
            value: 'NOT OR',
          },
        ],
        defaultSelection: ['AND'],
      })
    )
    this.listenTo(
      this.filterOperator.currentView.model,
      'change:value',
      this.handleOperatorUpdate
    )
    this.filterContents.show(
      new FilterCollectionView({
        collection: this.collection,
        'filter-builder': this,
        isForm: this.options.isForm || false,
        isFormBuilder: this.options.isFormBuilder || false,
      })
    )
  },
  updateOperatorDropdown: function() {
    this.filterOperator.currentView.model.set('value', [
      this.model.get('operator'),
    ])
  },
  handleOperatorUpdate: function() {
    this.model.set(
      'operator',
      this.filterOperator.currentView.model.get('value')[0]
    )
  },
  delete: function() {
    this.model.destroy()
  },
  addFilter: function(filter) {
    this.collection.push({
      isResultFilter: Boolean(this.model.get('isResultFilter')),
    })

    this.handleEditing()
  },
  addFilterBuilder: function() {
    this.collection.push({ filterBuilder: true })
    this.handleEditing()
  },
  filterView: FilterView,
  printValue: function() {
    alert(this.transformToCql())
  },
  transformToCql: function() {
    this.deleteInvalidFilters()
    var filter = this.getFilters()
    if (filter.filters.length === 0) {
      return '("anyText" ILIKE \'%\')'
    } else {
      return CQLUtils.transformFilterToCQL(filter)
    }
  },
  getFilters: function() {
    return serialize(this.model)
  },
  deleteInvalidFilters: function() {
    const collection = this.collection.filter(function(model) {
      return model.get('isValid') !== false
    })

    this.collection.reset(collection, { silent: true })

    if (collection.length === 0) {
      this.delete()
    }
  },
  setFilters: function(filters) {
    this.collection.reset()
    filters.forEach(
      function(filter) {
        if (filter.filters) {
          this.addFilterBuilder(filter)
        } else {
          this.addFilter(filter)
        }
      }.bind(this)
    )
    this.handleEditing()
  },
  revert: function() {
    this.$el.removeClass('is-editing')
  },
  serializeData: function() {
    return {
      cql: 'anyText ILIKE ""',
    }
  },
  deserialize: function(cql) {
    deserialize(cql)
  },
  handleEditing: function() {
    var isEditing = this.$el.hasClass('is-editing')
    if (isEditing) {
      this.turnOnEditing()
    } else {
      this.turnOffEditing()
    }
  },
  sortCollection: function() {
    this.collection.sort()
  },
  turnOnEditing: function() {
    this.$el.addClass('is-editing')
    this.filterOperator.currentView.turnOnEditing()
    this.filterContents.currentView.turnOnEditing()
  },
  turnOffEditing: function() {
    this.$el.removeClass('is-editing')
    this.filterOperator.currentView.turnOffEditing()
    this.filterContents.currentView.turnOffEditing()
  },
  turnOffNesting: function() {
    this.$el.addClass('hide-nesting')
  },
  turnOffRootOperator: function() {
    this.$el.addClass('hide-root-operator')
  },
  turnOffFieldAdditions: function() {
    this.$el.addClass('hide-field-button')
  },
})
