(function(angular) {
    'use strict';

    var controllerDependencies = [
        '$scope',
        '$http',
        '$location',
        '$modal',
        '_',
        controller
    ];

    function controller($scope, $http, $location, $modal, _) {
        $scope.random   = new Date().getTime();
        $scope.entities = [];
        $scope.searchItems              = null;
        $scope.categories               = [];
        $scope.currentLocation          = null;
        $scope.clickedLocation          = {};
        $scope.clickedLocation.location = null;
        $scope.clickedEntity        = {};
        $scope.clickedEntity.entity = null;
        $scope.connections          = {};
        $scope.editing              = false;
        $scope.actions              = {'interacted': false};
        $scope.templateShown        = false;
        $scope.waitingForResponse   = false;

        $scope.newEntity            = function () {
            return {
                "categories"          : [],
                "collaborations"      : [],
                "data_given"          : [],
                "data_received"       : [],
                "employees"           : null,
                "employments"         : [],
                "expenses"            : [],
                "followers"           : null,
                "grants_given"        : [],
                "grants_received"     : [],
                "id"                  : null,
                "influence"           : "Global",
                "investments_made"    : [],
                "investments_received": [],
                "key_people"          : [],
                "locations"           : [],
                "name"                : "",
                "nickname"            : null,
                "relations"           : [],
                "revenues"            : [],
                "twitter_handle"      : null,
                "type"                : 'Individual',
                "url"                 : null,
                "index"               : null,
                "weight"              : null,
                "x"                   : null,
                "y"                   : null,
                "px"                  : null,
                "py"                  : null
            };
        };
        $scope.editEntity           = $scope.newEntity();
        $scope.newOrganization      = $scope.newEntity();
        $scope.newOrganization.type = null;
        $scope.toggleSettings       = function () {
            $scope.settingsEnabled = !$scope.settingsEnabled;
        };
        $scope.getURLID             = function () {
            var entityID = $location.search().entityID;
            if (entityID) {
                entityID = parseInt(entityID);
            }

            return entityID;
        };
        $scope.dataToEntities       = function (data) {
            $scope.ready       = true;
            $scope.entities    = data.nodes;
            var locations      = _.uniq(
                _.pluck(
                    _.flatten(_.pluck($scope.entities, 'locations')),
                    'locality'));
            $scope.entityNames =
                _.uniq(_.pluck($scope.entities, 'name'));
            var sorted         = [];
            for (var i = 0; i < $scope.entityNames.length; i++) {
                sorted.push($scope.entityNames[i].toLowerCase());
            }
            $scope.entityNames     = sorted;
            var entitiesByLocation = _.map(locations, function (loc) {
                var findings = _.filter($scope.entities, _.flow(
                    _.property('locations'),
                    _.partialRight(_.any, {locality: loc})
                ));
                return {
                    name    : loc,
                    type    : 'location',
                    entities: findings,
                    dict    : _.zipObject(_.pluck(findings, 'name'),
                                          _.pluck(findings, 'index'))
                };
            });
            $scope.searchItems     =
                entitiesByLocation.concat($scope.entities);
        };
        $http.get('api/entities')
            .success(function (data) {
                $scope.dataToEntities(data);
            });
        // Maybe get from database.
        $scope.entityTypes     = {
            'Government': true,
            'For-Profit': true,
            'Non-Profit': true,
            'Individual': true
        };
        // Get from database.
        $scope.connectionTypes = {
            'Funding'      : true,
            'Data'         : true,
            'Employment'   : true,
            'Collaboration': true
        };

        $scope.influenceTypes = ['Local', 'National', 'Global'];
        $scope.sizeBys        =
            [{'name': 'Employees', 'value': 'employees'},
             {'name': 'Twitter Followers', 'value': 'followers'}];
        $scope.sizeBy         = 'employees';

        $scope.showView    = {
            'Network': true,
            'Map'    : false
        };
        $scope.overviewUrl = null;

        $scope.changeView = function (view) {
            _.forEach(_.keys($scope.showView), function (name) {
                $scope.showView[name] = (view === name);
            });
            $scope.$broadcast('viewChange');
        };

        $scope.setEntity   = function (entity) {
            $scope.currentEntity = entity;
            if ($scope.editing) {
                $scope.stopEdit();
            }
            $scope.$broadcast('entityChange');
        };
        $scope.setEntityID = function (id) {
            $scope.setEntity(_.find($scope.entities, {'id': id}));
        };

        $scope.$on('setCurrentEntity', function (event, args) {
            $scope.currentEntity = args.value;
        });

        $scope.$on('setCurrentLocation', function (event, args) {
            $scope.currentLocation = args.value;
        });
        $scope.setEntities = function (entities) {
            $scope.entities = entities;
        };

        $scope.startEdit = function (entity) {
            if (entity) {
                $scope.editEntity = entity;
            } else {
                var newEntity = {};
                _.forEach($scope.entities[0], function (value, key) {
                    newEntity[key] = _.isArray(value) ? [] : null;
                });
                $scope.editEntity = newEntity;
            }
            $scope.editing = true;
        };

        $scope.stopEdit = function () {
            $scope.editing = false;
        };

        $scope.changeSizeBy = function () {
            $scope.$broadcast('changeSizeBy', $scope.sizeBy);
        };

        $scope.toggleLink = function (type) {
            $scope.$broadcast('toggleLink', {
                'name'   : type,
                'enabled': $scope.connectionTypes[type]
            });
        };

        $scope.toggleNode = function (type) {
            $scope.$broadcast('toggleNode', {
                'name'   : type,
                'enabled': $scope.entityTypes[type]
            });
        };

        $scope.animationsEnabled = true;

        $scope.showAbout = function () {
            $modal.open({
                            animation  : false,
                            templateUrl: 'partials/about.html?i='
                                         + $scope.random,
                            controller : function ($scope,
                                                   $modalInstance) {
                                $scope.closeWindow = function () {
                                    $modalInstance.close();
                                };
                            }
                        });
        };

        $http.get('api/categories')
            .success(function (data) {
                $scope.categories = data.categories;
            });
        // See https://coderwall.com/p/ngisma/safe-apply-in-angular-js
        $scope.safeApply = function (fn) {
            var phase = this.$root.$$phase;
            if (phase === '$apply' || phase === '$digest') {
                if (fn && (typeof(fn) === 'function')) {
                    fn();
                }
            }
            else {
                this.$apply(fn);
            }
        };
    }

    angular.module('civic-graph-kiosk')
        .controller('homeCtrl', controllerDependencies);


})(angular);
