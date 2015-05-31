angular.module('civic-graph', ['ui.bootstrap'])
.constant('_', window._)
.controller('homeCtrl', function($scope, $http) {
    $scope.entities = [];
    $scope.categories = [];
    $scope.currentEntity;
    $scope.editEntity;
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
    $scope.view = 'network';

    $scope.setEntity = function(entity) {
        $scope.currentEntity = entity;
        if ($scope.editing) {
            $scope.stopEdit();
        }
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
    $scope.itemsShownDefault = {
        'key_people': 5,
        'funding_given': 5,
        'funding_received': 5,
        'investments_made': 5,
        'investments_received': 5,
        'collaborations': 5,
        'data_given': 5,
        'data_received': 5,
        'revenues': 5,
        'expenses': 5
    }
    // Reset this when entity changes.
    $scope.itemsShown = _.clone($scope.itemsShownDefault);
    $scope.showMore = function(type) {
        $scope.itemsShown[type] = $scope.currentEntity[type].length;
    }
    $scope.showLess = function(type) {
        $scope.itemsShown[type] = $scope.itemsShownDefault[type];
    }
})
.controller('editCtrl', function($scope, $http) {
    $scope.addressSearch = function(search) {
        return $http.get('https://maps.googleapis.com/maps/api/geocode/json', { params: {'address': search, 'sensor': false} })
            .then(function(locations) { return _.pluck(locations.data.results, 'formatted_address'); })
    }

    $scope.addLocation = function(locations) {
        if (!_.some(locations, {'location':''})) {
            locations.push({'location':''});
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
            $scope.editEntity.key_people.push({'name':'','id': null});
        }

    }
    $scope.addKeyPerson();

    $scope.setFinanceConnection = function(entity, finance, type) {
        // Add other entity's id to this finance connection.
        finance.entity_id = entity.id;
        // Add this finance connection to other entity's finance connections.
        // Watch out for edge cases -- acts on any onSelect. Also, doesn't track changes to year/amount.
        var newFinance = {'entity_id': $scope.editEntity.id, 'entity': $scope.editEntity.name, 'year': finance.year, 'amount': finance.amount, 'id': null};
        entity[type].push(newFinance);
        // Push connection to connections.
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

    $scope.setConnection = function(entity, connection, type) {
        connection.entity_id = entity.id;
        // Add this connection to other entity's connections.
        // Not tracking data details...
        var newConnection = {'entity_id': $scope.editEntity.id, 'entity': $scope.editEntity.name};
        entity[type].push(newConnection);
        // Push connection to connections.
    }

    $scope.addConnection = function(connections) {
        // Add an empty connection to edit if none exist.
        if (!_.some(connections, {'entity':''})) {
            connections.push({'entity':''});
        }
    }
    $scope.addConnection($scope.editEntity.data_given);
    $scope.addConnection($scope.editEntity.data_received);
    $scope.addConnection($scope.editEntity.collaborations);

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
        _.remove($scope.editEntity.locations, function(l){return l.location == '';});
        _.remove($scope.editEntity.key_people, function(p){return p.name == '';});
        _.remove($scope.editEntity.funding_received, function(f){return f.entity == '';});
        _.remove($scope.editEntity.investments_received, function(f){return f.entity == '';});
        _.remove($scope.editEntity.funding_given, function(f){return f.entity == '';});
        _.remove($scope.editEntity.investments_made, function(f){return f.entity == '';});
        _.remove($scope.editEntity.data_given, function(d){return d.entity == '';});
        _.remove($scope.editEntity.data_received, function(d){return d.entity == '';});
        _.remove($scope.editEntity.collaborations, function(c){return c.entity == '';});
        _.remove($scope.editEntity.revenues, function(r){return r.amount <= 0 || r.year < 1750;});
        _.remove($scope.editEntity.expenses, function(e){return e.amount <= 0 || e.year < 1750;;});
    }

    $scope.savetoDB = function() {
        $http.post('save', {'entity': $scope.editEntity})
            .then(function(response) {
                console.log(response);
            });
    }

    $scope.save = function() {
        $scope.removeEmpty();
        $scope.savetoDB();
        // Call to homeCtrl's parent stopEdit() to change view back and any other high-level changes.
        $scope.stopEdit();
    }

});