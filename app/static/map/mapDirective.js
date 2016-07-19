/**
 * Created by brianavecchione on 7/14/16.
 */

(function (angular) {

    'use strict';

    var dependencies = [];

    function directive() {
        return {
            "restrict": "E",
            "templateUrl": "/map/map.html",
            "controller": "mapCtrl"
        };
    }
        angular.module("civic-graph")
            .directive("map", dependencies);

})(angular);