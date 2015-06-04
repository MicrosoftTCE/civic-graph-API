angular.module('civic-graph', ['ui.bootstrap', 'leaflet-directive'])
.constant('_', window._)
.controller('homeCtrl', function($scope, $http) {
    $scope.entities = [];
    $scope.categories = [];
    $scope.currentEntity;
    $scope.editEntity;
    $scope.connections = {};
    $scope.editing = false;

    $http.get('entities')
        .success(function(data) {
            $scope.entities = data.nodes;
            $scope.currentEntity = $scope.entities[0];
        });
    // Maybe get from database.
    $scope.entityTypes = [
        {'name': 'For-Profit', 'enabled': true},
        {'name': 'Non-Profit', 'enabled': true},
        {'name': 'Individual', 'enabled': true},
        {'name': 'Government', 'enabled': true}
    ];
    // Get from database.
    $scope.connectionTypes = [
        {'name': 'Investment', 'enabled': true},
        {'name': 'Funding', 'enabled': true},
        {'name': 'Collaboration', 'enabled': true},
        {'name': 'Data', 'enabled': true}
    ];

    $scope.influenceTypes = ['Local', 'National', 'Global']
    $scope.sizeBy = 'employees';

    $scope.templates = [
        {'name': 'network', 'url': 'static/partials/network.html'},
        {'name': 'map', 'url': 'static/partials/map.html'}
    ];

    $scope.template = $scope.templates[0];
    $scope.view = 'network'
    $scope.changeView = function(view) {
        $scope.template = _.find($scope.templates, {'name': view});
    }
    //$scope.changeView('map');

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
    $scope.setEntities = function(entities) {
        $scope.entities = entities;
    }

    $scope.startEdit = function() {
        $scope.editing = true;
        $scope.editEntity = $scope.currentEntity;
    }

    $scope.stopEdit = function() {
        $scope.editing = false;
    }

    $http.get('categories')
        .success(function(data) {
            $scope.categories = data.categories;
        });
})
.controller('detailsCtrl', function($scope, $http) {
    $scope.itemsShownDefault = {'key_people': 5, 'funding_given': 5, 'funding_received': 5, 'investments_made': 5, 'investments_received': 5, 'collaborations': 5, 'employments': 5, 'relations': 5, 'data_given': 5, 'data_received': 5, 'revenues': 5, 'expenses': 5}
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
})
.controller('editCtrl', function($scope, $http) {
    $scope.updating = false;

    $scope.addressSearch = function(search) {
        return $http.jsonp('http://dev.virtualearth.net/REST/v1/Locations', {params: {query: search, key: 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD', 'jsonp': 'JSON_CALLBACK', 'incl': 'ciso2'}})
            .then(function(response) {
                return response.data.resourceSets[0].resources
            });
    }

    $scope.setLocation = function(location, data) {
        location.full_address = 'formattedAddress' in data.address ? data.address.formattedAddress : null;
        location.address_line = 'addressLine' in data.address ? data.address.addressLine : null;
        location.locality = 'locality' in data.address ? data.address.locality : null;
        location.district = 'adminDistrict' in data.address ? data.address.adminDistrict : null;
        location.postal_code = 'postalCode' in data.address ? data.address.postalCode : null;
        location.country = 'countryRegion' in data.address ? data.address.countryRegion : null;
        location.country_code = 'countryRegionIso2' in data.address ? data.address.countryRegionIso2 : null;
        location.coordinates = 'point' in data ? data.point.coordinates : null;
    }

    $scope.addLocation = function(locations) {
        if (!_.some(locations, {'full_address':'', 'id': null})) {
            locations.push({'full_address':'', 'id': null});
        }
    }
    $scope.addLocation($scope.editEntity.locations);

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
    $scope.addKeyPerson();

    $scope.setFinanceConnection = function(entity, finance) {
        // Add other entity's id to this finance connection.
        finance.entity_id = entity.id;
    }

    $scope.addFinanceConnection = function(finances) {
        if (!_.some(finances, {'entity':''})) {
            // Maybe set amount to 0 instead of null?
            finances.push({'entity':'', 'amount': null,'year': null, 'id': null});
        }
    }
    $scope.addFinanceConnection($scope.editEntity.funding_received);
    $scope.addFinanceConnection($scope.editEntity.investments_received);
    $scope.addFinanceConnection($scope.editEntity.funding_given);
    $scope.addFinanceConnection($scope.editEntity.investments_made);

    $scope.setConnection = function(entity, connection) {
        connection.entity_id = entity.id;
    }

    $scope.addConnection = function(connections) {
        // Add an empty connection to edit if none exist.
        if (!_.some(connections, {'entity':'', 'id': null})) {
            connections.push({'entity':'', 'id': null, 'details': null});
        }
    }
    $scope.addConnection($scope.editEntity.data_given);
    $scope.addConnection($scope.editEntity.data_received);
    $scope.addConnection($scope.editEntity.collaborations);
    $scope.addConnection($scope.editEntity.employments);
    $scope.addConnection($scope.editEntity.relations);

    $scope.addFinance = function(records) {
        // Add new finance field if all current fields are valid.
        if (_.every(records, function(r) {return r.amount > 0 && r.year > 1750})) {
            records.push({'amount': null, 'year': null, 'id': null});
        }
    }
    $scope.addFinance($scope.editEntity.revenues);
    $scope.addFinance($scope.editEntity.expenses);

    $scope.removeEmpty = function() {
        // Clear the empty unedited new items.
        $scope.editEntity.categories = _.filter($scope.editCategories, 'enabled');
        _.remove($scope.editEntity.locations, function(l){return l.full_address == '';});
        _.remove($scope.editEntity.key_people, function(p){return p.name == '';});
        _.remove($scope.editEntity.funding_received, function(f){return f.entity == '';});
        _.remove($scope.editEntity.investments_received, function(f){return f.entity == '';});
        _.remove($scope.editEntity.funding_given, function(f){return f.entity == '';});
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
        $http.post('save', {'entity': $scope.editEntity})
            .then(function(response) {
                $scope.setEntities(response.data.nodes);
                $scope.setEntityID($scope.editEntity.id);
                // Call to homeCtrl's parent stopEdit() to change view back and any other high-level changes.
                $scope.updating = false;
            });
    }

    $scope.save = function() {
        $scope.removeEmpty();
        $scope.savetoDB();
    }

})
.controller('networkCtrl', function($scope, $http) {
    // TODO: Make a hashmap on the backend of id -> position, then use source: entities[map[sourceid]] to get nodes.
    // See http://stackoverflow.com/q/16824308
    $http.get('connections').
        success(function(data) {
            _.forEach(_.keys(data.connections), function(type) { $scope.connections[type] = []; });
            _.forEach(data.connections, function(connections, type) {
                _.forEach(connections, function(connection) {
                    var sourceNode = _.find($scope.entities, {'id': connection.source});
                    var targetNode = _.find($scope.entities, {'id': connection.target});
                    $scope.connections[type].push({'source': sourceNode, 'target': targetNode});
                });
            });
            drawNetwork();
        });
    var employeeScale = d3.scale.sqrt().domain([10, 130000]).range([10, 50]);
    var twitterScale = d3.scale.sqrt().domain([10, 1000000]).range([10, 50]);

    var drawNetwork = function() {
        var svg = d3.select('#network');
        var bounds = svg.node().getBoundingClientRect();
        var height = bounds.height;
        var width = bounds.width;
        var offsets = {
            'Individual': {'x': 1, 'y': 1},
            'For-Profit': {'x': 1, 'y': -1},
            'Non-Profit': {'x': -1, 'y': 1},
            'Government': {'x': -1, 'y': -1}
        }
        var links = {};
        var force = d3.layout.force()
            .size([height, width])
            .nodes($scope.entities)
            .links(_.flatten(_.values($scope.connections)))
            .charge(function(d) {
                return d.employees ? -6*employeeScale(d.employees) : -25;
            })
            .linkStrength(0)
            .linkDistance(50);

        _.forEach($scope.connections, function(connections, type) {
            links[type] = svg.selectAll('.link .'+type+'-link')
            .data(connections)
            .enter().append('line')
            .attr('class', 'link '+type+'-link');
        });

        var node = svg.selectAll('.node')
            .data($scope.entities)
            .enter().append('g')
            .attr('class', function(d) {return 'node '+d.type+'-node';})
            .call(force.drag);

        node.append('circle')
            .attr('r', function(d) {return d.employees ? employeeScale(d.employees) : 7;});

        node.append('text')
            //.attr('dx', 10)
            .attr('dy', '.35em')
            .text(function(d) {return d.name;});

        force.on('tick', function(e) {
            // Cluster in four corners based on offset.
            var k = 16*e.alpha;
            _.forEach($scope.entities, function(entity) {
                entity.x += offsets[entity.type].x*k
                entity.y += offsets[entity.type].y*k
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
        speedAnimate(7);
        force.start();

        var clickedEntity;
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
            $scope.setEntity(entity);
            $scope.$apply();
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
            //TODO: Show generic details and not individual entity details?
        }

        var hover = function(entity) {
            if (!clickedEntity) {
                focus(entity);
            }
        }

        var unhover = function(entity) {
            if (!clickedEntity) {
                unfocus(entity);
            }
        }

        var click = function(entity) {
            if (clickedEntity == entity) {
                clickedEntity = null;
            } else {
                unfocus(entity);
                clickedEntity = entity;
                focus(entity);
            }
            // Stop event so we don't detect a click on the background.
            // See http://stackoverflow.com/q/22941796
            d3.event.stopPropagation();
        }

        var backgroundclick = function() {
            if (clickedEntity) {
                unfocus(clickedEntity);
                clickedEntity = null;
            }
            //TODO: Show generic details and not individual entity details.
        }
        node.on('mouseover', hover);
        node.on('mouseout', unhover);
        node.on('click', click);
        svg.on('click', backgroundclick);

        // Only show labels on top 5 most connected entities initially.

        _.forEach($scope.entityTypes, function(type) {
            // Find the top 5 most-connected entities.
            var top5 = _.takeRight(_.sortBy(_.filter($scope.entities, {'type': type.name}), 'weight'), 5);
            _.forEach(top5, function(entity) {entity.wellconnected = true;});
        });
        node
        .classed('wellconnected', function(d) {return d.hasOwnProperty('wellconnected');})
    }
})
.controller('mapCtrl', ['$scope', '$timeout', 'leafletData', function($scope, $timeout, leafletData) {
    $scope.markers = [];
    $scope.options = {
        center: {
            lat: 20.00,
            lng: -40.00,
            zoom: 3
        },
        defaults: {
            tileLayerOptions: {
                detectRetina: true,
                reuseTiles: false
            }
        }
    }
    $scope.events = {
        marker: {
            enable: ['click'],
            logic: 'emit'
        }
    }
    $timeout(function () {
        leafletData.getMap().
        then(function(map) {
            map.invalidateSize();
            _.forEach($scope.entities, function(entity) {
                _.forEach(entity.locations, function(loc) {
                    $scope.markers.push({'group': loc.locality, 'lat': loc.coordinates[0], 'lng': loc.coordinates[1], 'message': entity.name, 'entity_id': entity.id});
                });
            });
            $scope.$on('leafletDirectiveMarker.click', function(e, args) {
                $scope.setEntityID(args.model.entity_id);
            });
        });
    });

}]);