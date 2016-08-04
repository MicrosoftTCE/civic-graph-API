/**
 * Created by brianavecchione on 7/1/16.
 */


(function (angular) {

    'use strict';

    var analyticsDependencies = [analyticsDirective];

    function analyticsDirective(){
        return {
            templateUrl: '/js/analytic/analytics.html',
            restrict   : 'E',
            scope      : {},
            controller   : 'analyticsCtrl'
        };
    }

    angular.module('civic-graph')
        .directive('analytics', analyticsDependencies);

})(angular);
