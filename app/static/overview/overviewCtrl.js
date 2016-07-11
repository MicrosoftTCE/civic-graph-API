(function (angular) {

    'use strict';

    function overviewCtrl($scope, _) {
        $scope.categorizedEntities = {};
        _.forEach(_.keys($scope.entityTypes), function (type) {
            $scope.categorizedEntities[type] = _.filter($scope.entities, {'type': type});
        });
    }

    angular.module('civic-graph')
        .controller('overviewCtrl', ['$scope', '_', overviewCtrl]);
})(angular);
