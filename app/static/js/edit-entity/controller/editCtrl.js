(function (angular) {

    'use strict';

    var editControllerDeps = [
        '$scope',
        '$http',
        '$timeout',
        '_',
        'entityService',
        'locationService',
        editCtrl
    ];

    function isDef(obj) {
        return obj !== undefined && obj !== null;
    }

    function editCtrl($scope, $http, $timeout, _, entityService, locationService) {
        $scope.isEditing      = false;
        $scope.editEntity     = entityService.getEntityModel($scope.entity);
        $scope.entityTypes    = entityService.getEntityTypes();
        $scope.influenceTypes = entityService.getInfluenceTypes();

        var categoryBackup;

        $scope.categories = [];

        $scope.addressSearch = function (search) {
            return $http.jsonp('https://dev.virtualearth.net/REST/v1/Locations', {
                    params: {
                        query    : search,
                        key      : 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD',
                        'jsonp'  : 'JSON_CALLBACK',
                        'include': 'ciso2'
                    }
                })
                .then(function (response) {
                    if (isDef(response.data.resourceSets) && response.data.resourceSets.length
                                                             > 0) {
                        return response.data.resourceSets[0].resources;
                    }
                });
        };

        $scope.toggleCategory = function (category) {
            if ($scope.editEntity.categories.length === 0) {
                $scope.editEntity.categories.push(category);
            }
            else {
                var found = false;

                for (var categoryIndex in $scope.editEntity.categories) {
                    if (!$scope.editEntity.categories.hasOwnProperty(categoryIndex)) {
                        continue;
                    }
                    var entityCategory = $scope.editEntity.categories[categoryIndex];
                    if (entityCategory.id === category.id) {
                        found                  = true;
                        entityCategory.enabled = category.enabled;
                        break;
                    }
                }
                if (!found) {
                    $scope.editEntity.categories.push(category);
                }
            }
        };

        $scope.setLocation = function (location, isLast) {
            $scope.addressSearch(location.formattedAddress)
                .then(function (apiCallResult) {
                    var result  = apiCallResult[0],
                        address = result.address,
                        point   = result.point;
                    $scope.addLocation(isLast);

                    // Parses API call result
                    location.address_line = isDef(address.addressLine) ? address.addressLine : '';
                    location.locality     = isDef(address.locality) ? address.locality : '';
                    location.district     =
                        isDef(address.adminDistrict) ? address.adminDistrict : '';
                    location.country      =
                        isDef(address.countryRegion) ? address.countryRegion : null;
                    location.country_code =
                        isDef(address.countryRegionIso2) ? address.countryRegionIso2 : '';
                    location.coordinates  = isDef(point.coordinates) ? point.coordinates : null;
                    location.postal_code  = isDef(address.postalCode) ? address.postalCode : null;
                });
        };

        $scope.addLocation = function (isLast) {
            if (isLast) {
                $scope.editEntity.locations.push(locationService.getLocationModel());
            }
        };

        $scope.addKeyPerson = function () {
            // Add blank field to edit if there are none.
            // WATCH OUT! TODO: If someone deletes an old person, delete their id too.
            // i.e. make sure old/cleared form fields aren't being edited into new people.
            if (!(_.some($scope.editEntity.key_people, {'name': '', 'id': null}))) {
                $scope.editEntity.key_people.push({'name': '', 'id': null});
            }
        };

        $scope.setFundingConnection = function (entity, funding) {
            // Add other entity's id to this finance connection.
            funding.entity_id = entity.id;
        };

        $scope.addFundingConnection = function (funding) {
            if (!_.some(funding, {'entity': ''})) {
                // Maybe set amount to 0 instead of null?
                funding.push({'entity': '', 'amount': null, 'year': null, 'id': null});
            }
        };

        $scope.setConnection = function (entity, connection) {
            connection.entity_id = entity.id;
        };

        $scope.addConnection = function (connections) {
            // Add an empty connection to edit if none exist.
            if (!_.some(connections, {'entity': '', 'id': null})) {
                connections.push({'entity': '', 'id': null, 'details': null});
            }
        };

        $scope.addFinance = function (records) {
            // Add new finance field if all current fields are valid.
            if (_.every(records, function (r) {
                    return r.amount > 0 && r.year > 1750;
                })) {
                records.push({'amount': null, 'year': null, 'id': null});
            }
        };

        $scope.save = function () {
            $scope.isSaving = true;
            $http.post('api/save', {'entity': $scope.editEntity.generateDBModel()})
                .success(function (response) {
                    $scope.isSaving = false;
                    $scope.$emit("editEntitySuccess", response);
                    // Call to homeCtrl's parent stopEdit() to change view back and any other
                    // high-level changes.
                    $scope.cancelEdit();
                })
                .error(function () {
                    $scope.isError = true;
                    $timeout(function () {
                        $scope.isError = false;
                    }, 2000);
                });
        };

        $scope.cancelEdit = function () {
            $scope.isOpen = false;
        };

        $scope.$watch('entity', function (newVal, oldVal) {
            if (angular.equals(newVal, oldVal)) {
                return;
            }
            $scope.editEntity = entityService.getEntityModel(newVal);
            $scope.categories = angular.copy(categoryBackup);

            initCategoryArray();

            $scope.isEditing = isDef($scope.editEntity.id);
        });

        /**
         * Initializes category fields with entity values.
         *
         * Loops through category in categories and loops through category in entity. Identifies
         * categories enabled in the entity and sets local display data. This is because we created
         * a backup of entity data so that the api data is not tampered with directly.
         *
         * TODO: replace with better data structure for categories.
         */
        function initCategoryArray() {
            var category,
                categoryIndex,
                entityCategoryIndex,
                entityCategory;

            for (categoryIndex in $scope.categories) {
                if(!$scope.categories.hasOwnProperty(categoryIndex)) {
                    continue;
                }
                category = $scope.categories[categoryIndex];
                for (entityCategoryIndex in $scope.editEntity.categories) {
                    if(!$scope.editEntity.categories.hasOwnProperty(entityCategoryIndex)) {
                        continue;
                    }
                    entityCategory = $scope.editEntity.categories[entityCategoryIndex];
                    if (category.id === entityCategory.id) {
                        category.enabled = entityCategory.enabled;
                    }
                }
            }
        }

        // Retrieve Categories from DB
        $http.get('api/categories')
            .success(function (data) {
                categoryBackup    = data.categories;
                // Creates backup of data using Angular to prevent api data from being tampered
                // directly
                $scope.categories = angular.copy(categoryBackup);
                // $scope.categories = data.categories;
            });
    }

    angular.module('civic-graph')
        .controller('editCtrl', editControllerDeps);

})(angular);
