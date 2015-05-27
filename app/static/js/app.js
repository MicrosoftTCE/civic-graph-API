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

    $scope.influenceTypes = [
        {'name': 'Local Influence', 'value': 'local'},
        {'name': 'National Influence', 'value': 'national'},
        {'name': 'Global Influence', 'value': 'global'}
    ]

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
        'data': 5,
        'revenue': 5,
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
    $scope.editCategories = _.map($scope.categories, function(c) {
        return {'name': c, 'enabled': _.includes($scope.editEntity.categories, c)}
    });

    $scope.addKeyPerson = function() {
        // Add blank field to edit if there are none.
        if (!(_.some($scope.editEntity.key_people, {'name': ''}))) {
            $scope.editEntity.key_people.push({'name':''});
        }
    }
    $scope.addKeyPerson();

    $scope.setFinanceConnection = function(entity, finance, type) {
        // Add other entity's id to this finance connection.
        finance.entity_id = entity.id;
        // Add this finance connection to other entity's finance connections.
        // Watch out for edge cases -- acts on any onSelect. Also, doesn't track changes to year/amount.
        var newFinance = {'id': $scope.editEntity.id, 'entity':$scope.editEntity.name, 'year': finance.year,'amount': finance.amount};
        entity[type].push(newFinance);
    }

    $scope.addFinanceConnection = function(finances) {
        if (!_.some(finances, {'entity':''})) {
            // Maybe set amount to 0 instead of null?
            finances.push({'entity':'', 'amount': null,'year': null});
        }
    }
    $scope.addFinanceConnection($scope.editEntity.funding_received);
    $scope.addFinanceConnection($scope.editEntity.investments_received);
    $scope.addFinanceConnection($scope.editEntity.funding_given);
     $scope.addFinanceConnection($scope.editEntity.investments_made);

    $scope.save = function() {
        $scope.editEntity.categories = _.pluck(_.filter($scope.editCategories, 'enabled'), 'name');
        _.remove($scope.editEntity.key_people, function(p){return p.name=='';});
        _.remove($scope.editEntity.funding_received, function(f){return f.entity=='';});
        _.remove($scope.editEntity.investments_received, function(f){return f.entity=='';});
        _.remove($scope.editEntity.funding_given, function(f){return f.entity=='';});
        _.remove($scope.editEntity.investments_made, function(f){return f.entity=='';});
        // Call to homeCtrl's parent stopEdit() to change view back and any other high-level changes.
        $scope.stopEdit();
    }
});