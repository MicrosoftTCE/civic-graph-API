(function( angular ) {

    'use strict';

    angular.module('civic-graph', ['ui.bootstrap', 'leaflet-directive', 'ngAnimate'])
    .constant('_', window._)
    .config(['$locationProvider', '$httpProvider', function($locationProvider, $httpProvider) {
        $locationProvider.html5Mode(true);
        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    }])
    .filter('thousandSuffix', function () {
        return function (input, decimals) {
          var exp, rounded,
            suffixes = ['k', 'M', 'G', 'T', 'P', 'E'];

          if(window.isNaN(input)) {
            return null;
          }

          if(input < 1000) {
            return input;
          }

          exp = Math.floor(Math.log(input) / Math.log(1000));

          return (input / Math.pow(1000, exp)).toFixed(decimals) + suffixes[exp - 1];
        };
    });

})(angular);