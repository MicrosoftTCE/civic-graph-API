/**
 * Created by brianavecchione on 6/27/16.
 */
(function (angular) {

    'use strict';

    var connectionService = [Connections];
    var connectionTypes = {
        'Funding': true,
        'Data': true,
        'Employment': true,
        'Collaboration': true
    };

    function isDef(o) {
        return o !== undefined && o !== null;
    }

    function Connections() {
        function Connection(obj) {
            var objIsDef = isDef(obj);
            this.entity = (objIsDef && isDef(obj.entity) ? obj.entity : null);
            this.id = (objIsDef && isDef(obj.id) ? obj.id : null);
            this.details = (objIsDef && isDef(obj.details) ? obj.details : null);
            this.name = (objIsDef && isDef(obj.name) ? obj.name: null);
        }

        this.getConnectionModel = function (obj) {
            return new Connection(obj);
        };

        this.getConnectionTypes = function () {
            return connectionTypes;
        };
    }


    angular.module('civic-graph')
        .service('connectionService', connectionService);

})(angular);