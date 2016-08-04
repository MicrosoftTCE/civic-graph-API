(function (angular) {

    'use strict';

    angular.module('civic-graph-kiosk')
        .constant('_', window._)
        .config(['$locationProvider', '$httpProvider', function ($locationProvider) {
            $locationProvider.html5Mode(true);
        }]);

})(angular);
