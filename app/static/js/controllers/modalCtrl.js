(function(angular) {

    'use strict';

    function modalCtrl($scope, $modalInstance) {
        $scope.closeWindow = function () {
            $modalInstance.close();
        };
    }

    angular.module('civic-graph')
        .controller('modalCtrl', ['$scope', '$modalInstance', modalCtrl]);

})(angular);