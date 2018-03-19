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
/*global define, setTimeout*/
define([
    'marionette',
    'underscore',
    'jquery',
    './query-custom.hbs',
    'js/CustomElements',
    'component/filter-builder-search-form/filter-builder.view',
    'component/filter-builder/filter-builder',
    'js/cql',
    'js/store',
    'component/query-settings/query-settings.view',
    'component/query-advanced/query-advanced.view',
    'component/singletons/user-instance',
    'component/announcement'
], function (Marionette, _, $, template, CustomElements, FilterBuilderView, FilterBuilderModel, cql,
            store, QuerySettingsView, QueryAdvanced, user, announcement) {

    return QueryAdvanced.extend({

        template: template,
        events: {
            'click .make-default-form': 'makeDefaultSearchForm',
            'click .clear-default-form': 'clearDefaultSearchForm'
        },
        onBeforeShow: function(){
            this.model = this.model._cloneOf ? store.getQueryById(this.model._cloneOf) : this.model;
            this.querySettings.show(new QuerySettingsView({
                model: this.model
            }));
            this.queryAdvanced.show(new FilterBuilderView({
                model: new FilterBuilderModel()
            }));

            if (this.model.get('filterTemplate')) {
                this.setCqlFromFilter(this.options.filterTemplate);
                // this.setCqlFromFilter(this.model.get('filterTemplate'));
                // this.model.unset('filterTemplate');
            } else if (this.model.get('cql')) {
                this.queryAdvanced.currentView.deserialize(cql.simplify(cql.read(this.model.get('cql'))));
            }

            this.checkIfDefaultSearchForm();
            this.querySettings.currentView.turnOffEditing();
            this.queryAdvanced.currentView.turnOffEditing();
            this.edit();
        },
        edit: function(){
            this.$el.addClass('is-editing');
            this.queryAdvanced.currentView.turnOnEditing();
            this.querySettings.currentView.turnOnEditing();
        },
        setDefaultTitle: function(){
            this.model.set('title', "Custom Title");
        },
        setCqlFromFilter: function(filterTemplate) {
            this.queryAdvanced.currentView.model.set('operator', filterTemplate.type);
            this.queryAdvanced.currentView.setFilters(filterTemplate.filters);
            var filter = this.queryAdvanced.currentView.transformToCql();
            this.model.set({
                cql: filter
            });
        },
        checkIfDefaultSearchForm: function() {
            var storedTemplate = user.getQuerySettings().toJSON();
            var currentTemplate = JSON.parse(JSON.stringify(this.model));

            if (storedTemplate['defaultTemplate'] != undefined &&
                storedTemplate['defaultTemplate'].templateTitle == currentTemplate.templateTitle) {
                    this.$('.make-default-form').css({'display': 'none'});
                } else {
                    this.$('.make-default-form').css({'display': 'inline-block'});
                }
        },
        makeDefaultSearchForm: function() {
            var templateJSON = JSON.parse(JSON.stringify(this.model));
            user.getQuerySettings().set('defaultTemplate', templateJSON);
            user.savePreferences();
            this.messageNotifier(
                'Success!', 
                `\"${templateJSON.templateTitle}\" Saved As Default Query Form`, 
                'success'
            );
        },
        clearDefaultSearchForm: function() {
            user.getQuerySettings().set('defaultTemplate', null);
            user.savePreferences();
            this.messageNotifier(
                'Success!', 
                `Default Query Form Cleared`, 
                'success'
            );
            this.checkIfDefaultSearchForm();
        },
        messageNotifier: function(title, message, type) {
            announcement.announce({
                title: title,
                message: message,
                type: type
            });
            this.checkIfDefaultSearchForm();
        },
        serializeData: function() {
            var templateTitle = this.model.get('templateTitle') != null
                                 ? this.model.get('templateTitle')
                                 : "Standard Search";
            return {
                templateTitle: templateTitle
            };
        }
    });
});
