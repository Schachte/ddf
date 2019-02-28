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
import React from 'react'
import styled from '../../react-component/styles/styled-components'

var Marionette = require('marionette')
var Backbone = require('backbone')
var $ = require('jquery')
var _ = require('underscore')
var CustomElements = require('../../js/CustomElements.js')
var FilterBuilderModel = require('./filter-builder')
var FilterModel = require('../filter/filter.js')
var FilterCollectionView = require('../filter/filter.collection.view.js')
var DropdownModel = require('../dropdown/dropdown.js')
var FilterView = require('../filter/filter.view.js')
var cql = require('../../js/cql.js')
var DropdownView = require('../dropdown/dropdown.view.js')
var CQLUtils = require('../../js/CQLUtils.js')

const Root = styled.div`
  display: table;
  width: 100%;
  position: relative;

  white-space: nowrap;

  intrigue-dropdown.is-simpleDropdown.is-editing {
    width: auto;
  }

  > .filter-header > .contents-buttons .add-filterBuilder {
    position: relative;
    padding-right: ${props => props.theme.minimumSpacing};
  }

  > .filter-header > .contents-buttons .add-filterBuilder span:nth-of-type(2) {
    margin-right: ${props => props.theme.minimumSpacing};
  }

  > .filter-header
    > .contents-buttons
    .add-filterBuilder
    span:nth-of-type(2)::after {
    content: '';
    position: absolute;
    right: 0px;
    border-left: 1px solid;
    border-top: 1px solid;
    border-bottom: 1px solid;
    height: 100%;
    width: ${props => props.theme.minimumSpacing};
  }

  > .filter-header {
    white-space: nowrap;
    margin-bottom: ${props => props.theme.minimumSpacing};
  }

  > .filter-header {
    > .filter-remove,
    > .filter-operator {
      margin-right: ${props => props.theme.minimumSpacing};
    }

    > .filter-rearrange {
      display: none;
    }

    > .filter-remove {
      display: none;
      vertical-align: top;
    }

    > .filter-operator {
      display: inline-block;
      vertical-align: top;
      height: ${props => props.theme.minimumButtonSize};
      line-height: ${props => props.theme.minimumButtonSize};
      intrigue-dropdown.is-editing .dropdown-text {
        width: auto;
        max-width: 300px;
      }
    }

    > .contents-buttons > button {
      padding: 0px ${props => props.theme.minimumSpacing};
    }

    > .contents-buttons {
      display: inline-block;
    }

    > .filter-remove {
      width: ${props => props.theme.minimumButtonSize};
      height: ${props => props.theme.minimumButtonSize};
    }
  }

  > .filter-contents {
    margin-right: ${props => props.theme.minimumSpacing};
    position: relative;
  }

  > .filter-contents {
    display: inline-block;
    vertical-align: middle;
  }

  > .filter-contents > .contents-filters {
    padding-left: ${props => props.theme.minimumSpacing};
  }

  .contents-buttons {
    margin-left: ${props => props.theme.minimumSpacing};

    .add-filter {
      margin-right: ${props => props.theme.minimumSpacing};
    }
  }

  .filter-header:hover + .filter-contents {
    /*.dropshadowlight;*/
  }

  & {
    margin: ${props => props.theme.minimumSpacing};
  }

  &.is-editing {
    > .filter-header > .contents-buttons {
      display: inline-block;
      vertical-align: top;
    }
  }

  &.is-sortable {
    > .filter-header {
      > .filter-rearrange {
        /* .grab-cursor(); */
        display: inline-block;
        width: 0.75 * ${props => props.theme.minimumButtonSize};
        opacity: 0.25;
      }

      > .filter-rearrange:hover {
        opacity: 0.5;
        transition: opacity 0.5s ease-in-out;
      }
    }
  }

  /*&.hide-field-button {
    > .filter-header > .contents-buttons > .add-filter {
      display: none;
    }
  }

  &.hide-nesting {
    > .filter-header > .contents-buttons > .add-filterBuilder {
      display: none;
    }
  }

  &.hide-root-operator {
    > .filter-header > .filter-operator {
      display: none;
    }
  }*/

  intrigue-filter-collection {
    > &.is-editing {
      > .filter-header > .filter-remove {
        display: inline-block;
      }
    }
  }
`

