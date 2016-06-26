(function( angular, $ ) {

    'use strict';

    function addMobileEvents() {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                if (scope.mobile) {
                    $("#details-panel").css( "height", "30vh");
                    $("#details-panel").scrollTop(0);
                    $('#details-panel').scroll(function() {
                        $(this).css('height','55vh');
                    });
                    $( "#details-panel" ).click(function(e) {
                        if (window.innerHeight/3 > parseInt($(this).css('height'))) {
                            $(this).css('height','55vh');
                        } else {
                            $(this).css('height','30vh');
                        }
                    });
                }
            }
        };
    }

    angular.module('civic-graph')
    .directive('addMobileEvents', [addMobileEvents])
})(angular, $);
