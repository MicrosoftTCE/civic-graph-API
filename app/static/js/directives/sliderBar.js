/**
 * Created by brianavecchione on 6/26/16.
 */
(function(angular) {
    'use strict';

    angular.module('civic-graph')
        .directive('input', function () {
        return {
            restict: 'E',
            require: '?ngModel',
            link: function(scope, element, attrs, ngModel) {
                if ( 'type' in attrs && attrs.type.toLowerCase() === 'range' ) {
                    ngModel.$parsers.push(parseFloat);
                }
            }
        };
    });
})(angular);