angular.module('civic-graph', ['ui.bootstrap', 'leaflet-directive', 'ngAnimate'])
.constant('_', window._)
.config(['$locationProvider', '$httpProvider', function($locationProvider, $httpProvider) {
    $locationProvider.html5Mode(true);
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
}])
.directive('addMobileEvents', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            if (scope.mobile) {
                $("#details-panel").css( "height", "20vh");
                $("#details-panel").scrollTop(0);
                $('#details-panel').scroll(function() {
                    $(this).css('height','50vh');
                });
                $( "#details-panel" ).click(function(e) {
                    if (window.innerHeight/3 > parseInt($(this).css('height'))) {
                        $(this).css('height','50vh');
                    } else {
                        $(this).css('height','20vh');
                    }
                });
            }
        }
    };
})
.controller('homeCtrl', ['$scope', '$http', '$location', '$modal', function($scope, $http, $location, $modal) {
    $scope.random = new Date().getTime();
    $scope.entities = [];
    $scope.searchItems = null;                 
    $scope.categories = [];
    $scope.currentLocation = null;              
    $scope.clickedLocation = {};                 
    $scope.clickedLocation.location = null;        
    $scope.currentEntity;
    $scope.clickedEntity = {};
    $scope.clickedEntity.entity = null;
    $scope.editEntity;
    $scope.connections = {};
    $scope.editing = false;
    $scope.actions = {'interacted':false};

    window.mobilecheck = function() {
        var check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    }
    $scope.mobile = window.mobilecheck();
    $scope.settingsEnabled = !$scope.mobile;

    $scope.toggleSettings = function() {
        $scope.settingsEnabled = !$scope.settingsEnabled;
    }
    $scope.getURLID = function() {
        var entityID = $location.search().entityID;
        if (entityID) {entityID = parseInt(entityID);};
        return entityID
    }
    $http.get('api/entities')
        .success(function(data) {
            $scope.entities = data.nodes;
            var locations = _.uniq(_.pluck(_.flatten(_.pluck($scope.entities, 'locations')), 'locality'));

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

            
            if ($scope.getURLID()) {
                // Set the entity to the ID in the URL if it exists.
                $scope.setEntityID($scope.getURLID());
            }
            $scope.overviewUrl = 'partials/overview.html?i='+$scope.random;
            $scope.$broadcast('entitiesLoaded');
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
    $scope.setLocation = function(location){
        $scope.currentLocation = location;
        if ($scope.editing){
            $scope.stopEdit();
        }
        $scope.$broadcast('itemChange');
    }

    $scope.selectItem = function(item){
        if(item.type === 'location'){
            $scope.setLocation(item);
        }
        else{
            item % 1 === 0 ? $scope.setEntityID(item) : $scope.setEntity(item);
        }
        $scope.$broadcast('selectItem', item);
    }

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
.controller('overviewCtrl', ['$scope', function($scope) {
    $scope.categorizedEntities = {};
    _.forEach(_.keys($scope.entityTypes), function(type) {
        $scope.categorizedEntities[type] = _.filter($scope.entities, {'type': type});
    });
}])
.controller('detailsCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.itemsShownDefault = {'key_people': 3, 'grants_given': 3, 'grants_received': 3, 'investments_made': 3, 'investments_received': 3, 'collaborations': 3, 'employments': 3, 'relations': 3, 'data_given': 3, 'data_received': 3, 'revenues': 3, 'expenses': 3}
    $scope.itemsShown = _.clone($scope.itemsShownDefault);

    $scope.$on('entityChange', function(event) {
        // Reset items shown in details list.
        $scope.itemsShown = _.clone($scope.itemsShownDefault);
    });
    $scope.showMore = function(type) {
        $scope.itemsShown[type] = $scope.currentEntity[type].length;
    }
    $scope.showLess = function(type) {
        $scope.itemsShown[type] = $scope.itemsShownDefault[type];
    }
}])
.controller('editCtrl', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
    $scope.updating = false;
    $scope.error = false;

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
        connection.entity_id = entity.id;
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
    $scope.addBlankFields = function() {
        $scope.addLocation($scope.editEntity.locations);
        $scope.addKeyPerson();
        $scope.addFundingConnection($scope.editEntity.grants_received);
        $scope.addFundingConnection($scope.editEntity.investments_received);
        $scope.addFundingConnection($scope.editEntity.grants_given);
        $scope.addFundingConnection($scope.editEntity.investments_made);
        $scope.addConnection($scope.editEntity.data_given);
        $scope.addConnection($scope.editEntity.data_received);
        $scope.addConnection($scope.editEntity.collaborations);
        $scope.addConnection($scope.editEntity.employments);
        $scope.addConnection($scope.editEntity.relations);
        $scope.addFinance($scope.editEntity.revenues);
        $scope.addFinance($scope.editEntity.expenses);
    }
    $scope.addBlankFields();

    $scope.isValid = function() {
        function entitySelected(arrayofentityarrays){
            var collaborationIsValid = true;
            _.each(arrayofentityarrays, function(arrayofentities){
                _.each(arrayofentities, function(c){
                    if (!c.entity && c.entity != ""){
                    collaborationIsValid = false;
                    }
                })
            })
            return collaborationIsValid
        }
        var arrayofentityarrays = [
        $scope.editEntity.collaborations, $scope.editEntity.employments, 
        $scope.editEntity.relations, $scope.editEntity.data_received,
        $scope.editEntity.data_given, $scope.editEntity.grants_given,
        $scope.editEntity.grants_received, $scope.editEntity.investments_made,
        $scope.editEntity.investments_received
        ]
        return $scope.editEntity.type != null && $scope.editEntity.name && $scope.editEntity.name.length > 0 && entitySelected(arrayofentityarrays);
    }
    var removeCommas = function(finances) {
        _.forEach(finances, function(f) {
            try {
                f.amount = Number(f.amount.replace(',',''));
            } catch (err) {
                // Can't replace on numbers, only on strings.
            }
        });
    }
    $scope.removeEmpty = function() {
        // Clear the empty unedited new items.
        _.forEach(['grants_received', 'investments_received', 'grants_given', 'investments_made','revenues', 'expenses'], function(financetype) {
            removeCommas($scope.editEntity[financetype]);
        });
        $scope.editEntity.categories = _.filter($scope.editCategories, 'enabled');
        _.remove($scope.editEntity.locations, function(l){return l.full_address == '';});
        _.remove($scope.editEntity.key_people, function(p){return p.name == '';});
        _.remove($scope.editEntity.grants_received, function(f){return f.entity == '';});
        _.remove($scope.editEntity.investments_received, function(f){return f.entity == '';});
        _.remove($scope.editEntity.grants_given, function(f){return f.entity == '';});
        _.remove($scope.editEntity.investments_made, function(f){return f.entity == '';});
        _.remove($scope.editEntity.data_given, function(d){return d.entity == '';});
        _.remove($scope.editEntity.data_received, function(d){return d.entity == '';});
        _.remove($scope.editEntity.collaborations, function(c){return c.entity == '';});
        _.remove($scope.editEntity.employments, function(c){return c.entity == '';});
        _.remove($scope.editEntity.relations, function(c){return c.entity == '';});
        _.remove($scope.editEntity.revenues, function(r){return r.amount <= 0 || r.year < 1750;});
        _.remove($scope.editEntity.expenses, function(e){return e.amount <= 0 || e.year < 1750;;});

    }

    $scope.savetoDB = function() {
        $scope.updating = true;
        $http.post('api/save', {'entity': $scope.editEntity})
            .success(function(response) {
                $scope.setEntities(response.nodes);
                $scope.setEntityID($scope.editEntity.id);
                $scope.broadcast('entitiesLoaded')
                // Call to homeCtrl's parent stopEdit() to change view back and any other high-level changes.
                $scope.updating = false;
            })
            .error(function(data, status, headers, config){
                console.log('ERROR');
                $scope.error = true;
                $timeout(function() {
                    $scope.error = false;
                    $scope.updating = false;
                    $scope.addBlankFields();
                }, 5000);
            });
    }
    $scope.cancelEdit = function() {
        $scope.removeEmpty();
        $scope.stopEdit();
    }
    $scope.save = function() {
        $scope.removeEmpty();
        $scope.savetoDB();
    }
}])
.controller('networkCtrl', ['$scope', '$http', function($scope, $http) {
    // TODO: Make a hashmap on the backend of id -> position, then use source: entities[map[sourceid]] to get nodes.
    // See http://stackoverflow.com/q/16824308
    $scope.switchView = function() {
        $scope.changeView('Map');
    }

    $scope.showLicense =  true;
    $scope.$on('entitiesLoaded', function() {
        $http.get('api/connections').
        success(function(data) {
            _.forEach(_.keys(data.connections), function(type) { $scope.connections[type] = []; });
            _.forEach(data.connections, function(connections, type) {
                _.forEach(connections, function(connection) {
                    var sourceNode = _.find($scope.entities, {'id': connection.source});
                    var targetNode = _.find($scope.entities, {'id': connection.target});
                    $scope.connections[type].push({'source': sourceNode, 'target': targetNode});
                });
            });
            if ($scope.mobile) { drawNetworkMobile();} else {drawNetwork();};
        });
    });

    var drawNetworkMobile = function() {
        // Only show labels on top 5 most connected entities initially.
        _.forEach(_.keys($scope.entityTypes), function(type) {
            // Find the top 5 most-connected entities.
            var top5 = _.takeRight(_.sortBy(_.filter($scope.entities, {'type': type}), 'collaborations.length'), 5);
            _.forEach(top5, function(entity) {entity.wellconnected = true;});
        });


        var data = {
            nodes: $scope.entities,
            links: _.flatten(_.values($scope.connections))
        }
        var colors = {
            'Government': {'focused' : 'rgba(242, 80, 34, 1)', 'unfocused' : 'rgba(242, 80, 34, 0.1)'},
            'Non-Profit': {'focused' : 'rgba(30, 144, 255, 1)', 'unfocused' : 'rgba(30, 144, 255, 0.1)'},
            'For-Profit': {'focused' : 'rgba(127, 186, 0, 1)', 'unfocused' : 'rgba(127, 186, 0, 0.1)'},
            'Individual': {'focused' : 'rgba(255, 175, 44, 1)', 'unfocused' : 'rgba(255, 175, 44, 0.1)'},
            'Funding': {'focused' : '#FF7460', 'unfocused' : '#E3DFE4'},
            'Data': {'focused' : '#84C2FF', 'unfocused' : '#E3DFE4'},
            'Employment': {'focused' : '#EE73FF', 'unfocused' : '#E3DFE4'},
            'Collaboration': {'focused' : '#FFD955', 'unfocused' : '#E3DFE4'}
        };
        var width = $('#canvas-force').width(),
            height = $('#canvas-force').height();

        var offsets = {
            'Government': [-90,-90-(height/7)],
            'Non-Profit': [-90,90-(height/7)],
            'For-Profit': [90,-90-(height/7)],
            'Individual': [90,90-(height/7)]
        }
        var isInsideCircle = function (x, y, cx, cy, radius) {
            var dx = x-cx
            var dy = y-cy
            return dx*dx+dy*dy <= radius*radius
        }
        var scale = {
            'employees': function(e) { 
                if (e>200000){
                    return 7
                } else {
                    return ((e/200000) * 5 )+1.5;
                }
            },            
            'followers': function(f) {
                if (f > 0 && f <= 500){return 1.5;}
                else if(f > 500 && f <= 5000){ return 1.8;}
                else if(f >5000 && f <= 10000){ return 2}
                else if(f > 10000 && f <= 25000){ return 2.5}
                else if(f >25000 && f <= 900000){ return 3}
                else if(f >900000){ return 5}
                else{return 1}
            }          
        }

        var canvas = d3.select('div#canvas-force').append('canvas');
        var context = canvas.node().getContext('2d');
        var devicePixelRatio = window.devicePixelRatio || 1,
        backingStoreRatio = context.webkitBackingStorePixelRatio ||
                            context.mozBackingStorePixelRatio ||
                            context.msBackingStorePixelRatio ||
                            context.oBackingStorePixelRatio ||
                            context.backingStorePixelRatio || 1,
        ratio = devicePixelRatio / backingStoreRatio;

        canvas
            .attr('width', width*ratio)
            .attr('height', height*ratio)
            .attr('id', 'networkCanvas');

        var canvasEl = document.getElementById('networkCanvas');

        canvasEl.style.width = width + 'px';
        canvasEl.style.height = height + 'px';
        context.scale(ratio, ratio);

    var scalezoom = 1;
    $('#networkCanvas').click(function (e) {
        var oX = e.offsetX/scalezoom,
            oY = e.offsetY/scalezoom;
        $scope.showLicense = false;
        $scope.clickedEntity.entity = null;
        var entityFound = false;
        data.nodes.forEach(function(d) {
            var k = scale[$scope.sizeBy](d[$scope.sizeBy]);
            if(isInsideCircle(oX, oY, d.x+offsets[d.type][0], d.y+offsets[d.type][1], 4.5*k)) {
                $scope.$emit('setCurrentEntity', { value: d });
                entityFound = true;
                $scope.setEntity(d);
                $scope.clickedEntity.entity = d;
                focus(d);
            }
        });
        if (!entityFound) {
            $scope.$emit('setCurrentLocation', { value: null });
            $scope.$emit('setCurrentEntity', { value: null });
        }
        tick();
        $scope.actions.interacted = true
        $scope.safeApply();
        $("#details-panel").scrollTop(0);
    });
        $('#nloader').hide();

        var count = 0;
        var initialLoad = true;
        var drawOnTop = [];
        var allNodes = [];
        data.nodes.forEach(function(d) {
                if ($scope.entityTypes[d.type]) {
                    if($scope.currentLocation){
                        if(d.name in $scope.currentLocation.dict){
                                drawOnTop.push(d);
                        }
                    }else if (!$scope.currentEntity || showEntities[d.id] || d === $scope.currentEntity){ 
                        if ($scope.currentEntity || d.wellconnected) {
                                drawOnTop.push(d);
                        } else { 
                            allNodes.push(d);
                        }
                    } 
                }
            })
        allNodes = allNodes.concat(drawOnTop);
        var tick = function() {
            count++
            if (count > 70 && initialLoad){
                initialLoad = false;
                force.stop();
                new RTP.PinchZoom($('#networkCanvas'), {});
            }
            context.clearRect(0, 0, width, height);
            var showEntities = {};
            // Draw links.
            context.strokeStyle = '#ccc';
             _.forEach($scope.connections, function(connections, type) {
                connections.forEach(function(d) {
                    if ($scope.connectionTypes[type] && ($scope.entityTypes[d.target.type] && $scope.entityTypes[d.source.type])) {
                        if($scope.currentLocation){
                            if(d.source.name in $scope.currentLocation.dict && d.target.name in $scope.currentLocation.dict){
                                context.beginPath()

                                //  Modification - Boundaries      var k = scale[$scope.sizeBy](d[$scope.sizeBy]);
                                var k = scale[$scope.sizeBy]((d.source)[$scope.sizeBy]);
                                context.moveTo(Math.max(4.5*k, Math.min(width - 4.5*k, d.source.x+offsets[d.source.type][0])), Math.max(4.5*k, Math.min(height - 4.5*k, d.source.y+offsets[d.source.type][1])));
                                context.lineTo(Math.max(4.5*k, Math.min(width - 4.5*k, d.target.x+offsets[d.target.type][0])), Math.max(4.5*k, Math.min(height - 4.5*k, d.target.y+offsets[d.target.type][1])));

                                context.strokeStyle = colors[type]['focused']
                                context.stroke()
                                context.closePath();
                            }
                        }
                        else{
                            if (!$scope.currentEntity || d.source == $scope.currentEntity || d.target == $scope.currentEntity) {
                                context.beginPath()

                                //  Modification - Boundaries
                                var k = scale[$scope.sizeBy]((d.source)[$scope.sizeBy]);
                                context.moveTo(Math.max(4.5*k, Math.min(width - 4.5*k, d.source.x+offsets[d.source.type][0])), Math.max(4.5*k, Math.min(height - 4.5*k, d.source.y+offsets[d.source.type][1])));
                                context.lineTo(Math.max(4.5*k, Math.min(width - 4.5*k, d.target.x+offsets[d.target.type][0])), Math.max(4.5*k, Math.min(height - 4.5*k, d.target.y+offsets[d.target.type][1])));

                                context.strokeStyle = colors[type]['focused']
                                context.stroke()
                                context.closePath();
                                showEntities[d.source.id] = true;
                                showEntities[d.target.id] = true;
                            }
                        }
                    }
                });
            });
            var entityNames = [];
            allNodes.forEach(function(d) {
                if ($scope.entityTypes[d.type]) {
                    var focus;

                    if($scope.currentLocation){
                        if(d.name in $scope.currentLocation.dict){
                            focus = 'focused';
                            context.strokeStyle = 'white';
                            entityNames.push(d);
                        }
                        else {
                            context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                            focus = 'unfocused';
                        }
                    }
                    else{
                        if (!$scope.currentEntity || showEntities[d.id] || d === $scope.currentEntity){
                            focus = 'focused';
                            context.strokeStyle = 'white';
                            if ($scope.currentEntity) {
                                entityNames.push(d);
                            }
                            else{
                                if (d.wellconnected) {
                                    entityNames.push(d);
                                }
                            }
                        } else {
                            context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                            focus = 'unfocused';
                        }
                    }
                    var k = scale[$scope.sizeBy](d[$scope.sizeBy]);
                    context.beginPath();
                    context.fillStyle = colors[d.type][focus];
                    context.arc(Math.max(4.5*k, Math.min(width - 4.5*k, d.x+offsets[d.type][0])), Math.max(4.5*k, Math.min(height - 4.5*k, d.y+offsets[d.type][1])), 4.5*k, 0, 2 * Math.PI);
                    context.fill()
                    context.lineWidth = 1;
                    context.stroke();
                    context.closePath();
                }
            });
            _.forEach(entityNames, function(d){
                var k = scale[$scope.sizeBy](d[$scope.sizeBy]);
                context.strokeStyle = 'black';
                var name = d.nickname ? d.nickname : d.name;
                context.font='lighter 11px Segoe UI, HelveticaNeue-Light, sans-serif-light, sans-serif';
                context.strokeText(name, Math.max(4.5*k, Math.min(width - 4.5*k, d.x+offsets[d.type][0]))-name.length*2, Math.max(4.5*k, Math.min(height - 4.5*k, d.y+offsets[d.type][1]))+10, 100)            });      
        }
        var force = d3.layout.force()
            .size([width, height])
            .nodes(data.nodes)
            .links(data.links)
            .on("tick", tick)
            .charge(-2)
            .linkStrength(0.1)
            .linkDistance(50)
            .start();

        $scope.$on('toggleNode', function(event, type) {
            tick();
        });
        $scope.$on('toggleLink', function(event, link) {
            tick();
        });
        $scope.$on('changeSizeBy', function(event, link) {
            tick();
        });
        $scope.$on('selectItem', function(event, item) {
            if(item.type === 'location'){
                $scope.clickedLocation.location = $scope.currentLocation;
                $scope.$emit('setCurrentEntity', { value: null });
            }
            else{
                $scope.clickedEntity.entity = $scope.currentEntity;
                $scope.$emit('setCurrentLocation', { value: null });
            }
             $scope.actions.interacted = true;
             $scope.safeApply();
             tick();
         });
    }
    var drawNetwork = function() {
        var svg = d3.select('#network');
        var bounds = svg.node().getBoundingClientRect();
        var height = bounds.height;
        var width = bounds.width;
        var offsetScale = 6;
        var defaultnodesize = 7;
        var offsets = {
            'Individual': {'x': 1, 'y': 1},
            'For-Profit': {'x': 1, 'y': -1},
            'Non-Profit': {'x': -1, 'y': 1},
            'Government': {'x': -1, 'y': -1}
        }
        var lowerBoundRadius = 10;  
        var upperBoundRadius = 50;
        var scale = {
            'employees': d3.scale.sqrt().domain([10, 130000]).range([lowerBoundRadius, upperBoundRadius]),
            'followers': d3.scale.sqrt().domain([10, 10000000]).range([lowerBoundRadius, upperBoundRadius])
        }
        var links = {};
        var force = d3.layout.force()
            .size([width, height])
            .nodes($scope.entities)
            .links(_.flatten(_.values($scope.connections)))
            .charge(function(d) {
                return d.employees ? -2*scale.employees(d.employees) : -20;
            })
            .linkStrength(0)
            .linkDistance(50);

        _.forEach($scope.connections, function(connections, type) {
            links[type] = svg.selectAll('.link .'+type+'-link')
            .data(connections)
            .enter().append('line')
            .attr('class', function(d) {d.type = type; return 'link '+type+'-link '+d.source.type+'-link '+d.target.type+'-link';});
        });

        var node = svg.selectAll('.node')
            .data($scope.entities)
            .enter().append('g')
            .attr('class', function(d) {return 'node '+d.type+'-node';})
            .call(force.drag);

        node.append('circle')
            .attr('r', function(d) {return d.employees ? scale['employees'](d.employees) : defaultnodesize;});

        node.append('text')
            .text(function(d) {return d.nickname ? d.nickname : d.name;})
            .attr('dx', function(d) {return (-0.065*this.getComputedTextLength()/2)+'em';})
            .attr('dy', function(d) {return (0.08*this.parentNode.getBBox().height/2 + 0.5)+'em';});

        force.on('tick', function(e) {
            // Cluster in four corners based on offset.
            var k = offsetScale*e.alpha;
            // console.log(e.alpha)
            _.forEach($scope.entities, function(entity) {
                entity.x += offsets[entity.type].x*k;
                entity.y += offsets[entity.type].y*k;
                entity.x = Math.max(upperBoundRadius, Math.min(width - upperBoundRadius, entity.x));
                entity.y = Math.max(upperBoundRadius, Math.min(height - upperBoundRadius, entity.y));
            });

            _.forEach(links, function(link, type) {
                link
                .attr('x1', function(d) {return d.source.x;})
                .attr('y1', function(d) {return d.source.y;})
                .attr('x2', function(d) {return d.target.x;})
                .attr('y2', function(d) {return d.target.y;})
            });
            node.attr('transform', function(d) {return 'translate('+d.x+','+d.y+')';});
        });
        var speedAnimate = function(ticks) {
            // Speed up the initial animation.
            // See http://stackoverflow.com/a/26189110
            requestAnimationFrame(function render() {
                for (var i = 0; i < ticks; i++) {
                    force.tick();
                }
                if (force.alpha() > 0) {
                    requestAnimationFrame(render);
                }
            });
        }
        if (!$scope.mobile) {speedAnimate(7);}
        force.start();

        // Hash linked neighbors for easy hovering effects.
        // See http://stackoverflow.com/a/8780277
        var linkedByIndex = {};
        _.forEach(links, function(l, type) {
            _.forEach(l[0], function(connection) {
                var source = connection.__data__.source;
                var target = connection.__data__.target;
                linkedByIndex[source.index+','+target.index] = true;
                linkedByIndex[target.index+','+source.index] = true;
            });
        });

        var neighboring = function(a, b) {
            return linkedByIndex[a.index+','+b.index] | a.index == b.index;
        }

        var focusneighbors = function(entity) {
            // Apply 'unfocused' class to all non-neighbors.
            // Apply 'focused' class to all neighbors.
            // TODO: See if it can be done with just one class and :not(.focused) CSS selectors.
            node
            .classed('focused', function(n) {
                return neighboring(entity, n);
            })
            .classed('unfocused', function(n) {
                return !neighboring(entity, n);
            });

            _.forEach(links, function(link, type) {
                link
                .classed('focused', function(o) {
                    return entity.index==o.source.index | entity.index==o.target.index;
                })
                .classed('unfocused', function(o) {
                    return !(entity.index==o.source.index | entity.index==o.target.index);
                });
            });
        }

        var focus = function(entity) {
            if ($scope.currentEntity != entity) $scope.setEntity(entity);
            $scope.safeApply();
            focusneighbors(entity);
        }

        var unfocus = function(entity) {
            //var transitiondelay = 75;
            node
            .classed('focused', false)
            .classed('unfocused', false);
            _.forEach(links, function(link, type) {
                link
                .classed('focused', false)
                .classed('unfocused', false);
            });
            entity.fixed = false;
            // Restart d3 animations.
            if ($scope.clickedEntity.entity) force.resume();
            //TODO: Show generic details and not individual entity details?
        }

        var hover = function(entity) {
            if (!$scope.clickedEntity.entity && !$scope.editing) {
                focus(entity);
            }
            $scope.actions.interacted = true;
            $scope.safeApply();
        }

        var unhover = function(entity) {
            if (!$scope.clickedEntity.entity) {
                unfocus(entity);
            }
            $scope.actions.interacted = true;
            $scope.safeApply();
        }
        var focusLocation = function(location) {
            //  If the current entity is shown and it doesn't match the clicked node, then set the new node to clicked.
            $scope.safeApply();

            node.classed('focused', function(n){
              return n.name in location.dict
            })
            .classed('unfocused', function(n){
              return !(n.name in location.dict)
            });

            _.forEach(links, function(link, type){
              link
              .classed('focused', function(o){
                return (o.source.name in location.dict && o.target.name in location.dict);
              })
              .classed('unfocused', function(o){
                return !(o.source.name in location.dict) || !(o.target.name in location.dict);
              })
            })
        }

        var unfocusLocation = function(location){
            node
            .classed('focused', false)
            .classed('unfocused', false);
            _.forEach(links, function(link, type) {
                link
                .classed('focused', false)
                .classed('unfocused', false);
            });

            if ($scope.clickedLocation.location) force.resume();
        };

        var highlightLocation = function(location){
            $scope.showLicense = false;
            if($scope.clickedEntity.entity){
                unfocus($scope.clickedEntity.entity);
                $scope.clickedEntity.entity = null;
            }
            if($scope.clickedLocation.location !== location){
                unfocusLocation($scope.clickedLocation.location);
                $scope.clickedLocation.location = location;
                focusLocation(location);
            }
            if (d3.event) {d3.event.stopPropagation();}
            $scope.actions.interacted = true
            $scope.safeApply();
        }
        var click = function(entity) {
            $scope.showLicense = false;

            if($scope.clickedLocation.location) {
                unfocusLocation($scope.clickedLocation.entity);
                $scope.clickedLocation.location = null;
            }
            //  If the previous node is equal to the new node, do nothing.
            if ($scope.clickedEntity.entity == entity) {
                $scope.clickedEntity.entity = null;
            } else {
                //  Unfocus on previous node and focus on new node.
                if ($scope.clickedEntity.entity) unfocus($scope.clickedEntity.entity);
                $scope.clickedEntity.entity = entity;
                focus(entity);
            }

            // Stop event so we don't detect a click on the background.
            // See http://stackoverflow.com/q/22941796
            if (d3.event) {d3.event.stopPropagation();}
            $scope.actions.interacted = true
            $scope.safeApply();
        }

        var backgroundclick = function() {
            if ($scope.clickedLocation.location) {
                unfocus($scope.clickedLocation.location);
                $scope.clickedLocation.location = null;
            }
            if ($scope.clickedEntity.entity) {
                unfocus($scope.clickedEntity.entity);
                $scope.clickedEntity.entity = null;
            }
            $scope.safeApply();
            //TODO: Show generic details and not individual entity details.
        }
        var dblclick = function(entity) {
            if (entity.fixed == false) {
                entity.x = width/2;
                entity.y = height/2;
                entity.px = width/2;
                entity.py = height/2;
                entity.fixed = true;
                $scope.clickedEntity.entity = entity;
            } else {
                unfocus(entity);
            }
            $scope.actions.interacted = true;
            $scope.safeApply();
        }

        // var backgroundclick = function() {
        //     if ($scope.clickedEntity.entity) {
        //         unfocus($scope.clickedEntity.entity);
        //         $scope.clickedEntity.entity = null;
        //     }
        //     $scope.safeApply();
        //     //TODO: Show generic details and not individual entity details.
        // }
        node.on('mouseover', hover);
        node.on('mouseout', unhover);
        node.on('click', click);
        node.on('dblclick', dblclick);
        svg.on('click', backgroundclick);
        // $scope.$on('selectItem', function(event, item) {
        //     if(item.type !== 'location'){
        //         dblclick($scope.currentEntity);
        //     }
        // })        // Only show labels on top 5 most connected entities initially.
        _.forEach(_.keys($scope.entityTypes), function(type) {
            // Find the top 5 most-connected entities.
            var top5 = _.takeRight(_.sortBy(_.filter($scope.entities, {'type': type}), 'weight'), 5);
            _.forEach(top5, function(entity) {entity.wellconnected = true;});
        });

        node
        .classed('wellconnected', function(d) {return d.hasOwnProperty('wellconnected');})

        $scope.$on('changeSizeBy', function(event, sizeBy) {
            svg.selectAll('circle')
            .transition()
            .duration(250)
            .attr('r', function(d) {return d[sizeBy] ? scale[sizeBy](d[sizeBy]) : defaultnodesize;});
        });
        $scope.$on('toggleLink', function(event, link) {
            links[link.name]
            .classed({'visible': link.enabled, 'hidden': !link.enabled});
        });
        $scope.$on('toggleNode', function(event, type) {
            svg
            .selectAll('.'+type.name+'-node')
            .classed({'visible': type.enabled, 'hidden': !type.enabled});

            svg
            .selectAll('.'+type.name+'-link')
            .classed({
                'visible': function(l) {
                    // ConnectionType enabled, connection source entity type is enabled, connection target entity type is enabled.
                    return $scope.connectionTypes[l.type] && ($scope.entityTypes[l.source.type] && $scope.entityTypes[l.target.type]);
                },
                'hidden': function (l) {
                    // If any of ConnectionType, source entity type, or target entity type are disabled.
                    return !$scope.connectionTypes[l.type] || (!$scope.entityTypes[l.source.type] || !$scope.entityTypes[l.target.type]);
                }
            });

        });

        $scope.$on('selectItem', function(event, item){
            if(item.type === 'location'){
                highlightLocation($scope.currentLocation);
            }
            else{
                click($scope.currentEntity);
            }
        });
        // Focus the entity if it's in URL params.
        if ($scope.getURLID()){
            click($scope.currentEntity);
            //Clear entityID from URL if you want... Maybe don't do this here.
            //$location.search('entityID', null);
        };
    }
}])
.controller('mapCtrl', ['$scope', '$timeout', 'leafletData', function($scope, $timeout, leafletData) {
    $scope.switchView = function() {
        $scope.changeView('Network');
    }

    $scope.options = {
        center: {
            lat: 20.00,
            lng: -40.00,
            zoom: 3
        },
        defaults: {
            tileLayer:'https://api.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGF2aWRscm50IiwiYSI6IjA0M2RkNzMzZWJmNzEzNGYzMTdhYTExYzAyZmU4ZTE1In0.TNYlFta2VItrkn4L0Z9BJQ',
            tileLayerOptions: {
                detectRetina: true,
                reuseTiles: false
            },
            zoomControl: false,
            attributionControl: false
        }
    }

    $timeout(function () {
            var createPieChart = function(options) {
            var data = options.data;
            var pie = d3.layout.pie().sort(null).value(function(d) {return d.value});
            var arc = d3.svg.arc().outerRadius(options.r).innerRadius(options.r-10);
            var center = options.r + options.strokeWidth;
            var w = center*2;
            var h = w;
            var svg = document.createElementNS(d3.ns.prefix.svg, 'svg');
            var vis = d3.select(svg)
                        .data(data)
                        .attr('class', 'piechart')
                        .attr('width', w)
                        .attr('height', h);

            var arcs = vis.selectAll('.arc')
                        .data(pie(data))
                        .enter().append('g')
                        .attr('class', 'arc')
                        .attr('transform', 'translate(' + center + ',' + center + ')');

            arcs.append('path')
                .attr('d', arc)
                .attr('class', function(d) {return d.data.type+'-arc'});

            arcs.append("svg:text")
                .text(function(d,i) { 
                    if (i == 0) {
                    return options.count 
                    }
                }) 
                .attr("x", -4 * options.count.toString().length)
                .attr("dy", 5)
                .attr("class","arcText");

            return window.XMLSerializer ? (new window.XMLSerializer()).serializeToString(svg) : svg.xml ? svg.xml : '';
        }

        leafletData.getMap().
        then(function(map) {
            map.invalidateSize();
            new L.Control.Zoom({position: 'topright'}).addTo(map);
            L.control.locate({position: 'topright', showPopup: false, icon:'fa fa-location-arrow'}).addTo(map);
            var zoomDisplayed;
            var clusterIcon = function(cluster) {
                var children = cluster.getAllChildMarkers();
                var total = children.length;
                var clusterMarkers = _.pluck(children, 'options');
                var counts = _.map(_.countBy(clusterMarkers,'type'), function(count, type) {return {'type': type,'value': count}});
                var r = 28;
                var strokeWidth = 1;
                var iconDim = (r+strokeWidth)*2;
                var html = createPieChart({data: counts, r: r, strokeWidth: strokeWidth, count: total });
                return new L.DivIcon({html: html, className: 'marker-cluster', iconSize: new L.point(iconDim, iconDim)});
            }
            var markerIcon = {
                'Non-Profit' : L.icon({
                iconUrl: 'img/marker-nonprof.svg',
                iconSize:[60, 60]
                }),
                'For-Profit' : L.icon({
                iconUrl: 'img/marker-prof.svg',
                iconSize:[60, 60]
                }),
                'Individual' : L.icon({
                iconUrl: 'img/marker-ind.svg',
                iconSize:[60, 60]
                }),
                'Government' : L.icon({
                iconUrl: 'img/marker-gov.svg',
                iconSize:[60, 60]
                })
            }

            var markers = L.markerClusterGroup({spiderfyOnMaxZoom: true, showCoverageOnHover: false, iconCreateFunction: clusterIcon, maxClusterRadius: 30, spiderfyDistanceMultiplier: 1.3});
            _.forEach($scope.entities, function(entity) {
                _.forEach(entity.locations, function(loc) {
                    if (_.every(loc.coordinates)) {
                        if ( loc.coordinates[0].toFixed(5) == 40.78200 && loc.coordinates[1].toFixed(5) == -73.83170) {
                        loc.coordinates[0] = 40.77065;
                        loc.coordinates[1] = -73.97406;
                        }
                        var m = L.marker(loc.coordinates, {icon: markerIcon[entity.type], 'title': entity.name, 'entity_id': entity.id, 'message': entity.name, 'type': entity.type});
                        markers.addLayer(m);
                    };
                });
            });
            map.addLayer(markers);
            function onLocationError(e) {
                  alert = function() {};
            }
            map.on('locationerror', onLocationError);
            map.locate({setView: true, maxZoom: 11});
                   markers.on('clusterclick', function (a) {
            });
            markers.on('click', function(marker) {
                $scope.setEntityID(marker.layer.options.entity_id);
                $scope.clickedEntity.entity = $scope.currentEntity;
                $scope.actions.interacted = true;
                if ($scope.settingsEnabled && $scope.mobile) {$scope.toggleSettings()};
                $scope.safeApply();
            });
     
            map.on('click', function() {
                $scope.clickedEntity.entity = null;
                $scope.actions.interacted = true;
                $scope.safeApply();
            });
            $scope.$on('selectItem', function() {
                var coordinates = $scope.currentEntity.locations.length > 0 ? _.pluck($scope.currentEntity.locations, 'coordinates') : null;
                if (coordinates.length > 0) {
                    map.setView(coordinates[0], 11);
                }
                $scope.actions.interacted = true;
                $scope.safeApply();
            });
        });
    });
}]);
