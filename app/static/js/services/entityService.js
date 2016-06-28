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
            var defObj = isDef(obj) ? obj : {};
            // TODO: Do a loop to generate these locations as models, in order to use the functions in model
            // this.locations = (isDef(defObj.locations) ? defObj.locations : [locationService.getLocationModel()]);
            // TODO: Do this for every array in this model
            this.locations = loopAndInit(defObj.locations, locationService.getLocationModel);
            this.influence = (isDef(defObj.influence) ? defObj.influence : null);

            this.grants_received = fundingConnectionService.getFundingConnectionModel(defObj.grants_received);
            this.investments_received = fundingConnectionService.getFundingConnectionModel(defObj.investments_received);
            this.grants_given = fundingConnectionService.getFundingConnectionModel(defObj.grants_given);
            this.investments_made = fundingConnectionService.getFundingConnectionModel(defObj.investments_made);
            this.data_given = connectionService.getConnectionModel(defObj.data_given);
            this.data_received = connectionService.getConnectionModel(defObj.data_received);
            this.collaborations = connectionService.getConnectionModel(defObj.collaborations);

            this.key_people = (isDef(defObj.key_people)
                ? defObj.key_people
                : [connectionService.getConnectionModel()]);

            this.employments = (isDef(defObj.employments)
                ? defObj.employments
                : [connectionService.getConnectionModel()]);

            this.relations = connectionService.getConnectionModel(defObj.relations);
            this.revenues = financeService.getFinanceModel(defObj.revenues);
            this.expenses = financeService.getFinanceModel(defObj.expenses);
            // TODO: Do a loop to generate these categories properly, with enabled set to true (default is false)
            this.categories = (isDef(defObj.categories) ? defObj.categories : categoryService.getCategoryModel());
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
