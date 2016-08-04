/**
 * Created by brianavecchione on 7/11/16.
 */

(function (angular) {

    'use strict';

    var dependencies = [
        directive
    ];

    function directive() {
        return {
            "restrict": "E",
            "templateUrl": "/js/network/network.html",
            "controller": "networkCtrl"
        };
    }

    angular.module("civic-graph")
        .directive("network", dependencies);

})(angular);
