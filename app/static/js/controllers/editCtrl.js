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


    function editCtrl($scope, $http, $timeout, _, entityService, locationService) {
        console.log($scope.entity);
        $scope.updating = false;
        $scope.error = false;
        $scope.editEntity = entityService.getEntityModel($scope.entity);
        $scope.entityTypes = entityService.getEntityTypes();
        $scope.influenceTypes = entityService.getInfluenceTypes();
        $scope.categories = [];

        $scope.addressSearch = function (search) {
            return $http.jsonp('http://dev.virtualearth.net/REST/v1/Locations', {
                params: {
                    query: search,
                    key: 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD',
                    'jsonp': 'JSON_CALLBACK',
                    'incl': 'ciso2'
                }
            })
                .then(function (response) {
                    return response.data.resourceSets[0].resources;
                });
        };

        $scope.changeType = function () {
            if ($scope.editEntity.type === 'Individual') {
                $scope.editEntity.locations = [];
                $scope.addLocation($scope.editEntity.locations);
            }
        };

        $scope.setLocation = function (location, data) {
            location.full_address = 'formattedAddress' in data.address && $scope.editEntity.type !== 'Individual' ? data.address.formattedAddress : null;
            location.address_line = 'addressLine' in data.address && $scope.editEntity.type !== 'Individual' ? data.address.addressLine : null;
            location.locality = 'locality' in data.address ? data.address.locality : null;
            location.district = 'adminDistrict' in data.address ? data.address.adminDistrict : null;
            location.postal_code = 'postalCode' in data.address ? data.address.postalCode : null;
            location.country = 'countryRegion' in data.address ? data.address.countryRegion : null;
            location.country_code = 'countryRegionIso2' in data.address ? data.address.countryRegionIso2 : null;
            location.coordinates = 'point' in data ? data.point.coordinates : null;
            if ($scope.editEntity.type === 'Individual') {
                location.full_address = location.locality ? location.district ? location.locality + ', ' + location.district : location.locality : location.country;
            }
            console.log("I ran");
        };

        $scope.addLocation = function (isLast) {
            console.log("Is last input: %O", isLast);
            console.log("Contains: %O", $scope.editEntity.locations.includes(locationService.getLocationModel()));
            console.log("Location Model: %O", locationService.getLocationModel());
            console.log("Location Array: %O", $scope.editEntity.locations);
            if(isLast){
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
            console.log(funding);
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

        $scope.isValid = function () {
            function entitySelected(arrayOfEntityArrays) {
                var collaborationIsValid = true;
                _.each(arrayOfEntityArrays, function (arrayOfEntities) {
                    _.each(arrayOfEntities, function (c) {
                        if (!c.entity && c.entity !== "") {
                            console.log(arrayOfEntities);
                            collaborationIsValid = false;
                        }
                    });
                });
                return collaborationIsValid;
            }

            var arrayofentityarrays = [
                $scope.editEntity.collaborations,
                $scope.editEntity.employments,
                $scope.editEntity.relations,
                $scope.editEntity.data_received,
                $scope.editEntity.data_given,
                $scope.editEntity.grants_given,
                $scope.editEntity.grants_received,
                $scope.editEntity.investments_made,
                $scope.editEntity.investments_received
            ];
            return $scope.editEntity.type !== null
                && $scope.editEntity.name
                && $scope.editEntity.name.length > 0
                && entitySelected(arrayofentityarrays);
        };

        $scope.savetoDB = function () {
            $scope.updating = true;
            $http.post('api/save', {'entity': $scope.editEntity})
                .success(function (response) {
                    $scope.setEntities(response.nodes);
                    $scope.setEntityID($scope.editEntity.id);
                    $scope.$broadcast('entitiesLoaded');
                    // Call to homeCtrl's parent stopEdit() to change view back and any other high-level changes.
                    $scope.updating = false;
                })
                .error(function () {
                    console.log('ERROR');
                    $scope.error = true;
                    $timeout(function () {
                        $scope.error = false;
                        $scope.updating = false;
                        $scope.addBlankFields();
                    }, 2000);
                });
        };

        $scope.cancelEdit = function () {
            $scope.isOpen = false;
            //$scope.editEntity = entityService.getEntityModel();
        };

        $scope.save = function () {
            $scope.removeEmpty();
            $scope.savetoDB();
        };

        $scope.$watch('entity', function(newVal, oldVal){
            if(angular.equals(newVal, oldVal)){
                return;
            }
            console.log(newVal);
            $scope.editEntity = entityService.getEntityModel(newVal);
        });


        // Retrieve Categories from DB
        $http.get('api/categories')
            .success(function (data) {
                $scope.categories = data.categories;
            });
    }

    angular.module('civic-graph')
        .controller('editCtrl', editControllerDeps);

})(angular);
