/**
 * Created by brianavecchione on 7/10/16.
 */

(function (angular) {

    'use strict';

    var controlDeps = [
        'entityService',
        'connectionService',
        '$rootScope',
        '_',
        '$modal',
        controlCtrl
    ];

    function controlCtrl(entityService, connectionService, $rootScope, _, $modal) {
        var vm = this;
        this.entityTypes = entityService.getEntityTypes();
        this.connectionTypes = connectionService.getConnectionTypes();
        this.sizeByList = [
            {'name': 'Employees', 'value': 'employees'},
            {'name': 'Twitter Followers', 'value': 'followers'}
        ];
        this.sizeBy = 'employees';
        this.showView = {
            'Network': true,
            'Map': false
        };
        this.changeView = function (view) {
            _.forEach(_.keys(vm.showView), function (name) {
                vm.showView[name] = view === name;
            });
            $rootScope.$broadcast('viewChange');
        };
        this.showAbout = function () {
            $modal.open({
                animation: false,
                templateUrl: 'control/about.html',
                controller: 'modalCtrl'
            });
        };
        this.toggleNode = function (type) {
            $rootScope.$broadcast('toggleNode', {'name': type, 'enabled': vm.entityTypes[type]
            });
        };
        this.toggleLink = function (type) {
            $rootScope.$broadcast('toggleLink', {'name': type, 'enabled': vm.connectionTypes[type]
            });
        };
        this.changeSizeBy = function () {
            $rootScope.$broadcast('changeSizeBy', vm.sizeBy);
        };

        this.connectionChange = function() {
            console.log(vm.minConnections);
        }
    }

    angular.module('civic-graph')
        .controller('controlCtrl', controlDeps);

})(angular);