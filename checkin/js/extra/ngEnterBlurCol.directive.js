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
                    if (!scope.editEntity.collaborations[scope.editEntity.collaborations.length
                                                         - 1].entity && this.value
                        && (event.type === "blur" && !event.relatedTarget)) {
                        $('#collaborationscontainer').append(
                            "<div ng-click='removeCollaboration(collaboration)' id='addedCollaborators'  class='greyEnt'><span>"
                            + this.value
                            + "</span><span class='xCLose'>&#10006</span></div>");
                        this.value = "";
                        $(".greyEnt").each(function () {
                            $(this).on("click", function () {
                                $(this).remove();
                            });
                        });
                    }

                    event.preventDefault();

                });
            }
        };
    }

    angular.module('civic-graph-kiosk')
        .directive('ngEnterBlurCol', dependencies);

})(angular);
