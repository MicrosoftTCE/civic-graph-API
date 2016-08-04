(function(angular) {
    'use strict';

    var dependencies = [directive];

    function directive() {
        return {
            restrict: "A",
            require : 'ngModel',
            scope   : true,
            link    : function (scope, element) {
                element.bind("keydown keypress blur", function (event) {
                    if (!(event.which === 13 || event.type === "blur")) {
                        return;
                    }
                    if (!scope.editEntity.locations[0].full_address) {
                        scope.autoSetAdress(this.value, scope.editEntity);
                        $('#locationmsg').show();
                    }
                    else {
                        $('#locationmsg').hide();
                    }
                    event.preventDefault();
                });
            }
        };
    }

    angular.module('civic-graph-kiosk')
        .directive('ngEnterBlur', dependencies);

})(angular);
