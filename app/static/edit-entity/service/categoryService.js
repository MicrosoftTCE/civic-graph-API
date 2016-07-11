/**
 * Created by brianavecchione on 6/28/16.
 */

(function (angular) {

    'use strict';

    var categoryServiceDependencies = [
        CategoryService
    ];

    function CategoryService() {

        function isDef(o) { return o !== undefined && o !== null; }

        function Category(obj) {
            var defObj = isDef(obj) ? obj : {};
            this.name = (isDef(defObj.name) ? defObj.name : null);
            this.enabled = (isDef(defObj.enable) ? defObj.enabled : true);
            this.id = (isDef(defObj.id) ? defObj.id : null);
        }

        this.getCategoryModel = function(obj) {
            return new Category(obj);
        };
    }

    angular.module('civic-graph')
        .service('categoryService', categoryServiceDependencies);

})(angular);