/**
 * Created by brianavecchione on 7/10/16.
 */

(function (angular) {

    'use strict';

    var controlDependencies = [controlDirective];

    function controlDirective() {
        return {
            templateUrl: '/control/controls.html',
            restrict   : 'E',
            scope      : {
                toggleNetwork : '='
            },
            controller   : 'controlCtrl',
            controllerAs : 'control'
        };
    }

    angular.module('civic-graph')
        .directive('control', controlDependencies);

})(angular);
