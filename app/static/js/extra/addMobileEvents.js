(function (angular, $) {

    'use strict';

    function linkFunction(scope) {

        function scroll() {
            var self = $(this);
            self.css('height', '55vh');
        }

        function click() {
            var self = $(this);
            if (window.innerHeight / 3 > parseInt(self.css('height'))) {
                self.css('height', '55vh');
            } else {
                self.css('height', '30vh');
            }
        }

        var detailsPanel;
        if (scope.mobile) {
            detailsPanel = $("#details-panel");
            detailsPanel.css("height", "30vh");
            detailsPanel.scrollTop(0);
            detailsPanel.scroll(scroll);
            detailsPanel.click(click);
        }
    }

    function addMobileEvents() {
        return {
            restrict: 'A',
            link: linkFunction
        };
    }

    angular.module('civic-graph')
        .directive('addMobileEvents', [addMobileEvents]);
})(angular, $);
