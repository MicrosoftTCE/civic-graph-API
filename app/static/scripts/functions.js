var highlightNeighbors = function(d){
  //  Show only the funding links associated with this node.
  fundingLink.transition()
    .duration(350)
    .delay(0).style("opacity", function(l) {
      return (d === l.source || d === l.target) ? 1 : 0.05;
    });

  //  Show only the investment links associated with this node.
  investmentLink.transition()
    .duration(350)
    .delay(0).style("opacity", function(l) {
      return (d === l.source || d === l.target) ? 1 : 0.05;
    });

  //  Show only the collaboration links associated with this node.
  collaborationLink.transition()
    .duration(350)
    .delay(0).style("opacity", function(l) {
      return (d === l.source || d === l.target) ? 1 : 0.05;
    });

  //  Show only the data links associated with this node.
  dataLink.transition()
    .duration(350)
    .delay(0).style("opacity", function(l) {
      return (d === l.source || d === l.target) ? 1 : 0.05;
    });
};

var getNeighborIndices = function(d){
  //  Is the node the target of a link?
  var isLinkTarget = function(link, node) {
    return link.target.index === node.index;
  }

  //  Is the node the source of a link?
  var isLinkSource = function(link, node) {
    return link.source.index === node.index;
  }

  //  Associative array to hold the indices (ID values) of the neighboring nodes.
  //  The value 1 acts as a placeholder for the value of the key-value pair.
  var neighboringNodesIndices = {};
  neighboringNodesIndices[d.ID] = 1;

  fundingConnections.forEach(function(link) {
    if (isLinkSource(link, d)) neighboringNodesIndices[link.target.index] = 1;
    if (isLinkTarget(link, d)) neighboringNodesIndices[link.source.index] = 1;
  });

  investmentConnections.forEach(function(link) {
    if (isLinkSource(link, d)) neighboringNodesIndices[link.target.index] = 1;
    if (isLinkTarget(link, d)) neighboringNodesIndices[link.source.index] = 1;
  });

  collaborationConnections.forEach(function(link) {
    if (isLinkSource(link, d)) neighboringNodesIndices[link.target.index] = 1;
    if (isLinkTarget(link, d)) neighboringNodesIndices[link.source.index] = 1;
  });

  dataConnections.forEach(function(link) {
    if (isLinkSource(link, d)) neighboringNodesIndices[link.target.index] = 1;
    if (isLinkTarget(link, d)) neighboringNodesIndices[link.source.index] = 1;
  });

  return neighboringNodesIndices;
};

var get_url_params = function() {
    // This function is anonymous, is executed immediately and the return value is assigned to QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      // If first entry with this name...
      if (typeof query_string[pair[0]] === "undefined") {
        query_string[pair[0]] = pair[1];
        // If second entry with this name...
      } else if (typeof query_string[pair[0]] === "string") {
        var arr = [query_string[pair[0]], pair[1]];
        query_string[pair[0]] = arr;
        // If third or later entry with this name...
      } else {
        query_string[pair[0]].push(pair[1]);
      }
    }
    return query_string;
};

/*

  Both Connection and Type Checkboxes.

*/

var determineVisibleNodes = function() {
  //  Construct associative array of the visible nodes' indices (keys) and corresponding objects (values).
  var visibleNodes = {};
  for (var x = 0; x < nodeInit[0].length; x++) {
    if (nodeInit[0][x].style.visibility === "visible") {
      visibleNodes[nodeInit[0][x].__data__.ID] = nodeInit[0][x];
    }
  }
  return visibleNodes;
};

var determineHiddenNodes = function() {
  //  Construct associative array of the visible nodes' indices (keys) and corresponding objects (values).
  var hiddenNodes = {};
  for (var x = 0; x < nodeInit[0].length; x++) {
    if (nodeInit[0][x].style.visibility === "hidden") {
      hiddenNodes[nodeInit[0][x].__data__.ID] = nodeInit[0][x];
    }
  }
  return hiddenNodes;
};

/*
  
  Connection Checkboxes...

*/

var connectionsCheckboxActions = function(){
  //  Each group of lines is associated with a specific class.
  var connectionClasses = ['.invest', '.fund', '.porucs', '.data'];

  d3.selectAll('.group-items.connections input')[0].forEach(function(d, i){
    d3.selectAll('#' + d.id).on('click', (function(d, i){
      return function(){
        // d3.selectAll('#cb_fund')[0][0].checked
        var visibleNodes = determineVisibleNodes();
        $('#' + d.id).is(':checked') ? revealConnections(connectionClasses[i], visibleNodes) : hideConnections(connectionClasses[i]); 
        shouldCheckboxRemainUnchecked(connectionClasses[i], visibleNodes);
      };
    })(d, i));
  });
};

