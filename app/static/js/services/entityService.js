/**
 * Created by brianavecchione on 6/27/16.
 */

(function (angular) {

    'use strict';

    var entityServiceDependencies = [
        'fundingConnectionService',
        'connectionService',
        'financeService',
        'locationService',
        'categoryService',
        EntityService
    ];

    function EntityService(fundingConnectionService, connectionService, financeService, locationService,
                           categoryService
    ) {

        var entityTypes = {
            'Government': true,
            'For-Profit': true,
            'Non-Profit': true,
            'Individual': true
        };

        var influenceTypes = [
            'Local',
            'National',
            'Global'
        ];

        function isDef(o) {
            return o !== undefined && o !== null;
        }

        function loopAndInit(modelArray, initModelFunction) {
            if( !( isDef(modelArray) || angular.isArray(modelArray) ) ) return [initModelFunction()];
            var arrayIndex,
                arrayValue,
                newModelArray = [];

            for ( arrayIndex in modelArray ) {
                if(!modelArray.hasOwnProperty(arrayIndex)) continue;
                arrayValue = modelArray[arrayIndex];

                if(!angular.isObject(arrayValue)) continue;

                newModelArray.push(initModelFunction(arrayValue));
            }

            return newModelArray;
        }

        function Entity(obj) {
            var self = this;
            var defObj = isDef(obj) ? obj : {};
            // TODO: Do a loop to generate these locations as models, in order to use the functions in model
            // this.locations = (isDef(defObj.locations) ? defObj.locations : [locationService.getLocationModel()]);
            // TODO: Do this for every array in this model
            this.id = (isDef(defObj.id) ? defObj.id : null);
            this.name = (isDef(defObj.name) ? defObj.name : null);
            this.locations = loopAndInit(defObj.locations, locationService.getLocationModel);
            this.influence = (isDef(defObj.influence) ? defObj.influence : null);
            this.grants_received = loopAndInit(defObj.grants_received, fundingConnectionService.getFundingConnectionModel);
            this.investments_received = loopAndInit(defObj.investments_received, fundingConnectionService.getFundingConnectionModel);
            this.grants_given = loopAndInit(defObj.grants_given, fundingConnectionService.getFundingConnectionModel);
            this.investments_made = loopAndInit(defObj.investments_made, fundingConnectionService.getFundingConnectionModel);
            this.data_given = loopAndInit(defObj.data_given, connectionService.getConnectionModel);
            this.data_received = loopAndInit(defObj.data_received, connectionService.getConnectionModel);
            this.collaborations = loopAndInit(defObj.collaborations, connectionService.getConnectionModel);
            this.key_people = loopAndInit(defObj.key_people, connectionService.getConnectionModel);
            this.employments = loopAndInit(defObj.employments, connectionService.getConnectionModel);
            this.revenues = loopAndInit(defObj.revenues, financeService.getFinanceModel);
            this.expenses = loopAndInit(defObj.expenses, financeService.getFinanceModel);
            this.categories = loopAndInit(defObj.categories, categoryService.getCategoryModel);
            this.type = (isDef(defObj.type) ? defObj.type : '');
            this.nickname = (isDef(defObj.nickname) ? defObj.nickname : '');

            this.generateDBModel = function() {
                var dbModel = {};
                dbModel.locations = self.locations.map(getLocation);
                dbModel.influence = self.influence;
                dbModel.grants_received = self.grants_received;
                dbModel.investments_received = self.investments_received;
                dbModel.grants_given = self.grants_given;
                dbModel.investments_made = self.investments_made;
                dbModel.data_given = self.data_given;
                dbModel.data_received = self.data_received;
                dbModel.collaborations = self.collaborations;
                dbModel.key_people = self.key_people;
                dbModel.employments = self.employments;
                dbModel.revenues = self.revenues;
                dbModel.expenses = self.expenses;
                dbModel.categories = self.categories;
                dbModel.type = self.type;
                dbModel.description = '';
            };

            function getLocation(location) {
                return self.type === 'Individual' ? location.getPartialAddress() : location.getFullAddress();
            }

        }

        this.getEntityModel = function (obj) {
            return new Entity(obj);
        };

        this.getEntityTypes = function (){
            return entityTypes;
        };

        this.getInfluenceTypes = function () {
            return influenceTypes;
        };
        
    }

    angular.module('civic-graph')
        .service('entityService', entityServiceDependencies);


})(angular);
