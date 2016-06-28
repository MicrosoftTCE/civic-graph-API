/**
 * Created by brianavecchione on 6/27/16.
 */

(function (angular) {

    'use strict';

    var financeService = [FinanceService];

    function isDef(o) {
        return o !== undefined && o !== null;
    }

    function FinanceService() {
        function Finance(obj) {
            var defObj = isDef(obj) ? obj : {};
            this.amount = (isDef(defObj.amount) && defObj.amount >= 0 ? defObj.amount : 0);
            this.year = (isDef(defObj.year) && defObj.year >= 1750 ? defObj.year : null);
            this.id = (isDef(defObj.id) ? defObj.id : null);

        }

        this.getFinanceModel = function (obj) {
            return new Finance(obj);
        };
    }


    angular.module('civic-graph')
        .service('financeService', financeService);

})(angular);