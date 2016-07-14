/**
 * Created by brianavecchione on 6/27/16.
 */

(function(angular){

    'use strict';

    var fundingConnectionServiceDependencies = [FundingConnections];

    function isDef(o) { return o !== undefined && o !== null; }

    function FundingConnections() {
        function FundingConnection(obj) {
            var objIsDef = isDef(obj);
            this.entity = (objIsDef && isDef(obj.entity) ? obj.entity : '');
            this.amount = (objIsDef && isDef(obj.amount) ? obj.amount: null);
            this.year = (objIsDef && isDef(obj.year) ? obj.year : null);
            this.id = (objIsDef && isDef(obj.id) ? obj.id : null);
        }

        this.getFundingConnectionModel = function(obj){
            return new FundingConnection(obj);
        };



    }

    angular.module('civic-graph')
        .service('fundingConnectionService', fundingConnectionServiceDependencies);



})(angular);
