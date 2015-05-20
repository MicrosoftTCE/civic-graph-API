//  Singleton Design Pattern
function(){
  var graph = function() {
    var svg = d3.select('svg');

    //  Flags to indicate status.
    var centerFlag = false;
    var resetFlag = false;

    //  Data assoicated with connections.
    var fundingConnections;
    var investmentConnections;
    var collaborationConnections;
    var dataConnections;

    //  Data associated with nodes;
    var filteredNodes;

    //  Dimensions for svg canvas.
    var width = 1000;
    var height = 1000;

    //  Colors for types of entities.
    var forProfitRGB = "rgb(127,186,0)";
    var nonProfitRGB = "rgb(0,164,239)";
    var individualsRGB = "rgb(255,185,0)";
    var governmentRGB = "rgb(242,80,34)";

    //  Colors for types of connections.
    var fundingRGB = "rgb(111,93,168)";
    var investmentRGB = "rgb(38,114,114)";
    var collaborationRGB = "rgb(235,232,38)";
    var dataRGB = "rgb(191,72,150)";

    return {
      applyForce : function() {

      },
      mostConnected : function() {
        return {
          fiveMostConnectedForProfit: function() {
            this.forProfit = 
          },
          fiveMostConnectedIndividuals: function() {
            this.nonProfit = 
          }, 
          fiveMostConnectedIndividuals: function() {
            this.individuals = 
          },
          fiveMostConnectedGovernment: function() {
            this.government = 
          }
        };
      }, 
      hoverNode : function(d) {
        $.ajax({
            type: 'POST',
            data: $.param(d),
            url: '//',
            crossDomain: true
          }).done(function(returnData) {
            console.log(d);
          });
      },
      singleClickNode : function() {

      },
      doubleClickNode : function() {

      },
      displayFormA : function() {

      },
      prefillFormA : function() {

      },
      displayFormB : function() {

      },
      prefillFormB : function() {

      },
      resetGraph : function() {

      }
    };
  }();
}();
