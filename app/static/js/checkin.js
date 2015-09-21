angular.module('civic-checkin', ['ui.bootstrap'])
.controller('homeCtrl', function($scope, $http) {
	$scope.entities = entities.nodes;
	$scope.newEntity = {id:null};
    $scope.addressSearch = function(search) {
        return $http.jsonp('http://dev.virtualearth.net/REST/v1/Locations', {params: {query: search, key: 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD', 'jsonp': 'JSON_CALLBACK', 'incl': 'ciso2'}})
            .then(function(response) {
                return response.data.resourceSets[0].resources
            });
    }
    $scope.employerFound = false;
    $scope.submit = function(){
    if (!$scope.employerFound) { 
    	$scope.test(); 
        return false;
	}
    else {
 	$("html, body").animate({ scrollTop: $(window).height()}, 600);
    return false;
    }
    };
    $scope.pass = function(){
    	var pass = document.getElementById("pass").value.toLowerCase();
    		if(pass === "civic") {
    			var elem = document.getElementById("block");
				elem.parentNode.removeChild(elem);
    		} else {
    			alert("WRONG PASSWORD")
    			document.getElementById("pass").value = "";
    		}
    };
    $scope.add = function(){
        console.log($scope.newEntity)
        $scope.savetoDB();

     $("html, body").animate({ scrollTop: $(window).height()*2}, 600);
	function refresh() {
		$scope.newEntity = {};
		document.getElementById("nEntityForm").reset();
	$("html, body").animate({ scrollTop: 0}, 1000);
	};
     setTimeout(refresh, 3000);
    };

    $scope.savetoDB = function() {
        $http.post('api/save', {'entity': $scope.newEntity})
            .success(function(response) {
                console.log("success")
                console.log(response)
                // $scope.setEntities(response.nodes);
                // $scope.setEntityID($scope.editEntity.id);
                // $scope.broadcast('entitiesLoaded')
                // Call to homeCtrl's parent stopEdit() to change view back and any other high-level changes.
                // $scope.updating = false;
            })
            .error(function(data, status, headers, config){
                console.log('ERROR');
                console.log(data);
                console.log(status);
                console.log(headers);
                console.log(config);
                $scope.error = true;
            });
    }

    $scope.isValid = function(){
    	var valid = false;
    	// if ($scope.newEntity.name && $scope.newEntity.location && $scope.newEntity.type){
    	if ($scope.newEntity.name){
    		valid = true;
    	}
    	return valid
    };
    $scope.onSelect = function ($item, $model, $label) {
    	console.log($item);
    	if ($item.employments.length >= 1) {
    	var employment = $item.employments[0].entity;
    	$scope.newEntity.employer = employment;
    	$scope.employerFound = true;
    		if ($item.locations) {
    			var location = $item.locations[0].full_address;
    			$scope.newEntity.location = location;
    		};
    	};
	    // $scope.$model = $model;
	    // $scope.$label = $label;
	};
	$scope.onSelectEmployer = function ($item, $model, $label) {
		$scope.employerFound = true;
	};
	$scope.test = function(){
		if (!$scope.employerFound){
			var template = document.querySelector('#template');
			var clone = document.importNode(template.content, true);
			var host = document.querySelector('#employerEntity');
			host.appendChild(clone);
			$scope.employerFound = true;
		}
	};
})