module.exports = Marionette.LayoutView.extend({
  template() {
    return (
      <Root>
        <div className="filter-header">
          <button className="filter-rearrange">
            <span className="cf cf-sort-grabber" />
          </button>
          <button
            className="filter-remove is-negative"
            data-help="Removes this branch."
          >
            <span className="fa fa-minus" />
          </button>
          <div className="filter-operator" />
          <div className="contents-buttons">
            <button
              className="add-filter is-button is-neutral"
              data-help="Adds a new rule at this current level of the tree"
            >
              <span className="fa fa-plus" />
              <span>Add Field</span>
            </button>
            <button
              className="add-filterBuilder is-button is-neutral"
              data-help="Adds a new group at this current level of the tree."
            >
              <span className="fa fa-plus" />
              <span>Add Group</span>
            </button>
          </div>
        </div>
        <div className="filter-contents global-bracket is-left">
          <div className="contents-filters" />
        </div>
      </Root>
    )
  },
  tagName: CustomElements.register('filter-builder'),
  attributes: function() {
    return { 'data-id': this.model.cid }
  },
  events: {
    'click > div > .filter-header > .contents-buttons .getValue': 'printValue',
    'click > div > .filter-header > .filter-remove': 'delete',
    'click > div > .filter-header > .contents-buttons .add-filter': 'addFilter',
    'click > div > .filter-header > .contents-buttons .add-filterBuilder':
      'addFilterBuilder',
  },
  modelEvents: {},
  regions: {
    filterOperator: '.filter-operator',
    filterContents: '.contents-filters',
  },
  initialize: function() {
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
        collection: new Backbone.Collection([this.createFilterModel()], {
          comparator: 'sortableOrder',
        }),
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
  addFilter: function() {
    var FilterView = this.filterContents.currentView.addFilter(
      this.createFilterModel()
    )
    this.handleEditing()
    return FilterView
  },
  addFilterBuilder: function() {
    const numFilters = this.filterContents.currentView
      ? this.filterContents.currentView.collection.length
      : 0
    var FilterBuilderView = this.filterContents.currentView.addFilterBuilder(
      new FilterBuilderModel({ sortableOrder: numFilters + 1 })
    )
    this.handleEditing()
    return FilterBuilderView
  },
  filterView: FilterView,
  printValue: function() {
    alert(this.transformToCql())
  },
  getValue: function() {
    var operator = this.model.get('operator')
    var text = '('
    this.filterContents.currentView.children.forEach(function(
      childView,
      index
    ) {
      if (index > 0) {
        if (operator === 'NONE') {
          text += ' AND NOT '
        } else {
          text += ' ' + operator + ' '
        }
      } else if (operator === 'NONE') {
        text += ' NOT '
      }
      text += childView.getValue()
    })
    text += ')'
    return text
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
    var operator = this.model.get('operator')
    if (operator === 'NONE') {
      return {
        type: 'NOT',
        filters: [
          {
            type: 'AND',
            filters: this.filterContents.currentView.children.map(function(
              childView
            ) {
              return childView.getFilters()
            }),
          },
        ],
      }
    } else {
      return {
        type: operator,
        filters: this.filterContents.currentView.children
          .map(function(childView) {
            return childView.getFilters()
          })
          .filter(function(filter) {
            return filter
          }),
      }
    }
  },
  deleteInvalidFilters: function() {
    this.filterContents.currentView.children.forEach(function(childView) {
      childView.deleteInvalidFilters()
    })
    if (this.filterContents.currentView.children.length === 0) {
      this.delete()
    }
  },
  setFilters: function(filters) {
    setTimeout(
      function() {
        if (this.filterContents) {
          this.filterContents.currentView.collection.reset()
          filters.forEach(
            function(filter) {
              if (filter.filters) {
                var filterBuilderView = this.addFilterBuilder()
                filterBuilderView.setFilters(filter.filters)
                filterBuilderView.model.set('operator', filter.type)
              } else {
                var filterView = this.addFilter()
                filterView.setFilter(filter)
              }
            }.bind(this)
          )
          this.handleEditing()
        }
      }.bind(this),
      0
    )
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
    if (!cql.filters) {
      cql = {
        filters: [cql],
        type: 'AND',
      }
    }
    this.model.set('operator', cql.type)
    this.setFilters(cql.filters)
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
    this.filterContents.currentView.collection.sort()
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
  createFilterModel: function() {
    const numFilters = this.filterContents.currentView
      ? this.filterContents.currentView.collection.length
      : 0
    return new FilterModel({
      sortableOrder: numFilters + 1,
      isResultFilter: Boolean(this.model.get('isResultFilter')),
    })
  },
})
