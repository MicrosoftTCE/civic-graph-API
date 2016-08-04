(function (angular) {

    'use strict';

    function detailsCtrl($scope, _) {
        $scope.itemsShownDefault = {
            'key_people': 3,
            'grants_given': 3,
            'grants_received': 3,
            'investments_made': 3,
            'investments_received': 3,
            'collaborations': 3,
            'employments': 3,
            'relations': 3,
            'data_given': 3,
            'data_received': 3,
            'revenues': 3,
            'expenses': 3
        };

        $scope.itemsShown = _.clone($scope.itemsShownDefault);

        $scope.$on('entityChange', function () {
            // Reset items shown in details list.
            $scope.itemsShown = _.clone($scope.itemsShownDefault);
        });
        $scope.showMore = function (type) {
            $scope.itemsShown[type] = $scope.currentEntity[type].length;
        };
        $scope.showLess = function (type) {
            $scope.itemsShown[type] = $scope.itemsShownDefault[type];
        };
    }

    angular.module('civic-graph')
        .controller('detailsCtrl', ['$scope', "_", detailsCtrl]);
})(angular);
