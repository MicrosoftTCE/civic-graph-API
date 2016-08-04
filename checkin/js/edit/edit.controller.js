(function(angular) {
    'use strict';

    var editDependencies = [
        '$scope',
        '$http',
        '$timeout',
        '_',
        controller
    ];

    function controller($scope, $http, $timeout, _) {
        $scope.updating          = false;
        $scope.error             = false;
        $scope.existsInArray     = function (string, array) {
            return (array.indexOf(string) >= 0);
        };
        $scope.checkOrganization = function () {
            var orgValue = $scope.editEntity.employments[0].entity.toLowerCase();
            if (!$scope.existsInArray(orgValue, $scope.entityNames) && orgValue !== "") {
                if (!$scope.templateShown) {
                    $scope.templateShown = true;
                }
            } else {
                $scope.templateShown = false;
            }
        };

        $scope.employerFound = false;
        $scope.submit        = function () {
            if (!$scope.editEntity.employments[0].entity_id
                && $scope.editEntity.employments[0].entity && !$scope.newOrganization.type) {
                return false;
            }

            if ($scope.newOrganization.name && $scope.newOrganization.type
                && $scope.newOrganization.locations[0].full_address) {
                $scope.removeEmpty($scope.newOrganization);
                $scope.saveOrgToDB($scope.newOrganization);
            }
            $("html, body").animate({scrollTop: $(window).height()}, 600);
            return false;
        };
        $scope.add           = function () {
            $scope.templateShown = false;
            $scope.save($scope.editEntity);
            // $scope.savetoDB();
            $("html, body").animate({scrollTop: $(window).height() * 2}, 600);
        };

        $scope.isValid = function () {
            // console.log($scope.editEntity)
            var valid = false;
            // if ($scope.newEntity.name && $scope.newEntity.location && $scope.newEntity.type){
            if ($scope.editEntity.name && !$scope.templateShown) {
                valid = true;
            } else if ($scope.editEntity.name && $scope.newOrganization.name
                       && $scope.newOrganization.type
                       && $scope.newOrganization.locations[0].full_address) {
                valid = true;
            }
            return valid;
        };

        $scope.isValidAdd = function () {
            var valid = false;
            if ($scope.editEntity.locations[0].full_address && !$scope.waitingForResponse) {
                valid = true;
            }
            return valid;
        };

        $scope.onSelect         = function ($item) {
            if ($item.employments.length >= 1) {
                $scope.editEntity.employments[0] = $item.employments[0];
                $scope.employerFound             = true;
                if ($item.locations) {
                    var location                   = $item.locations[0].full_address;
                    $scope.editEntity.locations[0] = {full_address: location};
                }
            }
        };
        $scope.onSelectEmployer = function () {
            $scope.employerFound = true;
        };
        $scope.addNameToOrg     = function () {
            $scope.newOrganization.name = $scope.editEntity.employments[0].entity;
        };
        $scope.addressSearch    = function (search) {
            return $http.jsonp('http://dev.virtualearth.net/REST/v1/Locations', {
                    params: {
                        query  : search,
                        key    : 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD',
                        'jsonp': 'JSON_CALLBACK',
                        'incl' : 'ciso2'
                    }
                })
                .then(function (response) {
                    return response.data.resourceSets[0].resources;
                });
        };
        $scope.autoSetAdress    = function (search, entity) {
            return $http.jsonp('http://dev.virtualearth.net/REST/v1/Locations', {
                    params: {
                        query  : search,
                        key    : 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD',
                        'jsonp': 'JSON_CALLBACK',
                        'incl' : 'ciso2'
                    }
                })
                .then(function (response) {
                    var location = response.data.resourceSets[0].resources[0];
                    if (location) {
                        $scope.setLocation(entity.locations[0], location);
                    }
                });
        };

        $scope.setLocation = function (location, data) {
            location.full_address =
                'formattedAddress' in data.address && $scope.editEntity.type !== 'Individual'
                    ? data.address.formattedAddress : null;
            location.address_line =
                'addressLine' in data.address && $scope.editEntity.type !== 'Individual'
                    ? data.address.addressLine : null;
            location.locality     = 'locality' in data.address ? data.address.locality : null;
            location.district     =
                'adminDistrict' in data.address ? data.address.adminDistrict : null;
            location.postal_code  =
                'postalCode' in data.address ? data.address.postalCode : null;
            location.country      =
                'countryRegion' in data.address ? data.address.countryRegion : null;
            location.country_code =
                'countryRegionIso2' in data.address ? data.address.countryRegionIso2 : null;
            location.coordinates  = 'point' in data ? data.point.coordinates : null;
            if ($scope.editEntity.type === 'Individual') {
                location.full_address =
                    location.locality ? location.district ? location.locality + ', '
                                                            + location.district
                        : location.locality
                        : location.country;
            }
            $('#locationmsg').hide();
            $('#locationmsgorg').hide();
        };

        $scope.addLocation = function (locations) {
            if (!_.some(locations, {'full_address': '', 'id': null})) {
                locations.push({'full_address': '', 'id': null});
            }
        };

        $scope.editCategories = _.map($scope.categories, function (c) {
            return {
                'name'   : c.name,
                'enabled': _.some($scope.editEntity.categories, {'name': c.name}),
                'id'     : c.id
            };
        });

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

        $scope.setConnection    = function (entity, connection) {
            $scope.templateShown = false;
            connection.entity_id = entity.id;
        };
        $scope.setCollaboration = function (entity, connection) {
            $scope.templateShown = false;
            $scope.addConnection($scope.editEntity.collaborations);
            connection.entity_id = entity.id;
        };

        $scope.removeCollaboration  = function (collaborator) {
            var index = $scope.editEntity.collaborations.indexOf(collaborator);
            $scope.editEntity.collaborations.splice(index, 1);
        };
        $scope.getCollaboratorColor = function (collaborator) {
            var collabentity = _.first(_.where($scope.entities, {id: collaborator.entity_id}));
            if (collabentity) {
                return collabentity.type + "-color";
            }
        };
        $scope.addConnection        = function (connections) {
            // Add an empty connection to edit if none exist.
            if (!_.some(connections, {'entity': '', 'id': null})) {
                connections.push({'entity': '', 'id': null, 'details': null});
            }
        };

        $scope.addFinance     = function (records) {
            // Add new finance field if all current fields are valid.
            if (_.every(records, function (r) {
                    return r.amount > 0 && r.year > 1750;
                })) {
                records.push({'amount': null, 'year': null, 'id': null});
            }
        };
        $scope.addBlankFields = function (entity) {
            $scope.addLocation(entity.locations);
            $scope.addKeyPerson();
            $scope.addFundingConnection(entity.grants_received);
            $scope.addFundingConnection(entity.investments_received);
            $scope.addFundingConnection(entity.grants_given);
            $scope.addFundingConnection(entity.investments_made);
            $scope.addConnection(entity.data_given);
            $scope.addConnection(entity.data_received);
            $scope.addConnection(entity.collaborations);
            $scope.addConnection(entity.employments);
            $scope.addConnection(entity.relations);
            $scope.addFinance(entity.revenues);
            $scope.addFinance(entity.expenses);
        };
        $scope.addBlankFields($scope.editEntity);
        $scope.addBlankFields($scope.newOrganization);

        var removeCommas   = function (finances) {
            _.forEach(finances, function (f) {
                try {
                    f.amount = Number(f.amount.replace(',', ''));
                } catch (err) {
                    // Can't replace on numbers, only on strings.
                }
            });
        };
        $scope.removeEmpty = function (entity) {
            // Clear the empty unedited new items.
            _.forEach(
                ['grants_received', 'investments_received', 'grants_given', 'investments_made',
                 'revenues', 'expenses'], function (financetype) {
                    removeCommas(entity[financetype]);
                });
            entity.categories = _.filter($scope.editCategories, 'enabled');
            _.remove(entity.locations, function (l) {
                return l.full_address === '';
            });
            _.remove(entity.key_people, function (p) {
                return p.name === '';
            });
            _.remove(entity.grants_received, function (f) {
                return f.entity === '';
            });
            _.remove(entity.investments_received, function (f) {
                return f.entity === '';
            });
            _.remove(entity.grants_given, function (f) {
                return f.entity === '';
            });
            _.remove(entity.investments_made, function (f) {
                return f.entity === '';
            });
            _.remove(entity.data_given, function (d) {
                return d.entity === '';
            });
            _.remove(entity.data_received, function (d) {
                return d.entity === '';
            });
            _.remove(entity.collaborations, function (c) {
                return c.entity === '';
            });
            _.remove(entity.employments, function (c) {
                return c.entity === '';
            });
            _.remove(entity.relations, function (c) {
                return c.entity === '';
            });
            _.remove(entity.revenues, function (r) {
                return r.amount <= 0 || r.year < 1750;
            });
            _.remove(entity.expenses, function (e) {
                return e.amount <= 0 || e.year < 1750;
            });

        };

        $scope.savetoDB       = function (entity) {
            $scope.updating = true;
            $http.post('api/save', {'entity': entity})
                .success(function (response) {
                    $scope.dataToEntities(response);
                    document.getElementById("nEntityForm").reset();
                    $scope.editEntity           = $scope.newEntity();
                    $scope.newOrganization      = $scope.newEntity();
                    $scope.newOrganization.type = null;
                    $scope.addBlankFields($scope.editEntity);
                    $scope.addBlankFields($scope.newOrganization);
                    $("html, body").animate({scrollTop: 0}, 1000);
                })
                .error(function (data, status, headers, config) {
                    window.location.reload();
                    console.log('ERROR');
                    console.log(status);
                    console.log(headers);
                    console.log(config);
                    $scope.error = true;
                    $timeout(function () {
                        $scope.error    = false;
                        $scope.updating = false;
                        $scope.addBlankFields($scope.editEntity);
                        $scope.addBlankFields($scope.newOrganization);
                    }, 2000);
                });
        };
        $scope.addOrgToEntity = function () {
            var name                                   = $scope.editEntity.employments[0].entity;
            var newOrg                                 = _.find($scope.entities,
                                                                function (item) {
                                                                    return item.name === name;
                                                                });
            $scope.editEntity.employments[0].entity    = newOrg.name;
            $scope.editEntity.employments[0].entity_id = newOrg.id;
        };
        $scope.saveOrgToDB    = function (entity) {
            $scope.waitingForResponse = true;
            $scope.updating           = true;
            $http.post('api/save', {'entity': entity})
                .success(function (response) {
                    $scope.waitingForResponse = false;
                    $scope.dataToEntities(response);
                    $scope.addOrgToEntity();
                })
                .error(function () {
                    $scope.waitingForResponse = false;
                    console.log('ERROR');
                    $scope.error = true;
                    $timeout(function () {
                        $scope.error    = false;
                        $scope.updating = false;
                        $scope.addBlankFields();
                    }, 2000);
                });
        };

        $scope.cancelEdit = function () {
            $scope.removeEmpty();
            $scope.stopEdit();
        };
        $scope.save       = function (entity) {
            $scope.removeEmpty(entity);
            $scope.savetoDB(entity);
        };
    }

    angular.module('civic-graph-kiosk')
        .controller('editCtrl', editDependencies);

})(angular);
