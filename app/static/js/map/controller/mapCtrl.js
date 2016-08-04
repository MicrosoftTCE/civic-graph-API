(function (angular, d3, L) {
    'use strict';

    var dependencies = [
        '$scope',
        '$timeout',
        'leafletData',
        '_',
        '$filter',
        mapCtrl
    ];

    function mapCtrl($scope, $timeout, leafletData, _, $filter) {

        $scope.options = {
            center  : {
                lat : 20.00,
                lng : -40.00,
                zoom: 3
            },
            defaults: {
                tileLayer         : 'https://api.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGF2aWRscm50IiwiYSI6IjA0M2RkNzMzZWJmNzEzNGYzMTdhYTExYzAyZmU4ZTE1In0.TNYlFta2VItrkn4L0Z9BJQ',
                tileLayerOptions  : {
                    detectRetina: true,
                    reuseTiles  : false
                },
                zoomControl       : false,
                attributionControl: false
            }
        };

        $timeout(function () {
            var createPieChart = function (options) {
                var data   = options.data;
                var pie    = d3.layout.pie().sort(null).value(function (d) {
                    return d.value;
                });
                var arc    = d3.svg.arc().outerRadius(options.r).innerRadius(options.r - 10);
                var center = options.r + options.strokeWidth;
                var w      = center * 2;
                var h      = w;
                var svg    = document.createElementNS(d3.ns.prefix.svg, 'svg');
                var vis    = d3.select(svg)
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
                    .attr('class', function (d) {
                        return d.data.type + '-arc';
                    });

                arcs.append("svg:text")
                    .text(function (d, i) {
                        if (i === 0) {
                            return options.count;
                        }
                    })
                    .attr("x", -4 * options.count.toString().length)
                    .attr("dy", 5)
                    .attr("class", "arcText");

                return window.XMLSerializer ? (new window.XMLSerializer()).serializeToString(svg)
                    : svg.xml ? svg.xml : '';
            };

            leafletData.getMap().then(function (map) {
                var filteredEntities = $filter('filter')($scope.entities,
                    function(entity) {
                        return entity.collaborations.length > 4;
                    }
                );

                map.invalidateSize();
                new L.Control.Zoom({position: 'topright'}).addTo(map);
                L.control.locate(
                    {position: 'topright', showPopup: false, icon: 'fa fa-location-arrow'}
                )
                    .addTo(map);
                function clusterIcon(cluster) {
                    var children       = cluster.getAllChildMarkers();
                    var total          = children.length;
                    var clusterMarkers = _.pluck(children, 'options');
                    var counts         = _.map(_.countBy(clusterMarkers, 'type'),
                                               function (count, type) {
                                                   return {'type': type, 'value': count};
                                               });
                    var r              = 28;
                    var strokeWidth    = 1;
                    var iconDim        = (r + strokeWidth) * 2;
                    var html           = createPieChart(
                        {data: counts, r: r, strokeWidth: strokeWidth, count: total});
                    return new L.DivIcon({
                        html     : html,
                        className: 'marker-cluster',
                        iconSize : new L.point(iconDim, iconDim)
                    });
                }
                var markerIcon  = {
                    'Non-Profit': L.icon({
                                             iconUrl : 'img/marker-nonprof.svg',
                                             iconSize: [60, 60]
                                         }),
                    'For-Profit': L.icon({
                                             iconUrl : 'img/marker-prof.svg',
                                             iconSize: [60, 60]
                                         }),
                    'Individual': L.icon({
                                             iconUrl : 'img/marker-ind.svg',
                                             iconSize: [60, 60]
                                         }),
                    'Government': L.icon({
                                             iconUrl : 'img/marker-gov.svg',
                                             iconSize: [60, 60]
                                         })
                };

                var markers = L.markerClusterGroup({

                    spiderfyOnMaxZoom: true,
                    showCoverageOnHover: false,
                    iconCreateFunction: clusterIcon,
                    maxClusterRadius: 30,
                    spiderfyDistanceMultiplier: 1.3
                });


                function outerLoop(entity) {
                    function innerLoop(loc) {
                        if (!_.every(loc.coordinates)) return;
                        if (loc.coordinates[0].toFixed(5) === '40.78200' && loc.coordinates[1].toFixed(5) === '-73.83170') {
                            loc.coordinates[0] = 40.77065;
                            loc.coordinates[1] = -73.97406;
                        }
                        var m = L.marker(loc.coordinates, {
                            icon: markerIcon[entity.type],
                            'title': entity.name,
                            'entity_id': entity.id,
                            'message': entity.name,
                            'type': entity.type
                        });
                        markers.addLayer(m);
                    }

                    _.forEach(entity.locations, innerLoop);
                }

                console.log("Original: %O", $scope.entities);
                console.log("Filtered: %O", filteredEntities);

                _.forEach(filteredEntities, outerLoop);
                map.addLayer(markers);

                function onLocationError(leafletError) {
                    console.error(leafletError.message + "  %O", leafletError);
                }

                map.on('locationerror', onLocationError);
                // map.locate({setView: true, maxZoom: 11});
                markers.on('click', function (marker) {
                    $scope.setEntityID(marker.layer.options.entity_id);
                    $scope.clickedEntity.entity = $scope.currentEntity;
                    $scope.actions.interacted   = true;
                    if ($scope.settingsEnabled && $scope.mobile) {
                        $scope.toggleSettings();
                    }
                    $scope.safeApply();
                });

                map.on('click', function () {
                    $scope.clickedEntity.entity = null;
                    $scope.actions.interacted   = true;
                    $scope.safeApply();
                });
                $scope.$on('selectItem', function () {
                    var coordinates = $scope.currentEntity.locations.length > 0 ? _.pluck(
                        $scope.currentEntity.locations, 'coordinates') : null;
                    if (coordinates.length > 0) {
                        map.setView(coordinates[0], 11);
                    }
                    $scope.actions.interacted = true;
                    $scope.safeApply();
                });
            });
        });
    }

    angular.module('civic-graph')

        .controller('mapCtrl', dependencies);
})(angular, d3, L);