// Only reveal the connections with both source and target nodes visible.
var revealConnections = function(selector, visibleNodes){
  // drawFundLink();
  d3.selectAll(selector).style("visibility", function(l) {
    if(l.source.index in visibleNodes && l.target.index in visibleNodes && this.style.visibility === "hidden") {
      return "visible";
    } else
      return "hidden";
  });
};

//  
var hideConnections = function(selector){
  d3.selectAll(selector).style("visibility", function(l) {
    return "hidden";
  });
};  

// If none of the type's nodes are visible, then the connections should also not be visible (no nodes = no connections).
var shouldCheckboxRemainUnchecked = function(selector, visibleNodes){
  if(visibleNodes.length === 0 || ($('#cb_individ').is(':checked') && $('#cb_forpro').is(':checked') && $('#cb_nonpro').is(':checked') && $('#cb_gov').is(':checked'))){
    $(selector).attr('checked', false);
  }
}

/*
  
  Type Checkboxes Checkboxes...

*/

var typesCheckboxActions = function(){
  d3.selectAll('#cb_forpro, #cb_nonpro, #cb_gov, #cb_individ').on('click', function() {
    $('#cb_forpro').is('checked') ? nodeVisibility('For-Profit', 'visible') : nodeVisibility('For-Profit', 'hidden');
    $('#cb_nonpro').is('checked') ? nodeVisibility('Non-Profit', 'visible') : nodeVisibility('Non-Profit', 'hidden');
    $('#cb_gov').is('checked') ? nodeVisibility('Government', 'visible') : nodeVisibility('Government', 'hidden');
    $('#cb_individ').is('checked') ? nodeVisibility('Individual', 'visible') : nodeVisibility('Individual', 'hidden');

    var visibleNodes = determineVisibleNodes();

    toggleLinks(visibleNodes, hiddenNodes);
  });
};

//  Initialize the display accordingly...
var nodeVisibility = function(type, visibility){
  d3.selectAll(".node").filter(function(d) {
    if (d.type === type) return this;
  }).style("visibility", visibility);
};

//  For each rendered node, if the node is a for-profit, then for each connection type, determine if the node is a source or target of the connection, add the connection to the array.
var toggleLinks = function(visibleNodes, hiddenNodes){
  //  Finding links with nodes of a certain type.
  fundingConnections.forEach(function(link){
    setVisibility(link, visibleNodes);
  });
  investmentConnections.forEach(function(link){
    setVisibility(link, visibleNodes);
  });
  collaborationConnections.forEach(function(link){
    setVisibility(link, visibleNodes);
  });
  dataConnections.forEach(function(link){
    setVisibility(link, visibleNodes);
  });

  var setVisibility = function(link, visibleNodes){
    if(link.source.ID in visibleNodes && link.target.ID in visibleNodes) 
      d3.select(link).style('visibility', 'visible');
    else
      d3.select(link).style('visibility', 'hidden');
  };
  
  var connectionClasses = ['.invest', '.fund', '.porucs', '.data'];

  d3.selectAll('.group-items.connections input')[0].forEach(function(d, i){
    var visibleNodes = determineVisibleNodes();
      $('#' + d.id).is(':checked') ? revealConnections(connectionClasses[i], visibleNodes) : hideConnections(connectionClasses[i]); 
      shouldCheckboxRemainUnchecked(connectionClasses[i], visibleNodes);
  });
};











  // investmentConnections.forEach(function(link){
  //   if (d === link.source || d === link.target){
  //     if(link.source in investmentLinksFound && link.target in investmentLinksFound[link.source]) 
  //       continue;
  //     else if(link.source in investmentLinksFound && !(link.target in investmentLinksFound[link.source]))
  //       investmentLinksFound[link.source][link.target] = link;
  //     else
  //       investmentLinksFound[link.source] = {link.target : link};
  //   }
  // });
  // collaborationConnections.forEach(function(link){
  //   if (d === link.source || d === link.target){
  //     if(link.source in collaborationLinksFound && link.target in collaborationLinksFound[link.source]) 
  //       continue;
  //     else if(link.source in collaborationLinksFound && !(link.target in collaborationLinksFound[link.source]))
  //       collaborationLinksFound[link.source][link.target] = link;
  //     else
  //       collaborationLinksFound[link.source] = {link.target : link};
  //   }
  // });
  // dataConnections.forEach(function(link){
  //   if (d === link.source || d === link.target){
  //     if(link.source in dataLinksFound && link.target in dataLinksFound[link.source]) 
  //       continue;
  //     else if(link.source in dataLinksFound && !(link.target in dataLinksFound[link.source]))
  //       dataLinksFound[link.source][link.target] = link;
  //     else
  //       dataLinksFound[link.source] = {link.target : link};
  //   }
  // });