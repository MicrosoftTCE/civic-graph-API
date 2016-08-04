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
        vm.entityTypes = entityService.getEntityTypes();
        vm.connectionTypes = connectionService.getConnectionTypes();
        vm.sizeByList = [
            {'name': 'Employees', 'value': 'employees'},
            {'name': 'Twitter Followers', 'value': 'followers'}
        ];
        vm.sizeBy = 'employees';
        vm.showView = {
            'Network': true,
            'Map': false
        };
        vm.changeView = function (view) {
            _.forEach(_.keys(vm.showView), function (name) {
                vm.showView[name] = view === name;
            });
            $rootScope.$broadcast('viewChange');
        };
        vm.showAbout = function () {
            $modal.open({
                animation: false,
                templateUrl: 'control/about.html',
                controller: 'modalCtrl'
            });
        };
        vm.toggleNode = function (type) {
            $rootScope.$broadcast('toggleNode', {'name': type, 'enabled': vm.entityTypes[type]
            });
        };
        vm.toggleLink = function (type) {
            $rootScope.$broadcast('toggleLink', {'name': type, 'enabled': vm.connectionTypes[type]
            });
        };
        vm.changeSizeBy = function () {
            $rootScope.$broadcast('changeSizeBy', vm.sizeBy);
        };
    }

    angular.module('civic-graph')
        .controller('controlCtrl', controlDeps);

})(angular);
