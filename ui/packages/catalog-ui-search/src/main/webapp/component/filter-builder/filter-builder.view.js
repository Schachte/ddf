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
import MarionetteRegionContainer from '../../react-component/container/marionette-region-container'

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

  & {
    margin: ${props => props.theme.minimumSpacing};
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
`

const FilterHeader = styled.div`
  white-space: nowrap;
  margin-bottom: ${props => props.theme.minimumSpacing};
`

const FilterOperator = styled.div`
  display: inline-block;
  vertical-align: top;
  height: ${props => props.theme.minimumButtonSize};
  margin-right: ${props => props.theme.minimumSpacing};
  line-height: ${props => props.theme.minimumButtonSize};
  intrigue-dropdown.is-editing .dropdown-text {
    width: auto;
    max-width: 300px;
  }
`

const FilterRearrange = styled.button`
  /* .grab-cursor(); */
  display: inline-block;
  width: calc(0.75 * ${props => props.theme.minimumButtonSize});
  opacity: 0.25;

  :hover {
    opacity: 0.5;
    transition: opacity 0.5s ease-in-out;
  }
`
const FilterRemove = styled.button`
  vertical-align: top;
  display: inline-block;
  margin-right: ${props => props.theme.minimumSpacing};
  width: ${props => props.theme.minimumButtonSize};
  height: ${props => props.theme.minimumButtonSize};
`

const ContentsButtons = styled.div`
  display: inline-block;

  > button {
    padding: 0px ${props => props.theme.minimumSpacing};
  }

  margin-left: ${props => props.theme.minimumSpacing};
`

const AddFilter = styled.button`
  margin-right: ${props => props.theme.minimumSpacing};
`

const AddGroup = styled.button`
  position: relative;
  padding-right: ${props => props.theme.minimumSpacing};

  span:nth-of-type(2) {
    margin-right: ${props => props.theme.minimumSpacing};
  }

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
`

const Icon = styled.span`
  margin-right: ${props => props.theme.minimumSpacing};
`

const FilterContents = styled.div`
  margin-right: ${props => props.theme.minimumSpacing};
  position: relative;
  display: inline-block;
  vertical-align: middle;

  > .contents-filters {
    padding-left: ${props => props.theme.minimumSpacing};
  }

  /* .filter-header:hover + .filter-contents {
    .dropshadowlight;
  } */
`

module.exports = Marionette.LayoutView.extend({
  template() {
    const { isSortable = false } = this.options

    this.operator = DropdownView.createSimpleDropdown({
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

    this.listenTo(this.operator, 'change:value', this.handleOperatorUpdate)

    return (
      <Root>
        <FilterHeader>
          {isSortable ? (
            <FilterRearrange>
              <span className="cf cf-sort-grabber" />
            </FilterRearrange>
          ) : null}
          {isSortable ? (
            <FilterRemove
              className="is-negative"
              onClick={() => this.delete()}
              data-help="Removes this branch."
            >
              <span className="fa fa-minus" />
            </FilterRemove>
          ) : null}

          <FilterOperator>
            <MarionetteRegionContainer view={this.operator} />
          </FilterOperator>

          <ContentsButtons>
            <AddFilter
              className="is-button is-neutral"
              onClick={() => this.addFilter()}
              data-help="Adds a new rule at this current level of the tree"
            >
              <Icon className="fa fa-plus" />
              <span>Add Field</span>
            </AddFilter>
            <AddGroup
              className="is-button is-neutral"
              onClick={() => this.addFilterBuilder()}
              data-help="Adds a new group at this current level of the tree."
            >
              <Icon className="fa fa-plus" />
              <span>Add Group</span>
            </AddGroup>
          </ContentsButtons>
        </FilterHeader>
        <FilterContents className="global-bracket is-left">
          <div className="contents-filters" />
        </FilterContents>
      </Root>
    )
  },
  tagName: CustomElements.register('filter-builder'),
  attributes: function() {
    return { 'data-id': this.model.cid }
  },
  regions: {
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
    this.operator.turnOnEditing()
    this.filterContents.currentView.turnOnEditing()
  },
  turnOffEditing: function() {
    this.$el.removeClass('is-editing')
    this.operator.turnOffEditing()
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
