angular.module('civic-graph-kiosk', ['ui.bootstrap', 'leaflet-directive', 'ngAnimate'])
.constant('_', window._)
.config(['$locationProvider', '$httpProvider', function($locationProvider, $httpProvider) {
    $locationProvider.html5Mode(true);
}])
.directive('ngEnterBlurCol', function() {
    return {
    restrict: "A",
    require: 'ngModel',
    scope: true,
    link: function (scope, element, attrs, loc) {
            element.bind("keydown keypress blur", function (event) {
                if(event.which === 13 || event.type === "blur") {
                    if (!scope.editEntity.collaborations[scope.editEntity.collaborations.length-1].entity && this.value && (event.type === "blur" && !event.relatedTarget)) {
                        $('#collaborationscontainer').append("<div ng-click='removeCollaboration(collaboration)' id='addedCollaborators'  class='greyEnt'><span>"+this.value+"</span><span class='xCLose'>&#10006</span></div>")
                        this.value = "";
                        $(".greyEnt").each(function () { 
                            $(this).on("click", function () {
                                $(this).remove();
                            })
                        });
                    }
                    event.preventDefault();
                }
            })
        }
    }
})
.directive('ngEnterBlur', ['$http',function($http) {
    return {
    restrict: "A",
    require: 'ngModel',
    scope: true,
    link: function (scope, element, attrs, loc) {
            element.bind("keydown keypress blur", function (event) {
                if(event.which === 13 || event.type === "blur") {
                    if(!scope.newOrganization.locations[0].full_address){
                        $http.jsonp('http://dev.virtualearth.net/REST/v1/Locations', {params: {query: this.value, key: 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD', 'jsonp': 'JSON_CALLBACK', 'incl': 'ciso2'}})
                            .then(function(response) {
                                console.log("success callback")
                                var location = response.data.resourceSets[0].resources[0];
                                console.log(location)
                                scope.setLocation(scope.editEntity.locations[0], location);
                                console.log(scope.editEntity)
                            });
                        $('#locationmsg').show()
                    } else {
                        $('#locationmsg').hide()
                    }

                    event.preventDefault();
                }
            })
        }
    }
}])
.directive('ngEnterBlurOrg', ['$http',function($http) {
    return {
    restrict: "A",
    require: 'ngModel',
    scope: true,
    link: function (scope, element, attrs, loc) {
            element.bind("keydown keypress blur", function (event) {
                if(event.which === 13 || event.type === "blur") {
                    if(!scope.newOrganization.locations[0].full_address){
                        $http.jsonp('http://dev.virtualearth.net/REST/v1/Locations', {params: {query: this.value, key: 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD', 'jsonp': 'JSON_CALLBACK', 'incl': 'ciso2'}})
                            .then(function(response) {
                                console.log("success callback")
                                var location = response.data.resourceSets[0].resources[0];
                                console.log(location)
                                scope.setLocation(scope.newOrganization.locations[0], location);
                                console.log(scope.newOrganization)
                            });
                        $('#locationmsgorg').show()
                    } else {
                        $('#locationmsgorg').hide()
                    }
                    event.preventDefault();
                }
            })
        }
    }
}])
.controller('homeCtrl', ['$scope', '$http', '$location', '$modal', function($scope, $http, $location, $modal) {
    $scope.random = new Date().getTime();
    $scope.entities = [];
    $scope.entityNames;
    $scope.searchItems = null;                 
    $scope.categories = [];
    $scope.currentLocation = null;              
    $scope.clickedLocation = {};                 
    $scope.clickedLocation.location = null;        
    $scope.currentEntity;
    $scope.clickedEntity = {};
    $scope.clickedEntity.entity = null;
    $scope.connections = {};
    $scope.editing = false;
    $scope.actions = {'interacted':false};
    $scope.templateShown = false;
    $scope.waitingForResponse = false;
   
    $scope.newEntity = function(type){
        return {
          "categories": [],
          "collaborations": [],
          "data_given": [],
          "data_received": [],
          "employees": null,
          "employments": [],
          "expenses": [],
          "followers": null,
          "grants_given": [],
          "grants_received": [],
          "id": null,
          "influence": "Global",
          "investments_made": [],
          "investments_received": [],
          "key_people": [],
          "locations": [],
          "name": "",
          "nickname": null,
          "relations": [],
          "revenues": [],
          "twitter_handle": null,
          "type": 'Individual',
          "url": null,
          "index": null,
          "weight": null,
          "x": null,
          "y": null,
          "px": null,
          "py": null
        }
    }
    $scope.editEntity = $scope.newEntity();
    $scope.newOrganization = $scope.newEntity();
    $scope.newOrganization.type = null;
    $scope.toggleSettings = function() {
        $scope.settingsEnabled = !$scope.settingsEnabled;
    }
    $scope.getURLID = function() {
        var entityID = $location.search().entityID;
        if (entityID) {entityID = parseInt(entityID);};
        return entityID
    }
    $scope.dataToEntities = function(data) {
        $scope.ready = true;
        $scope.entities = data.nodes;
        var locations = _.uniq(_.pluck(_.flatten(_.pluck($scope.entities, 'locations')), 'locality'));
        $scope.entityNames = _.uniq(_.pluck($scope.entities, 'name'));
        var sorted = [];
        for (var i = 0; i <  $scope.entityNames.length; i++) {
            sorted.push($scope.entityNames[i].toLowerCase());
        }
        $scope.entityNames = sorted;
        var entitiesByLocation = _.map(locations, function(loc){
            var findings = _.filter($scope.entities, _.flow(
                             _.property('locations'),
                             _.partialRight(_.any, { locality : loc })
                           ));
            return {
                name: loc,
                type: 'location',
                entities: findings,
                dict: _.zipObject(_.pluck(findings, 'name'), _.pluck(findings, 'index'))
            }
        });
        $scope.searchItems = entitiesByLocation.concat($scope.entities); 
    }
    $http.get('api/entities')
        .success(function(data) {
            $scope.dataToEntities(data);
        });
    // Maybe get from database.
    $scope.entityTypes = {
        'Government': true,
        'For-Profit': true,
        'Non-Profit': true,
        'Individual': true
    };
    // Get from database.
    $scope.connectionTypes = {
        'Funding': true,
        'Data': true,
        'Employment': true,
        'Collaboration': true,
    };

    $scope.influenceTypes = ['Local', 'National', 'Global']
    $scope.sizeBys = [{'name': 'Employees', 'value': 'employees'},{'name': 'Twitter Followers', 'value': 'followers'}];
    $scope.sizeBy = 'employees';

    $scope.showView = {
        'Network': true,
        'Map': false
    }
    $scope.overviewUrl = null;

    $scope.changeView = function(view) {
        _.forEach(_.keys($scope.showView), function(name) {
            $scope.showView[name] = view==name;
        });
        $scope.$broadcast('viewChange');
    }

    $scope.setEntity = function(entity) {
        $scope.currentEntity = entity;
        if ($scope.editing) {
            $scope.stopEdit();
        }
        $scope.$broadcast('entityChange');
    }
    $scope.setEntityID = function(id) {
        $scope.setEntity(_.find($scope.entities, {'id': id}));
    }
    // $scope.selectItem = function(entity) {
    //     entity % 1 === 0 ? $scope.setEntityID(entity) : $scope.setEntity(entity);
    //     $scope.$broadcast('selectItem
    // };
    // $scope.setLocation = function(location){
    //     $scope.currentLocation = location;
    //     if ($scope.editing){
    //         $scope.stopEdit();
    //     }
    // }

    // $scope.selectItem = function(item){
    //     if(item.type === 'location'){
    //         $scope.setLocation(item);
    //     }
    //     else{
    //         item % 1 === 0 ? $scope.setEntityID(item) : $scope.setEntity(item);
    //     }
    //     $scope.$broadcast('selectItem', item);
    // }

    $scope.$on('setCurrentEntity', function(event, args){
        $scope.currentEntity = args.value;
    });

    $scope.$on('setCurrentLocation', function(event, args){
        $scope.currentLocation = args.value;
    });
    $scope.setEntities = function(entities) {
        $scope.entities = entities;
    }

    $scope.startEdit = function(entity) {
        if (entity) {
            $scope.editEntity = entity;
        } else {
            newEntity = {};
            _.forEach($scope.entities[0], function(value, key) {
                newEntity[key] = _.isArray(value) ? [] : null;
            });
            $scope.editEntity = newEntity;
        }
        $scope.editing = true;
    }

    $scope.stopEdit = function() {
        $scope.editing = false;
    }

    $scope.changeSizeBy = function(sizeBy) {
        $scope.$broadcast('changeSizeBy', $scope.sizeBy);
    }

    $scope.toggleLink = function(type) {
        $scope.$broadcast('toggleLink', {'name':type, 'enabled': $scope.connectionTypes[type]});
    }

    $scope.toggleNode = function(type) {
        $scope.$broadcast('toggleNode', {'name':type, 'enabled': $scope.entityTypes[type]});
    }

    $scope.animationsEnabled = true;

    $scope.showAbout = function () {
        $modal.open({
            animation: false,
            templateUrl: 'partials/about.html?i='+$scope.random,
            controller: function($scope, $modalInstance) {
                $scope.closeWindow = function () {
                    $modalInstance.close();
                }
            }
        });
    }

    $http.get('api/categories')
        .success(function(data) {
            $scope.categories = data.categories;
        });
    // See https://coderwall.com/p/ngisma/safe-apply-in-angular-js
    $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof(fn) === 'function')) {fn();}
        } else {this.$apply(fn);}
    };
}])
.controller('editCtrl', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
    $scope.updating = false;
    $scope.error = false;
    $scope.existsInArray = function (string, array){
        return (array.indexOf(string) >= 0)
    };
    $scope.checkOrganization = function (){
        var orgValue = $scope.editEntity.employments[0].entity.toLowerCase();
        if (!$scope.existsInArray(orgValue, $scope.entityNames) && orgValue != "") {
            if (!$scope.templateShown){
                $scope.templateShown = true;
            }
        } else {
            $scope.templateShown = false;
        }
    };

    $scope.employerFound = false;
    $scope.submit = function(){
        if(!$scope.editEntity.employments[0].entity_id && $scope.editEntity.employments[0].entity && !$scope.newOrganization.type) {
            return false;
        }

        if($scope.newOrganization.name && $scope.newOrganization.type && $scope.newOrganization.locations[0].full_address){
            $scope.removeEmpty($scope.newOrganization);
            $scope.saveOrgToDB($scope.newOrganization);
        }
    $("html, body").animate({ scrollTop: $(window).height()}, 600);
    return false;
    };
    $scope.add = function(){
        $scope.templateShown = false;
        $scope.save($scope.editEntity);
        // $scope.savetoDB();
     $("html, body").animate({ scrollTop: $(window).height()*2}, 600);
    };

    
    $scope.isValid = function(){
        // console.log($scope.editEntity)
        var valid = false;
        // if ($scope.newEntity.name && $scope.newEntity.location && $scope.newEntity.type){
        if ($scope.editEntity.name && !$scope.templateShown){
            valid = true;
        } else if ($scope.editEntity.name && $scope.newOrganization.name && $scope.newOrganization.type && $scope.newOrganization.locations[0].full_address) {
            valid = true;
        }
        return valid
    };

    $scope.isValidAdd = function(){
        var valid = false;
        if ($scope.editEntity.locations[0].full_address && !$scope.waitingForResponse){
            valid = true;
        } 
        return valid
    }

    $scope.onSelect = function ($item, $model, $label) {
        if ($item.employments.length >= 1) {
        var employment = $item.employments[0];
        $scope.editEntity.employments[0] = employment;
        $scope.employerFound = true;
            if ($item.locations) {
                var location = $item.locations[0].full_address;
                $scope.editEntity.locations[0] = {full_address: location};
            };
        };
    };
    $scope.onSelectEmployer = function ($item, $model, $label) {
        $scope.employerFound = true;
    };
    $scope.addNameToOrg = function(){
        var eName = $scope.editEntity.employments[0].entity
        $scope.newOrganization.name = eName
    };
    $scope.addressSearch = function(search) {
        return $http.jsonp('http://dev.virtualearth.net/REST/v1/Locations', {params: {query: search, key: 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD', 'jsonp': 'JSON_CALLBACK', 'incl': 'ciso2'}})
            .then(function(response) {
                return response.data.resourceSets[0].resources
            });
    }

    $scope.setLocation = function(location, data) {
        location.full_address = 'formattedAddress' in data.address && $scope.editEntity.type != 'Individual' ? data.address.formattedAddress : null;
        location.address_line = 'addressLine' in data.address && $scope.editEntity.type != 'Individual' ? data.address.addressLine : null;
        location.locality = 'locality' in data.address ? data.address.locality : null;
        location.district = 'adminDistrict' in data.address ? data.address.adminDistrict : null;
        location.postal_code = 'postalCode' in data.address ? data.address.postalCode : null;
        location.country = 'countryRegion' in data.address ? data.address.countryRegion : null;
        location.country_code = 'countryRegionIso2' in data.address ? data.address.countryRegionIso2 : null;
        location.coordinates = 'point' in data ? data.point.coordinates : null;
        if ($scope.editEntity.type == 'Individual') {
            location.full_address = location.locality ? location.district ? location.locality + ', ' + location.district : location.locality : location.country;
        }
        $('#locationmsg').hide()
        $('#locationmsgorg').hide()
    }

    $scope.addLocation = function(locations) {
        if (!_.some(locations, {'full_address':'', 'id': null})) {
            locations.push({'full_address':'', 'id': null});
        }
    }

    $scope.editCategories = _.map($scope.categories, function(c) {
        return {'name': c.name, 'enabled': _.some($scope.editEntity.categories, {'name': c.name}), 'id': c.id}
    });

    $scope.addKeyPerson = function() {
        // Add blank field to edit if there are none.
        // WATCH OUT! TODO: If someone deletes an old person, delete their id too.
        // i.e. make sure old/cleared form fields aren't being edited into new people.
        if (!(_.some($scope.editEntity.key_people, {'name': '', 'id': null}))) {
            $scope.editEntity.key_people.push({'name':'', 'id': null});
        }
    }

    $scope.setFundingConnection = function(entity, funding) {
        // Add other entity's id to this finance connection.
        funding.entity_id = entity.id;
    }

    $scope.addFundingConnection = function(funding) {
        if (!_.some(funding, {'entity':''})) {
            // Maybe set amount to 0 instead of null?
            funding.push({'entity':'', 'amount': null,'year': null, 'id': null});
        }
    }

    $scope.setConnection = function(entity, connection) {
        $scope.templateShown = false;
        connection.entity_id = entity.id;
    }
    $scope.setCollaboration = function(entity, connection) {
        $scope.templateShown = false;
        $scope.addConnection($scope.editEntity.collaborations)
        connection.entity_id = entity.id;
    }

    $scope.removeCollaboration = function (collaborator) {
        var index = $scope.editEntity.collaborations.indexOf(collaborator);
         $scope.editEntity.collaborations.splice(index, 1);     
    }
    $scope.getCollaboratorColor =  function (collaborator){
        var collabentity = _.first(_.where($scope.entities, {id: collaborator.entity_id}));
        if (collabentity) {
        return collabentity.type + "-color";
        }
    }
    $scope.addConnection = function(connections) {
        // Add an empty connection to edit if none exist.
        if (!_.some(connections, {'entity':'', 'id': null})) {
            connections.push({'entity':'', 'id': null, 'details': null});
        }
    }

    $scope.addFinance = function(records) {
        // Add new finance field if all current fields are valid.
        if (_.every(records, function(r) {return r.amount > 0 && r.year > 1750})) {
            records.push({'amount': null, 'year': null, 'id': null});
        }
    }
    $scope.addBlankFields = function(entity) {
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
    }
    $scope.addBlankFields($scope.editEntity);
    $scope.addBlankFields($scope.newOrganization);

    var removeCommas = function(finances) {
        _.forEach(finances, function(f) {
            try {
                f.amount = Number(f.amount.replace(',',''));
            } catch (err) {
                // Can't replace on numbers, only on strings.
            }
        });
    }
    $scope.removeEmpty = function(entity) {
        // Clear the empty unedited new items.
        _.forEach(['grants_received', 'investments_received', 'grants_given', 'investments_made','revenues', 'expenses'], function(financetype) {
            removeCommas(entity[financetype]);
        });
        entity.categories = _.filter($scope.editCategories, 'enabled');
        _.remove(entity.locations, function(l){return l.full_address == '';});
        _.remove(entity.key_people, function(p){return p.name == '';});
        _.remove(entity.grants_received, function(f){return f.entity == '';});
        _.remove(entity.investments_received, function(f){return f.entity == '';});
        _.remove(entity.grants_given, function(f){return f.entity == '';});
        _.remove(entity.investments_made, function(f){return f.entity == '';});
        _.remove(entity.data_given, function(d){return d.entity == '';});
        _.remove(entity.data_received, function(d){return d.entity == '';});
        _.remove(entity.collaborations, function(c){return c.entity == '';});
        _.remove(entity.employments, function(c){return c.entity == '';});
        _.remove(entity.relations, function(c){return c.entity == '';});
        _.remove(entity.revenues, function(r){return r.amount <= 0 || r.year < 1750;});
        _.remove(entity.expenses, function(e){return e.amount <= 0 || e.year < 1750;;});

    }

    $scope.savetoDB = function(entity) {
        $scope.updating = true;
        $http.post('api/save', {'entity': entity})
            .success(function(response) {
            $scope.dataToEntities(response);
            document.getElementById("nEntityForm").reset();
            $scope.editEntity = $scope.newEntity();
            $scope.newOrganization = $scope.newEntity();
            $scope.newOrganization.type = null;
            $scope.addBlankFields($scope.editEntity);
            $scope.addBlankFields($scope.newOrganization);
            $("html, body").animate({ scrollTop: 0}, 1000);
            })
            .error(function(data, status, headers, config){
                window.location.reload()
                console.log('ERROR');
                console.log(status);
                console.log(headers);
                console.log(config);
                $scope.error = true;
                $timeout(function() {
                    $scope.error = false;
                    $scope.updating = false;
                    $scope.addBlankFields($scope.editEntity);
                    $scope.addBlankFields($scope.newOrganization);
                }, 2000);
            });
    }
    $scope.addOrgToEntity = function(){
        var name = $scope.editEntity.employments[0].entity;
        var newOrg = _.find($scope.entities, function(item) {
            return item.name == name; 
        });
        $scope.editEntity.employments[0].entity = newOrg.name;
        $scope.editEntity.employments[0].entity_id = newOrg.id;
    }
    $scope.saveOrgToDB = function(entity) {
        $scope.waitingForResponse = true;
        $scope.updating = true;
        $http.post('api/save', {'entity': entity})
        .success(function(response) {
            $scope.waitingForResponse = false;
            $scope.dataToEntities(response);
            $scope.addOrgToEntity();
        })
        .error(function(data, status, headers, config){
            $scope.waitingForResponse = false;
            console.log('ERROR');
            $scope.error = true;
            $timeout(function() {
                $scope.error = false;
                $scope.updating = false;
                $scope.addBlankFields();
            }, 2000);
        });
    }

    $scope.cancelEdit = function() {
        $scope.removeEmpty();
        $scope.stopEdit();
    }
    $scope.save = function(entity) {
        $scope.removeEmpty(entity);
        $scope.savetoDB(entity);
    }
}]);
