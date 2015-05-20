// (function() {

  function get_url_params() {
    // This function is anonymous, is executed immediately and 
    // the return value is assigned to QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      // If first entry with this name
      if (typeof query_string[pair[0]] === "undefined") {
        query_string[pair[0]] = pair[1];
        // If second entry with this name
      } else if (typeof query_string[pair[0]] === "string") {
        var arr = [query_string[pair[0]], pair[1]];
        query_string[pair[0]] = arr;
        // If third or later entry with this name
      } else {
        query_string[pair[0]].push(pair[1]);
      }
    }
    return query_string;
  }

  var current_view = get_url_params()['view'];

  d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
      this.parentNode.appendChild(this);
    });
  };

  d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
      var firstChild = this.parentNode.firstChild;
      if (firstChild) {
        this.parentNode.insertBefore(this, firstChild);
      }
    });
  };


  function drawGraph() {
      function wrap(text, width) {
        text.each(function() {
          var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            dy = parseFloat(text.attr("dy")),
            data = d3.select(this)[0][0].__data__,
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", function() {
              if (data.employees !== null)
                return empScale(data.employees) + 10;
              else
                return 7 + 10;
            }).attr("dy", dy + "em");

          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              lineNumber++;
              tspan = text.append("tspan").attr("x", 0).attr("y", function() {
                if (data.employees !== null)
                  return empScale(data.employees) + 5;
                else
                  return 7 + 5;
              }).attr("dy", lineNumber * lineHeight + dy + "em").text(word);
            }
          }
        });
      }

      function transformText(d) {
        return "translate(" + d.x + "," + d.y + ")";
      }

      function translation(x, y) {
        return 'translate(' + x + ',' + y + ')';
      }

      function numCommas(numberStr) {
        numberStr += '';
        x = numberStr.split('.');
        x1 = x[0];
        x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;

        while (rgx.test(x1)) {
          x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }

        return x1 + x2;
      }

      function getSVG(svg) {
        return svg;
      }

      var width = 1000;
      var height = 1000;

      var filteredNodes,
        forProfitNodes,
        nonProfitNodes,
        individualNodes,
        governmentNodes;

      var fiveMostConnectedForProfit = {},
        fiveMostConnectedNonProfit = {},
        fiveMostConnectedIndividuals = {},
        fiveMostConnectedGovernment = {};

      var clearResetFlag = 1;

      var collaborationConnections;
      var dataConnections;
      var fundingConnections;
      var investmentConnections;

      var centeredNode = {};

      var entitiesHash = {}; //lowercase
      var locationsHash = {}; //Lowercase

      var sortedNamesList = []; // Presentation
      var sortedLocationsList = []; // Presentation
      var sortedSearchList = []; // Presentation

      var dataListSortedNames;
      var dataListSortedLocations;

      // var svg = d3.select(".content").append("svg").attr("id", "network").attr("height", height).attr("width", width).attr("viewBox", "0 0 800 800").attr("preserveAspectRatio", "xMidYMid");
      //.attr("viewBox", '0 0 800 800')
      var svg = d3.select('.content')
        .append('svg').attr("xmlns", 'http://www.w3.org/2000/svg')
        .attr("id", 'network').attr("height", height)
        .attr("width", width).style("top", "-50px")
        .style("position", "relative");
      // d3.select("svg").on("dblclick.zoom", null);
      d3.select('body > nav > nav > div').append('div').attr('id', 'editBox').append('p').text('Edit').style('color', '#2e92cf');



      //  document.createElement('svg')

      var aspect = width / height,
        network = $('#network'),
        container = network.parent();
      $(window).on('resize', function() {
        var targetWidth = container.width();
        network.attr("width", targetWidth);
        network.attr("height", Math.round(targetWidth / aspect));
      }).trigger("resize");

      var viewBoxParameters = '0 0 ' + width + ' ' + height;

      svg.attr("viewBox", viewBoxParameters).attr("preserveAspectRatio", 'xMidYMid');

      //  Static Scale
      //  Improve by dynamically obtaining min and max values
      var empScale = d3.scale.sqrt().domain([10, 130000]).range([10, 50]);
      var twitScale = d3.scale.sqrt().domain([10, 1000000]).range([10, 50]);


      d3.json("/athena", function(error, graph) {
        // d3.select("svg").append("rect")
        //                 .attr("x", 10)
        //                 .attr("y", 10)
        //                 .attr("width", width / 2 - 10 - 20)
        //                 .attr("height", height / 2 - 60 - 20)
        //                 .style("fill", "rgb(242,80,34)")
        //                 .style("opacity", 0.9)
        //                 .style('pointer-events', 'none');

        // d3.select("svg").append("rect")
        //                 .attr("x", width / 2 - 10 + 10)
        //                 .attr("y", 10)
        //                 .attr("width", width / 2 - 10 - 20)
        //                 .attr("height", height / 2 - 60 - 20)
        //                 .style("fill", "rgb(127,186,0")
        //                 .style("opacity", 0.9)
        //                 .style('pointer-events', 'none');

        // d3.select("svg").append("rect")
        //                 .attr("x", 10)
        //                 .attr("y", height / 2 - 60 + 10)
        //                 .attr("width", width / 2 - 10 - 20)
        //                 .attr("height", height / 2 - 60 - 20)
        //                 .style("fill", "rgb(0,164,239)")
        //                 .style("opacity", 0.9)
        //                 .style('pointer-events', 'none');

        // d3.select("svg").append("rect")
        //                 .attr("x", width / 2 - 10 + 10)
        //                 .attr("y", height / 2 - 60 + 10)
        //                 .attr("width", width / 2 - 10 - 20)
        //                 .attr("height", height / 2 - 60 - 20)
        //                 .style("fill", "rgb(255,185,0)")
        //                 .style("opacity", 0.9)
        //                 .style('pointer-events', 'none');

        var rawNodes = graph.nodes;
        var rawFundingConnections = graph.funding_connections;
        var rawInvestmentConnections = graph.investment_connections;
        var rawCollaborationConnections = graph.collaboration_connections;
        var rawDataConnections = graph.data_connections;
        var rawConnections = rawFundingConnections
          .concat(rawInvestmentConnections)
          .concat(rawCollaborationConnections)
          .concat(rawDataConnections);

        filteredNodes = (rawNodes).filter(function(d) {
          return d.render === 1;
        });
        fundingConnections = (rawFundingConnections).filter(function(d) {
          return d.render === 1;
        });
        investmentConnections = (rawInvestmentConnections).filter(function(d) {
          return d.render === 1;
        });
        collaborationConnections = (rawCollaborationConnections).filter(function(d) {
          return d.render === 1;
        });
        dataConnections = (rawDataConnections).filter(function(d) {
          return d.render === 1;
        });

        var connectionLinks = fundingConnections
          .concat(investmentConnections)
          .concat(collaborationConnections)
          .concat(dataConnections);


        var force = d3.layout.force()
          .nodes(rawNodes)
          .size([width, height])
          .links(rawConnections)
          .linkStrength(0)
          .charge(function(d) {
            // if (d.employees !== null)
            //   return -6 * empScale(d.employees);
            // else
            //   return -40;
            if (d.render === 1) {
              if (d.employees !== null)
                return -6 * empScale(d.employees);
              else
                return -25;
            } else
              return 0;
          })
          .linkDistance(50)


        var drag = force.drag()
          .on("dragstart", drag)
          .on("drag", drag)
          .on("dragend", dragend);

        //  FUNDINGS
        var fundLink = svg.selectAll(".fund")
          .data(fundingConnections)
          .enter().append("line")
          .attr("class", "fund")
          // .classed("visfund", true)
          .style("stroke", "rgb(111,93,168)")
          .style("stroke-width", "1")
          .style("opacity", "0.2")
          .style("visibility", "visible");

        //  INVESTMENTS
        var investLink = svg.selectAll(".invest")
          .data(investmentConnections)
          .enter().append("line")
          .attr("class", "invest")
          // .classed("visinvest", true)
          .style("stroke", "rgb(38,114,114)")
          .style("stroke-width", "1")
          .style("opacity", "0.2")
          .style("visibility", "visible");

        //  COLLABORATIONS
        var porucsLink = svg.selectAll(".porucs")
          .data(collaborationConnections)
          .enter().append("line")
          .attr("class", "porucs")
          // .classed("visporucs", true)
          .style("stroke", "rgb(235,232,38)")
          .style("stroke-width", "1")
          .style("opacity", "0.2")
          .style("visibility", "visible");

        //  data
        var dataLink = svg.selectAll(".data")
          .data(dataConnections)
          .enter().append("line")
          .attr("class", "data")
          // .classed("visdata", true)
          .style("stroke", "rgb(191,72,150)")
          .style("stroke-width", "1")
          .style("opacity", "0.2")
          .style("visibility", "visible");

        var nodeInit = svg.selectAll(".node")
          .data(filteredNodes)
          .enter()
          .append("g")
          .attr("class", "node")
          .style("visibility", "visible")
          .on('dblclick', dblclick)
          .call(drag);

        force.on("tick", tick)
          .start();
        // data section
        // combine collaboration and data

        forProfitNodes = svg.selectAll('.node').filter(function(d) {
          return d.type === "For-Profit";
        }).sort(function(a, b) {
          return a.weight - b.weight;
        });
        nonProfitNodes = svg.selectAll('.node').filter(function(d) {
          return d.type === "Non-Profit";
        }).sort(function(a, b) {
          return a.weight - b.weight;
        });
        individualNodes = svg.selectAll('.node').filter(function(d) {
          return d.type === "Individual";
        }).sort(function(a, b) {
          return a.weight - b.weight;
        });
        governmentNodes = svg.selectAll('.node').filter(function(d) {
          return d.type === "Government";
        }).sort(function(a, b) {
          return a.weight - b.weight;
        });

        //  Select the nodes to choose for highlighting nickname on visualization (TOP 5) 
        forProfitNodes.each(function(d, i) {
          if (i >= forProfitNodes[0].length - 5) fiveMostConnectedForProfit[d.name] = d.weight;
        });
        nonProfitNodes.each(function(d, i) {
          if (i >= nonProfitNodes[0].length - 5) fiveMostConnectedNonProfit[d.name] = d.weight;
        });
        individualNodes.each(function(d, i) {
          if (i >= individualNodes[0].length - 5) fiveMostConnectedIndividuals[d.name] = d.weight;
        });
        governmentNodes.each(function(d, i) {
          if (i >= governmentNodes[0].length - 5) fiveMostConnectedGovernment[d.name] = d.weight;
        });


        var textElement = svg.selectAll('.node')
          .append('text')
          .text(function(d) {
            return d.nickname;
          })
          .attr("x", 0)
          .attr("dy", "0.1em")
          .attr("y", function(d) {
            if (d.employees !== null)
              return empScale(d.employees) + 10;
            else
              return 7 + 10;
          }).style('opacity', function(d) {
            var textOpacity;
            if (d.type === "For-Profit")
              textOpacity = (fiveMostConnectedForProfit.hasOwnProperty(d.name)) ? 1 : 0;
            if (d.type === "Non-Profit")
              textOpacity = (fiveMostConnectedNonProfit.hasOwnProperty(d.name)) ? 1 : 0;
            if (d.type === "Individual")
              textOpacity = (fiveMostConnectedIndividuals.hasOwnProperty(d.name)) ? 1 : 0;
            if (d.type === "Government")
              textOpacity = (fiveMostConnectedGovernment.hasOwnProperty(d.name)) ? 1 : 0;
            return textOpacity;
          }).style('font-size', '14px')
          .style('color', '#FFFFFF')
          .style('pointer-events', 'none');

        var node = nodeInit.append("circle")
          .attr("r", function(d) {
            if (d.employees !== null)
              return empScale(d.employees);
            else
              return "7";
          })
          .style("fill", function(d) {
            if (d.type !== null) {
              if (d.type === "Individual")
                return "rgb(255,185,0)";
              if (d.type === "Non-Profit")
                return "rgb(0,164,239)";
              if (d.type === "For-Profit")
                return "rgb(127,186,0)";
              if (d.type === "Government")
                return "rgb(242,80,34)";
            }
          })
          .attr("cx", function(d) {
            return d.x;
          })
          .attr("cy", function(d) {
            return d.y;
          })
          .style("stroke-width", '1.5px')
          .style("stroke", 'white')
          .on('mouseover', handleNodeHover)
          .on('mouseout', offNode)
          .on('click', sinclick);

        textElement.call(wrap, 80);

        while (force.alpha() > 0.025) {
          force.tick();
        }
        

        // Must adjust the force parameters...

        function dblclick(d) {

          d3.select(this).classed("fixed", function(d) {
            d.fixed = false;
          });
          d3.select(this).on('mousedown.drag', null);

          var dblclickobject = (d3.select(this).data())[0];

          var svgWidth = parseInt(svg.style("width").substring(0, ((svg.style("width")).length + 1) / 2));
          var svgHeight = parseInt(svg.style("height").substring(0, ((svg.style("height")).length + 1) / 2));
          var halfSVGWidth = parseInt(svgWidth / 2);
          var halfSVGHeight = parseInt(svgHeight / 2);

          multiplierX = svgWidth / width;
          multiplierY = svgHeight / height;

          scaledDX = multiplierX * d.x;
          scaledDY = multiplierY * d.y;

          centeredNode = jQuery.extend(true, {}, d);

          // Half viewbox...
          centeredNode.x = width / 2 - 10;
          centeredNode.y = height / 2 - 60;

          var force = d3.layout.force()
            .nodes(rawNodes)
            .size([width, height])
            .links(rawConnections)
            .linkStrength(0)
            .charge(function(d) {
              // if (d.employees !== null)
              //   return -5 * empScale(parseInt(d.employees));
              // else
              //   return -50;
              if (d.render === 1) {
                if (d.employees !== null)
                  return -6 * empScale(d.employees);
                else
                  return -25;
              } else
                return 0;
            })
            .linkDistance(50)

          .on("tick", tick)
            .start();

          for (var i = 0; i < 150; ++i) {
            force.tick();
          }
          
          // for (var i = 0; i < 1; ++i) {
          //                    force.tick();
          //                }
          //                
        }


        function handleClickNodeHover(d) {
          s = textDisplay(d);

          webform = editDisplay(d);

          // For editing the data displayed within the side panel.
          d3.select('#edit')
            .html(webform);

          //  Printing to side panel within web application.
          d3.select('#info')
            .html(s)
            .style('list-style', 'square');


          d3.selectAll('#editCurrentInfo').on('click', function() {
              prefillCurrent(d);
            })
            .on('mouseover', function() {
              d3.select(this).style('cursor', 'pointer');
              return d3.select('#editBox').style("visibility", "visible");
            })
            .on('mousemove', function() {
              return d3.select('#editBox').style("top", (d3.event.pageY + 4) + "px").style("left", (d3.event.pageX + 16) + "px");
            })
            .on('mouseout', function() {
              return d3.select('#editBox').style("visibility", "hidden");
            });

        }

        function prefillCurrent(d) {
          editForm();
          preFillFormA(d);
        }

        function editDisplay(d) {
          var webform = "";

          webform += '<h1 id="edit-add-info">' + '<i class="icon-plus on-left"></i>' + 'Add Information' + '</h1>';

          return webform;
        }

        function textDisplay(d) {
          var s = "";

          //  General Information
          s += '<div style="height:30px"><a style="float:right;"><i id="editCurrentInfo" class="icon-pencil on-left"></i></a></div>';
          s += '<h1>' + "<a href=" + '"' + d.url + '" target="_blank">' + d.name + '</a></h1>';
          s += '<h6>' + 'Type of Entity: ' + '</h6>' + ' <h5>' + d.type + '</h5>';

          if (d.location !== null) {
            s += '<br/>' + '<h6> ' + 'Location:  ' + '</h6>';
            var locationArr = [];

            if ((d.location).indexOf("; ") !== -1) {
              s += '<br/> <h5><ul>';
              locationArr = (d.location).split("; ");
              for (var count = 0; count < locationArr.length; count++) {
                s += '<li style="display:block;">' + '<h5><a class="click-location" style="cursor:pointer;">' + locationArr[count] + '</h5></a>' + '</li>';
              }
            } else {
              s += '<h5><ul>'
              s += '<li style="display:inline-block;">' + '<h5><a class="click-location" style="cursor:pointer;">' + d.location + '</h5></a>' + '</li>';
            }
            s += '</h5></ul><br/>';

          } else {
            s += '<br/>' + '<h6> ' + 'Location:  ' + '</h6>' + ' <h5>' + 'N/A' + '</h5>' + '<br/>';
          }

          if (d.type !== 'Individual') {
            if (d.employees !== null) {
              s += '<h6>' + 'Employees: ' + '</h6> <h5>' + numCommas(d.employees.toString()) + '</h5><br/>';
            } else {
              s += '<h6>' + 'Employees: ' + '</h6> <h5>' + 'N/A' + '</h5><br/>';
            }
          }

          if (d.twitter_handle === null) {
            s += '<h6>' + 'Twitter:  ' + '</h6> <h5>' + 'N/A' + '</h5><br/>';
            s += '<h6>' + 'Twitter Followers: ' + '</h6> <h5>' + 'N/A' + '</h5><br/>';
          } else {
            var twitterLink = (d.twitter_handle).replace('@', '');


            twitterLink = 'https://twitter.com/' + twitterLink;
            s += '<h6>' + 'Twitter:  ' + '</h6> <h5>' + "<a href=" + '"' + twitterLink + '" target="_blank">' + d.twitter_handle + '</h5></a><br/>';
            if (d.followers !== null) {
              s += '<h6>' + 'Twitter Followers:  ' + '</h6> <h5>' + numCommas(d.followers.toString()) + '</h5><br/>';
            } else {
              s += '<h6>' + 'Twitter Followers:  ' + '</h6> <h5>' + 'N/A' + '</h5><br/>';
            }
          }

          //  KEY PEOPLE
          console.log(d.key_people)
          if (d.key_people !== null) {
            s += '<br/><h6>' + 'Key People:' + '</h6>' + '<ul><h5>';
            for (var count = 0; count < d.key_people.length; count++) {
              s += '<li>' + '<a href="http://www.bing.com/search?q=' + (d.key_people[count].name).replace(" ", "%20") + '%20' + (d.nickname).replace(" ", "%20") + '&go=Submit&qs=bs&form=QBRE" target="_blank">' + d.key_people[count].name + '</a>' + '</li>';
            }
            s += '</h5></ul>';
          }

          // //  FUNDING

          if (d.funding_received === null) {
            s += '<br/><h6>' + 'No known funding received.' + '</h6><br/>';
          } else {
            s += '<br/>' + '<h6>' + 'Received funding from:' + '</h6><ul>';
            (d.funding_received).forEach(function(d) {
              if (d.amount === 0 || d.amount === null) {
                s += '<li><h5>' + '<a href="http://www.bing.com/search?q=' + (d.entity).replace(" ", "%20") + '&go=Submit&qs=bs&form=QBRE" target="_blank">' + d.entity + '</a></h5>' + ': <strong style="color:rgb(255,185,0);">unknown</strong>' + '</li>';
              } else {
                s += '<li><h5>' + '<a href="http://www.bing.com/search?q=' + (d.entity).replace(" ", "%20") + '&go=Submit&qs=bs&form=QBRE" target="_blank">' + d.entity + '</a></h5>' + ': <strong style="color:rgb(127,186,0);">$' + numCommas(d.amount.toString()) + '</strong>' + '</li>';
              }
              if (d.year === null) {

              } else {

              }
            });
            s += '</ul>'
          }

          if (d.funding_given === null) {
            s += '<br/><h6>' + 'No known funding provided.' + '</h6><br/>';
          } else {
            s += '<br/>' + '<h6>' + 'Gave funding to:' + '</h6><ul>';
            (d.funding_given).forEach(function(d) {
              if (d.amount === 0 || d.amount === null) {
                s += '<li><h5>' + '<a href="http://www.bing.com/search?q=' + (d.entity).replace(" ", "%20") + '&go=Submit&qs=bs&form=QBRE" target="_blank">' + d.entity + '</a></h5>' + ': <strong style="color:rgb(255,185,0);">unknown</strong>' + '</li>';
              } else {
                s += '<li><h5>' + '<a href="http://www.bing.com/search?q=' + (d.entity).replace(" ", "%20") + '&go=Submit&qs=bs&form=QBRE" target="_blank">' + d.entity + '</a></h5>' + ': <strong style="color:rgb(127,186,0);">$' + numCommas(d.amount.toString()) + '</strong>' + '</li>';
              }
              if (d.year === null) {

              } else {

              }
            });
            s += '</ul>'
          }

          if (d.investments_received === null) {
            s += '<br/><h6>' + 'No known investments received.' + '</h6><br/>';
          } else {
            s += '<br/>' + '<h6>' + 'Received investments from:' + '</h6><ul>';
            (d.investments_received).forEach(function(d) {
              if (d.amount === 0 || d.amount === null) {
                s += '<li><h5>' + '<a href="http://www.bing.com/search?q=' + (d.entity).replace(" ", "%20") + '&go=Submit&qs=bs&form=QBRE" target="_blank">' + d.entity + '</a></h5>' + ': <strong style="color:rgb(255,185,0);">unknown</strong>' + '</li>';
              } else {
                s += '<li><h5>' + '<a href="http://www.bing.com/search?q=' + (d.entity).replace(" ", "%20") + '&go=Submit&qs=bs&form=QBRE" target="_blank">' + d.entity + '</a></h5>' + ': <strong style="color:rgb(127,186,0);">$' + numCommas(d.amount.toString()) + '</strong>' + '</li>';
              }
              if (d.year === null) {

              } else {

              }
            });
            s += '</ul>'
          }

          if (d.investments_made === null) {
            s += '<br/><h6>' + 'No known investments made.' + '</h6><br/>';
          } else {
            s += '<br/>' + '<h6>' + 'Invested in:' + '</h6><ul>';
            (d.investments_made).forEach(function(d) {
              if (d.amount === 0 || d.amount === null) {
                s += '<li><h5>' + '<a href="http://www.bing.com/search?q=' + (d.entity).replace(" ", "%20") + '&go=Submit&qs=bs&form=QBRE" target="_blank">' + d.entity + '</a></h5>' + ': <strong style="color:rgb(255,185,0);">unknown</strong>' + '</li>';
              } else {
                s += '<li><h5>' + '<a href="http://www.bing.com/search?q=' + (d.entity).replace(" ", "%20") + '&go=Submit&qs=bs&form=QBRE" target="_blank">' + d.entity + '</a></h5>' + ': <strong style="color:rgb(127,186,0);">$' + numCommas(d.amount.toString()) + '</strong>' + '</li>';
              }
              if (d.year === null) {

              } else {

              }
            });
            s += '</ul>'
          }

          if (d.collaborations === null) {
            s += '<br/><h6>' + 'No known collaborations.' + '</h6><br/>';
          } else {
            s += '<br/>' + '<h6>' + 'Collaborated with:' + '</h6><ul>';
            (d.collaborations).forEach(function(d) {

              s += '<li><h5>' + '<a href="http://www.bing.com/search?q=' + (d.entity).replace(" ", "%20") + '&go=Submit&qs=bs&form=QBRE" target="_blank">' + d.entity + '</a></h5>' + '</li>';

            });
            s += '</ul>'
          }

          if (d.data === null) {
            s += '<br/><h6>' + 'No known external data usage.' + '</h6><br/>';
          } else {
            s += '<br/>' + '<h6>' + 'Obtained data from:' + '</h6><ul>';
            (d.data).forEach(function(d) {

              s += '<li><h5>' + '<a href="http://www.bing.com/search?q=' + (d.entity).replace(" ", "%20") + '&go=Submit&qs=bs&form=QBRE" target="_blank">' + d.entity + '</a></h5>' + '</li>';

            });
            s += '</ul>'
          }


          if (d.revenue === null) {
            s += '<br/><h6>' + 'No known revenue information.' + '</h6><br/>';
          } else {
            s += '<br/>' + '<h6>' + 'Revenue:' + '</h6><ul>';
            (d.revenue).forEach(function(d) {
              if (d.amount === 0 || d.amount === null) {
                if (d.year === null) {
                  s += '<li><h5>' + 'Unknown Year' + '</h5>' + ': <strong style="color:rgb(255,185,0);">unknown</strong>' + '</li>';
                } else {
                  s += '<li><h5>' + d.year + '</h5>' + ': <strong style="color:rgb(255,185,0);">unknown</strong>' + '</li>';
                }
              } else {
                if (d.year === null) {
                  s += '<li><h5>' + 'Unknown Year' + '</h5>' + ': <strong style="color:rgb(127,186,0);">$' + numCommas(d.amount.toString()) + '</strong>' + '</li>';
                } else {
                  s += '<li><h5>' + d.year + '</h5>' + ': <strong style="color:rgb(127,186,0);">$' + numCommas(d.amount.toString()) + '</strong>' + '</li>';
                }
              }
            });
            s += '</ul>'
          }

          if (d.expenses === null) {
            s += '<br/><h6>' + 'No known expenses information.' + '</h6><br/>';
          } else {
            s += '<br/>' + '<h6>' + 'Expenses:' + '</h6><ul>';
            (d.expenses).forEach(function(d) {
              if (d.amount === 0 || d.amount === null) {
                if (d.year === null) {
                  s += '<li><h5>' + 'Unknown Year' + '</h5>' + ': <strong style="color:rgb(255,185,0);">unknown</strong>' + '</li>';
                } else {
                  s += '<li><h5>' + d.year + '</h5>' + ': <strong style="color:rgb(255,185,0);">unknown</strong>' + '</li>';
                }
              } else {
                if (d.year === null) {
                  s += '<li><h5>' + 'Unknown Year' + '</h5>' + ': <strong style="color:rgb(127,186,0);">$' + numCommas(d.amount.toString()) + '</strong>' + '</li>';
                } else {
                  s += '<li><h5>' + d.year + '</h5>' + ': <strong style="color:rgb(127,186,0);">$' + numCommas(d.amount.toString()) + '</strong>' + '</li>';
                }
              }
            });
            s += '</ul>'
          }

          displayFormA(d);

          return s;
        }



        // Form A has the required items + basic items
        // Also, the user has the options of going directly to form B or C
        // Form B - click submit button
        // Form C - click on hyperlink below the submission button
        d3.selectAll('#edit').on('click', editForm);

        function editForm() {
          d3.select('#edit-add-info').html('<i class=" icon-file on-left"></i>' + 'Reset Form').on('click', editForm);

          node
            .on('mouseover', null);

          sa = displayFormA();

          // Render the string into HTML
          d3.select('#info')
            .html(sa);

          d3.select('datalist#list-name').html(dataListSortedNames);
          d3.select('input#name').on('keyup', function() {
            preParseForm(this.value);
          });

          d3.select('datalist#list-location').html(dataListSortedLocations);
          d3.select('input#location').on('keyup', function() {
            preFillLocation(this.value);
          });

          d3.select('#key-people-0 input[name="kpeople"]').on('keyup', function() {
            add_input_kp(0);
          });

          addDataList('#funding-0 datalist');
          d3.select('#funding-0 input[name="fund"]').on('keyup', function() {
            add_input_fund(0);
            preFillName(this.value, '#funding-0 input');
          });

          addDataList('#investing-0 datalist');
          d3.select('#investing-0 input[name="invest"]').on('keyup', function() {
            add_input_invest(0);
            preFillName(this.value, '#investing-0 input');
          });

          addDataList('#fundinggiven-0 datalist');
          d3.select('#fundinggiven-0 input[name="fundgiven"]').on('keyup', function() {
            add_input_fund_given(0);
            preFillName(this.value, '#fundinggiven-0 input');
          });

          addDataList('#investmentmade-0 datalist');
          d3.select('#investmentmade-0 input[name="investmade"]').on('keyup', function() {
            add_input_invest_made(0);
            preFillName(this.value, '#investmentmade-0 input');
          });

          addDataList('#data-0 datalist');
          d3.select('#data-0 input[name="data"]').on('keyup', function() {
            add_input_data(0);
            preFillName(this.value, '#data-0 input');
          });

          d3.select("#toFormC").on('click', function() {
            displayFormC();
          });

          d3.selectAll('#submit-A').on('click', function() {
            d3.select('#name').style("border-color", "#d9d9d9");
            d3.select('#location').style("border-color", "#d9d9d9");
            displayFormB();
            // if(!_.isEmpty(sb))

          });
        }

        function processFormA() {

          var formObject = {
            type: null,
            categories: null,
            name: null,
            nickname: null,
            location: null,
            url: null,
            employees: null,
            key_people: null,
            twitter_handle: null,
            followers: null,
            relations: null,
            funding_received: null,
            investments_received: null,
            funding_given: null,
            investments_made: null,
            collaborations: null,
            data: null,
            revenue: null,
            expenses: null,
            // grants: null, Not needed, taken care of via the funding_given section.
            influence: null
          };

          // Scrape the web form for pertinent information and store into the object data structure.
          if ($('input[name="name"]').val() === "" && $('input[name="location"]').val() === "") {

            return {
              name: null,
              location: null,
              errorMessage: "The entity name and location have not been filled out."
            };
          } else if ($('input[name="name"]').val() === "") {

            return {
              name: null,
              errorMessage: "The entity name has not been filled out."
            };
          } else if ($('input[name="location"]').val() === "") {

            return {
              location: null,
              errorMessage: "The location has not been filled out."
            };
          } else {
            // Set the entity type.
            if ($('input#rb_forpro').is(":checked"))
              formObject.type = "For-Profit";
            else if ($('input#rb_nonpro').is(":checked"))
              formObject.type = "Non-Profit";
            else if ($('input#rb_gov').is(":checked"))
              formObject.type = "Government";
            else
              formObject.type = "Individual";

            // Set the entity name.
            formObject.name = d3.select(".webform-content input[name='name']")[0][0].value;

            // Grab the categories.
            formObject.categories = [];
            d3.selectAll('.webform-categories input').filter(function(d) {
              if (this.checked === true) {
                switch (this.value) {
                  case 'General':
                    formObject.categories.push("General Civic Tech");
                    break;
                  case 'DataAnalytics':
                    formObject.categories.push("Data & Analytics");
                    break;
                  case 'EconGrowthEdu':
                    formObject.categories.push("Jobs & Education");
                    break;
                  case 'SRCities':
                    formObject.categories.push("Smart & Resilient Cities");
                    break;
                  case 'SocialServ':
                    formObject.categories.push("Social Services");
                    break;
                  case 'GovTech':
                    formObject.categories.push("GovTech");
                    break;
                  default:
                    break;
                }
              }
            });
            if (formObject.categories.length === 0) {
              formObject.categories = null;
            }

            // Obtain the location
            formObject.location = d3.select("input[name='location']")[0][0].value;

            // Obtain the URL
            formObject.url = "";
            if (d3.select("input[name='website']")[0][0].value === "") {
              formObject.url = null;
            } else {
              formObject.url = d3.select("input[name='website']")[0][0].value;
            }

            // Obtain the number of employees.
            formObject.employees = "";
            if (d3.select("input[name='employees']")[0][0].value === "") {
              formObject.employees = null;
            } else {
              formObject.employees = parseInt(d3.select("input[name='employees']")[0][0].value);
            }

            // Obtain the key people (.kpeople)
            formObject.key_people = [];
            d3.selectAll('.kpeople').filter(function(d) {
              if (this.value !== "") {
                formObject.key_people.push(this.value);
              }
            });
            if (formObject.key_people.length === 0) {
              formObject.key_people = null;
            }

            // Obtain funding information (Don't forget to add total feature later on...)
            formObject.funding_received = [];
            var fund_amount;
            d3.selectAll('.fund-input .funder').filter(function(d, i) {
              if (this.value) {
                if (!d3.selectAll('.fund_amt')[0][i].value) {
                  fund_amount = null;
                  if (!d3.selectAll('.fund_year')[0][i].value) {
                    formObject.funding_received.push({
                      name: this.value,
                      amount: fund_amount,
                      year: null
                    });
                  } else
                    formObject.funding_received.push({
                      name: this.value,
                      amount: fund_amount,
                      year: d3.selectAll('.fund_year')[0][i].value
                    });
                } else {
                  fund_amount = d3.selectAll('.fund_amt')[0][i].value;
                  if (!d3.selectAll('.fund_year')[0][i].value) {
                    formObject.funding_received.push({
                      name: this.value,
                      amount: fund_amount,
                      year: null
                    });
                  } else
                    formObject.funding_received.push({
                      name: this.value,
                      amount: fund_amount,
                      year: d3.selectAll('.fund_year')[0][i].value
                    });
                }
              }
            });
            if (formObject.funding_received.length === 0) {
              formObject.funding_received = null;
            }

            formObject.funding_given = [];
            var fund_given_amount;
            d3.selectAll('.fundgiven-input .fundee').filter(function(d, i) {
              if (this.value) {
                if (!d3.selectAll('.fundgiven_amt')[0][i].value) {
                  fund_given_amount = null;
                  if (!d3.selectAll('.fundgiven_year')[0][i].value) {
                    formObject.funding_given.push({
                      name: this.value,
                      amount: fund_given_amount,
                      year: null
                    });
                  } else
                    formObject.funding_given.push({
                      name: this.value,
                      amount: fund_given_amount,
                      year: d3.selectAll('.fundgiven_year')[0][i].value
                    });
                } else {
                  fund_given_amount = d3.selectAll('.fundgiven_amt')[0][i].value;
                  if (!d3.selectAll('.fundgiven_year')[0][i].value) {
                    formObject.funding_given.push({
                      name: this.value,
                      amount: fund_given_amount,
                      year: null
                    });
                  } else
                    formObject.funding_given.push({
                      name: this.value,
                      amount: fund_given_amount,
                      year: d3.selectAll('.fundgiven_year')[0][i].value
                    });
                }
              }
            });
            if (formObject.funding_given.length === 0) {
              formObject.funding_given = null;
            }

            // Obtain investment information (Don't forget to add total feature later on...)
            formObject.investments_received = [];
            var investment_amount;
            d3.selectAll('.invest-input .investor').filter(function(d, i) {
              if (this.value) {
                if (!d3.selectAll('.invest_amt')[0][i].value) {
                  investment_amount = null;
                  if (!d3.selectAll('.invest_year')[0][i].value) {
                    formObject.investments_received.push({
                      name: this.value,
                      amount: investment_amount,
                      year: null
                    });
                  } else
                    formObject.investments_received.push({
                      name: this.value,
                      amount: investment_amount,
                      year: d3.selectAll('.invest_year')[0][i].value
                    });
                } else {
                  investment_amount = d3.selectAll('.invest_amt')[0][i].value;
                  if (!d3.selectAll('.invest_year')[0][i].value) {
                    formObject.investments_received.push({
                      name: this.value,
                      amount: investment_amount,
                      year: null
                    });
                  } else
                    formObject.investments_received.push({
                      name: this.value,
                      amount: investment_amount,
                      year: d3.selectAll('.invest_year')[0][i].value
                    });
                }
              }
            });
            if (formObject.investments_received.length === 0) {
              formObject.investments_received = null;
            }

            formObject.investments_made = [];
            var investment_made_amount;
            d3.selectAll('.investmade-input .investee').filter(function(d, i) {
              if (this.value) {
                if (!d3.selectAll('.investmade_amt')[0][i].value) {
                  investment_made_amount = null;
                  if (!d3.selectAll('.investmade_year')[0][i].value) {
                    formObject.investments_made.push({
                      name: this.value,
                      amount: investment_made_amount,
                      year: null
                    });
                  } else
                    formObject.investments_made.push({
                      name: this.value,
                      amount: investment_made_amount,
                      year: d3.selectAll('.investmade_year')[0][i].value
                    });
                } else {
                  investment_made_amount = d3.selectAll('.investmade_amt')[0][i].value;
                  if (!d3.selectAll('.investmade_year')[0][i].value) {
                    formObject.investments_made.push({
                      name: this.value,
                      amount: investment_made_amount,
                      year: null
                    });
                  } else
                    formObject.investments_made.push({
                      name: this.value,
                      amount: investment_made_amount,
                      year: d3.selectAll('.investmade_year')[0][i].value
                    });
                }
              }
            });
            if (formObject.investments_made.length === 0) {
              formObject.investments_made = null;
            }

            // Obtain data
            formObject.data = [];
            d3.selectAll('.data-entity').filter(function(d, i) {
              if (this.value !== "")
                formObject.data.push(this.value);
            });
            if (formObject.data.length === 0) {
              formObject.data = null;
            }
          }

          return formObject;
        }

        function processFormB(formObject) {
          //var formObj = {type:null,categories:null,name:null,nickname:null,location:null,url:null,employees:null,people:null,twitterH:null,followers:null,data:null,relatedto:null,poruc:null,funding_connections:null,yearFR:null,investmentR:null,yearIR:null,rande:null,randeY:null,grantsG:null,yearG:null,golr:null};

          // Set the entity name.
          formObject.nickname = d3.select(".webform-content input[name='nickname']")[0][0].value;
          if (!formObject.nickname) {
            formObject.nickname = formObject.name;
          }

          formObject.twitter_handle = d3.select(".webform-content input[name='twitterhandle']")[0][0].value;
          if (!formObject.twitter_handle) {
            formObject.twitter_handle = null;
          }

          // Set the entity type.
          if ($('.webform-influence input#rb_local').is(":checked"))
            formObject.influence = "local";
          else
            formObject.influence = "global";

          // Obtain collaborations
          formObject.collaborations = [];
          d3.selectAll('.collaborator').filter(function(d) {
            if (this.value) {
              formObject.collaborations.push(this.value);
            }
          });
          if (formObject.collaborations.length === 0) {
            formObject.collaborations = null;
          }

          // Obtain funding information (Don't forget to add total feature later on...)
          formObject.revenue = [];
          var revenue_year;
          d3.selectAll('.revenue-input .revenue_amt').filter(function(d, i) {
            if (this.value) {
              revenue_year = d3.selectAll('.revenue-input .revenue_year')[0][i].value;
              if (revenue_year)
                formObject.revenue.push({
                  amount: this.value,
                  year: revenue_year
                });
              else
                formObject.revenue.push({
                  amount: this.value,
                  year: null
                });
            }
          });
          if (formObject.revenue.length === 0) {
            formObject.revenue = null;
          }

          formObject.expenses = [];
          var expense_year;
          d3.selectAll('.expense-input .expense_amt').filter(function(d, i) {
            if (this.value) {
              expense_year = d3.selectAll('.expense-input .expense_year')[0][i].value;
              if (expense_year)
                formObject.expenses.push({
                  amount: this.value,
                  year: expense_year
                });
              else
                formObject.expenses.push({
                  amount: this.value,
                  year: null
                });
            }
          });
          if (formObject.expenses.length === 0) {
            formObject.expenses = null;
          }


          return formObject;

        }

        // Form B has the required items, which are already filled out, and the advanced items.
        // This form takes the user directly to form C if the user submits the data via clicking the submit button.
        function displayFormB() {
          // Now we have a perfectly structured JSON object that contains the information given by the user and inputted into the webform.
          // Send this object as a parameter to form B, and render form B accordingly.

          var formObject = processFormA();

          if (formObject.location && formObject.name) {
            // Reinitialize Form A items.

            counterKey = 0;
            counterK = 0;

            counterFund = 0;
            counterF = 0;

            // Render form B.

            s = '<h2 id="webform-head">Information</h2><hr/><div class="webform-content"><div class="input-control text" data-role="input-control"><input type="text" name="name" id="name" placeholder="Name of Entity"/></div><h3 class="form-header">Entity Type</h3><div class="webform-entities"><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_forpro" type="radio" name="entitytype" value="For-Profit" checked="checked"/><span class="check"></span><h4 class="webform-labels">For-Profit</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_nonpro" type="radio" name="entitytype" value="Non-Profit"/><span class="check"></span><h4 class="webform-labels">Non-Profit</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_gov" type="radio" name="entitytype" value="Government"/><span class="check"></span><h4 class="webform-labels">Government</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_individs" type="radio" name="entitytype" value="Individual"/><span class="check"></span><h4 class="webform-labels">Individual</h4></label></div></div><div class="input-control text" data-role="input-control"><input type="text" name="location" id="location" placeholder="City, State"/></div>';

            // Time to render the nickname, twitter handle fields
            // Also circle of influence, collaboration, revenue, revenue and grant...
            s += '<hr/><div class = "input-control text" data-role="input-control"><input type="text" name="nickname" id="nickname" placeholder="Nickname/Abbr."/></div><div class = "input-control text" data-role="input-control"><input type="text" name="twitterhandle" id="twitterhandle" placeholder="Twitter Handle"/></div><h3 class="form-header" style="display:inline-block;">Circle of Influence: </h3><div class="webform-influence"><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_local" type="radio" name="influence-type" value="Local Influence" checked="checked"/><span class="check"></span><h4 class="webform-labels">Local Influence</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_global" type="radio" name="influence-type" value="Global Influence" checked="checked"/><span class="check"></span><h4 class="webform-labels">Global Influence</h4></label></div></div><h3 class="form-header">Collaboration</h3><div id="collaboration-0" class="input-control text" data-role="input-control"><input type="text" name="collaboration" class="collaborator" placeholder="Collaborator" list="collaborator-list"/><datalist id="collaborator-list"></datalist></div><h3 class="form-header">Revenue</h3><div id="revenue-0"><div class="revenue-input input-control text" data-role="input-control"><input type="text" name="revenue_amt" class="revenue_amt" placeholder="Amount" style="display:inline-block; width: 57%;"/><input type="text" name="revenue_year" class="revenue_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div><h3 class="form-header">Expenses</h3><div id="expense-0"><div class="expense-input input-control text" data-role="input-control"><input type="text" name="expense_amt" class="expense_amt" placeholder="Amount" style="display:inline-block; width: 57%;"/><input type="text" name="expense_year" class="expense_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div><button type="button" id="submit-B" href="javascript: check_empty()">Submit</button></div>';

            // <h3 class="form-header">Grants</h3>\
            // <div id="grant-0">\
            // <div class="grant-input input-control text" data-role="input-control">\
            // <input type="text" name="grant_amt" class="grant_amt" placeholder="Amount" style="display:inline-block; width: 57%;"/>\
            // <input type="text" name="grant_year" class="grant_year" placeholder="Year" style="display:inline-block; width: 20%;"/>\
            // </div>\
            // </div>\

            d3.select('#info')
              .html(s);

            addDataList('#collaboration-0 datalist');


            // Time to prefill the form...
            d3.selectAll('#name').text(function(d) {
              this.value = formObject.name;
            }).attr("disabled", true);
            d3.selectAll('#location').text(function(d) {
              this.value = formObject.location;
            }).attr("disabled", true).style("margin-top", "10px");
            d3.selectAll('input[name="entitytype"]').filter(function(d, i) {
              if (this.value === formObject.type)
                this.checked = true;
              else
                this.checked = false;
              this.disabled = true;
            });

            // Add action listeners
            d3.selectAll('input[name="collaboration"]').on('keyup', function() {
              add_input_collab(0);
              preFillName(this.value, '#collaboration-0 input');
            });
            d3.selectAll('input[name="revenue_amt"]').on('keyup', function() {
              add_input_rev(0);
            });
            d3.selectAll('input[name="expense_amt"]').on('keyup', function() {
              add_input_exp(0);
            });
            // d3.selectAll('input[name="grant_amt"]').on('keyup', function() {
            //   add_input_grant(0);
            // });

            d3.selectAll('#submit-B').on('click', function() {
              displayFormCSendJSON(formObject);
              // if(!_.isEmpty(sb))
            });
          } else { //  Error checking the form...
            if (!formObject.name && !formObject.location) {
              d3.select('#name').style("border-color", "#e51400");
              d3.select('#location').style("border-color", "#e51400");
            } else {
              if (!formObject.name)
                d3.select('#name').style("border-color", "#e51400");
              else
                d3.select('#location').style("border-color", "#e51400");
            }
          }

        }

        function addDataList(dataListSelector) {
          d3.select(dataListSelector).html(dataListSortedNames);
        }

        function preFillName(input, inputSelector) {
          if (input.toLowerCase() in entitiesHash) {
            d3.selectAll(inputSelector).text(function(d) {
              this.value = entitiesHash[input].name;
            });
          }
        }

        function preParseForm(input) {
          input = input.toLowerCase();
          if (input in entitiesHash) {
            editForm();
            preFillFormA(entitiesHash[input]);
          }
        }

        function preFillLocation(input) {
          if (input.toLowerCase() in locationsHash) {
            d3.selectAll('#location').text(function(d) {
              this.value = locationsHash[input][0].location;
            });
          }
        }

        function add_input_kp(counterK) {
          if ($('#key-people-' + counterK + ' input[name="kpeople"]').val() !== "") {
            d3.select('#key-people-' + counterK + ' input[name="kpeople"]').on('keyup', null);
            counterK++; // counter -> 2


            $("#key-people-" + (counterK - 1)).after('<div id="key-people-' + counterK + '" class="input-control text" data-role="input-control"><input type="text" name="kpeople" class="kpeople" placeholder="Key Person\'s Name"/></div>');
            d3.select("#key-people-" + counterK + " input[name='kpeople']").on("keyup", function() {
              add_input_kp(counterK);
            });
          }
        }

        function add_input_fund(counterF) {
          if ($('#funding-' + counterF + ' input[name="fund"]').val() !== "") {
            d3.select('#funding-' + counterF + ' input[name="fund"]').on('keyup', function() {
              preFillName(this.value, '#funding-' + (counterF - 1) + ' input[name="fund"]');
            });
            counterF++; // counter -> 2


            $("#funding-" + (counterF - 1)).after('<div id="funding-' + counterF + '"><div class="fund-input input-control text" data-role="input-control"><input type="text" name="fund" class="funder" placeholder="Funder" style="display:inline-block; width:50%;" list="funding-received-list"/><datalist id="funding-received-list"></datalist><input type="text" name="fund_amt" class="fund_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="fund_year" class="fund_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
            addDataList('#funding-' + counterF + ' datalist');
            d3.select("#funding-" + counterF + " input[name='fund']").on("keyup", function() {
              add_input_fund(counterF);
            });
          }
        }

        function add_input_invest(counterI) {
          if ($('#investing-' + counterI + ' input[name="invest"]').val() !== "") {
            d3.select('#investing-' + counterI + ' input[name="invest"]').on('keyup', function() {
              preFillName(this.value, '#investing-' + (counterI - 1) + ' input[name="invest"]');
            });
            counterI++; // counter -> 2


            $("#investing-" + (counterI - 1)).after('<div id="investing-' + counterI + '"><div class="invest-input input-control text" data-role="input-control"><input type="text" name="invest" class="investor" placeholder="Investor" style="display:inline-block; width:50%;" list="investment-received-list"/><datalist id="investment-received-list"></datalist><input type="text" name="invest_amt" class="invest_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="invest_year" class="invest_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
            addDataList('#investing-' + counterI + ' datalist');
            d3.select("#investing-" + counterI + " input[name='invest']").on("keyup", function() {
              add_input_invest(counterI);
            });
          }
        }

        function add_input_fund_given(counterFG) {
          if ($('#fundinggiven-' + counterFG + ' input[name="fundgiven"]').val() !== "") {
            d3.select('#fundinggiven-' + counterFG + ' input[name="fundgiven"]').on('keyup', function() {
              preFillName(this.value, '#fundinggiven-' + (counterFG - 1) + ' input[name="fundgiven"]');
            });
            counterFG++; // counter -> 2


            $("#fundinggiven-" + (counterFG - 1)).after('<div id="fundinggiven-' + counterFG + '"><div class="fundgiven-input input-control text" data-role="input-control"><input type="text" name="fundgiven" class="fundee" placeholder="Fundee" style="display:inline-block; width:50%;" list="funding-given-list"/><datalist id="funding-given-list"></datalist><input type="text" name="fundgiven_amt" class="fundgiven_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="fundgiven_year" class="fundgiven_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
            addDataList('#fundinggiven-' + counterFG + ' datalist');
            d3.select("#fundinggiven-" + counterFG + " input[name='fundgiven']").on("keyup", function() {
              add_input_fund_given(counterFG);
            });
          }
        }

        function add_input_invest_made(counterIM) {
          if ($('#investmentmade-' + counterIM + ' input[name="investmade"]').val() !== "") {
            d3.select('#investmentmade-' + counterIM + ' input[name="investmade"]').on('keyup', function() {
              preFillName(this.value, '#investmentmade-' + (counterIM - 1) + ' input[name="investmade"]');
            });
            counterIM++; // counter -> 2


            $("#investmentmade-" + (counterIM - 1)).after('<div id="investmentmade-' + counterIM + '"><div class="investmade-input input-control text" data-role="input-control"><input type="text" name="investmade" class="investee" placeholder="Investee" style="display:inline-block; width:50%;" list="investment-made-list"/><datalist id="investment-made-list"></datalist><input type="text" name="investmade_amt" class="investmade_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="investmade_year" class="investmade_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
            addDataList('#investmentmade-' + counterIM + ' datalist');
            d3.select("#investmentmade-" + counterIM + " input[name='investmade']").on("keyup", function() {
              add_input_invest_made(counterIM);
            });
          }
        }

        function add_input_data(counterD) {
          if ($('#data-' + counterD + ' input[name="data"]').val() !== "") {
            d3.select('#data-' + counterD + ' input[name="data"]').on('keyup', function() {
              preFillName(this.value, '#data-' + (counterD - 1) + ' input[name="data"]');
            });
            counterD++; // counter -> 2


            $("#data-" + (counterD - 1)).after('<div id="data-' + counterD + '" class="input-control text" data-role="input-control"><input type="text" name="data" class="data-entity" placeholder="Data Resource" list="data-received-list"/><datalist id="data-received-list"></datalist></div>');
            addDataList('#data-' + counterD + ' datalist');
            d3.select("#data-" + counterD + " input[name='data']").on("keyup", function() {
              add_input_data(counterD);
            });
          }
        }

        function add_input_collab(counterC) {
          if ($('#collaboration-' + counterC + ' input[name="collaboration"]').val() !== "") {
            d3.select('#collaboration-' + counterC + ' input[name="collaboration"]').on('keyup', function() {
              preFillName(this.value, '#collaboration-' + (counterC - 1) + ' input[name="collaboration"]');
            });
            counterC++; // counter -> 2


            $("#collaboration-" + (counterC - 1)).after('<div id="collaboration-' + counterC + '" class="input-control text" data-role="input-control"><input type="text" name="collaboration" class="collaborator" placeholder="Collaborator" list="collaborator-list"/><datalist id="collaborator-list"></datalist></div>');
            addDataList('#collaboration-' + counterC + ' datalist');
            d3.select("#collaboration-" + counterC + " input[name='collaboration']").on("keyup", function() {
              add_input_collab(counterC);

            });
          }
        }

        function add_input_rev(counterR) {
          if ($('#revenue-' + counterR + ' input[name="revenue_amt"]').val() !== "") {
            d3.select('#revenue-' + counterR + ' input[name="revenue_amt"]').on('keyup', null);
            counterR++; // counter -> 2


            $("#revenue-" + (counterR - 1)).after('<div id="revenue-' + counterR + '"><div class="revenue-input input-control text" data-role="input-control"><input type="text" name="revenue_amt" class="revenue_amt" placeholder="Amount" style="display:inline-block; width: 57%;"/><input type="text" name="revenue_year" class="revenue_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
            d3.select("#revenue-" + counterR + " input[name=revenue_amt]").on("keyup", function() {
              add_input_rev(counterR);
            });
          }
        }

        function add_input_exp(counterE) {
          if ($('#expense-' + counterE + ' input[name="expense_amt"]').val() !== "") {
            d3.select('#expense-' + counterE + ' input[name="expense_amt"]').on('keyup', null);
            counterE++; // counter -> 2


            $("#expense-" + (counterE - 1)).after('<div id="expense-' + counterE + '"><div class="expense-input input-control text" data-role="input-control"><input type="text" name="expense_amt" class="expense_amt" placeholder="Amount" style="display:inline-block; width: 57%;"/><input type="text" name="expense_year" class="expense_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
            d3.select("#expense-" + counterE + " input[name=expense_amt]").on("keyup", function() {
              add_input_exp(counterE);
            });
          }
        }

        function displayFormA() {
          // Test if jQuery works within d3...
          //var elementCount = $( "*" ).css( "border", "3px solid red" ).length;
          s = '<h2 id="webform-head">Information</h2><hr/><div class="webform-content"><div class="input-control text" data-role="input-control"><input type="text" name="name" id="name" placeholder="Name of Entity" list="list-name"/><datalist id="list-name"></datalist></div><h3 class="form-header">What type of entity?</h3><div class="webform-entities"><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_forpro" type="radio" name="entitytype" value="For-Profit" checked="checked"/><span class="check"></span><h4 class="webform-labels">For-Profit</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_nonpro" type="radio" name="entitytype" value="Non-Profit"/><span class="check"></span><h4 class="webform-labels">Non-Profit</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_gov" type="radio" name="entitytype" value="Government"/><span class="check"></span><h4 class="webform-labels">Government</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_individs" type="radio" name="entitytype" value="Individual"/><span class="check"></span><h4 class="webform-labels">Individual</h4></label></div></div><h3 class="form-header">What kind of work do they do?</h3><h4>(Select All That Apply)</h4><div class="webform-categories"><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_gen" type="checkbox" name="gen" data-show="general" value="General"/><span class="check"></span><h4 class="webform-labels">General Civic Tech</h4></label></div><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_datat" type="checkbox" name="datat" data-show="datalytics" value="DataAnalytics"/><span class="check"></span><h4 class="webform-labels">Data & Analytics</h4></label></div><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_eced" type="checkbox" name="eced" data-show="econedu" value="EconGrowthEdu"/><span class="check"></span><h4 class="webform-labels">Jobs & Education</h4></label></div><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_src" type="checkbox" name="srcities" data-show="srcities" value="SRCities"/><span class="check"></span><h4 class="webform-labels">Smart & Resilient Cities</h4></label></div><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_socs" type="checkbox" name="socserv" data-show="socserv" value="SocialServ"/><span class="check"></span><h4 class="webform-labels">Social Services</h4></label></div><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_govt" type="checkbox" name="govtech" data-show="govtech" value="GovTech"/><span class="check"></span><h4 class="webform-labels">GovTech</h4></label></div></div><div class="input-control text" data-role="input-control"><input type="text" name="location" id="location" placeholder="City, State" list="list-location"/><datalist id="list-location"></datalist></div><div class="input-control text" data-role="input-control"><input type="text" name="website" id="website" placeholder="Website"/></div><h3 class="form-header" style="display:inline-block;">Number of Employees</h3><div class="input-control text" data-role="input-control" style="width:27% !important; display:inline-block; float:right; margin-top: 2%;"><input type="text" name="employees" id="employee" maxlength="6" style="width:100% !important;"/></div><h3 class="form-header">Key People?</h3><div id="key-people-0" class="input-control text" data-role="input-control"><input type="text" name="kpeople" class="kpeople" placeholder="Key Person\'s Name"/></div><h3 class="form-header">Who funds them via grants?</h3><div id="funding-0"><div class="fund-input input-control text" data-role="input-control"><input type="text" name="fund" class="funder" placeholder="Funder" style="display:inline-block; width:50%;" list="funding-received-list"/><datalist id="funding-received-list"></datalist><input type="text" name="fund_amt" class="fund_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="fund_year" class="fund_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div><h3 class="form-header">Who invests in them via equity stakes (stock)?</h3><div id="investing-0"><div class="invest-input input-control text" data-role="input-control"><input type="text" name="invest" class="investor" placeholder="Investor" style="display:inline-block; width:50%;" list="investment-received-list"/><datalist id="investment-received-list"></datalist><input type="text" name="invest_amt" class="invest_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="invest_year" class="invest_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div><h3 class="form-header">Who do they fund via grants?</h3><div id="fundinggiven-0"><div class="fundgiven-input input-control text" data-role="input-control"><input type="text" name="fundgiven" class="fundee" placeholder="Fundee" style="display:inline-block; width:50%;" list="funding-given-list"/><datalist id="funding-given-list"></datalist><input type="text" name="fundgiven_amt" class="fundgiven_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="fundgiven_year" class="fundgiven_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div><h3 class="form-header">Who do they invest in via equity stakes (stock)?</h3><div id="investmentmade-0"><div class="investmade-input input-control text" data-role="input-control"><input type="text" name="investmade" class="investee" placeholder="Investee" style="display:inline-block; width:50%;" list="investment-made-list"/><datalist id="investment-made-list"></datalist><input type="text" name="investmade_amt" class="investmade_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="investmade_year" class="investmade_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div><h3 class="form-header">Who provides them with data?</h3><div id="data-0" class="input-control text" data-role="input-control"><input type="text" name="data" class="data-entity" placeholder="Data Resource" list="data-received-list"/><datalist id="data-received-list"></datalist></div><div id="nextPhase"><button type="button" id="submit-A" href="javascript: check_empty()">Next</button></div></div><hr/><div class="webform-footer"><span id="">Some entities lack adequate information. Would you like to help?</span><br/><span id="toFormC">Click here!</span></div>';

          return s;

        }

        function iterateThroughObj(obj) {

          var objValue = _.object(_.map(obj, function(value, key) {
            return [key, value];
          }));

          return objValue;
        }

        function determineNullFields() {
          var nullFieldCount = 0;
          var nullFieldArr = [];

          //  We know which nodes have how null fields...
          filteredNodes.forEach(function(d) {
            var objValue = _.object(_.map(d, function(value, key) {
              if (value === null)
                nullFieldCount++;
              return [key, value];
            }));
            // Individuals do not have employees, people, rande, randeY 
            // Not a fair comparison of null fields.
            if (d.type === 'Individual')
              nullFieldCount -= 4;

            nullFieldArr.push({
              name: d.name,
              nullFields: nullFieldCount
            });
            nullFieldCount = 0;
          });

          //  Let's determine the nodes with the most null fields.
          var maxNullObj = _.max(nullFieldArr, function(d) {
            return d.nullFields
          });

          var potentialSuggestions = [];

          nullFieldArr.forEach(function(d) {
            if (d.nullFields <= maxNullObj.nullFields && d.nullFields >= maxNullObj.nullFields - 7) {
              var nodeObj = _.find(filteredNodes, function(e) {
                return d.name === e.name;
              });
              potentialSuggestions.push(nodeObj);
              // countFive++;
            }
          });

          var fiveSuggestions = [];

          while (fiveSuggestions.length < 5) {
            var indexValue = Math.floor(Math.random() * potentialSuggestions.length);

            if (fiveSuggestions.indexOf(potentialSuggestions[indexValue]) !== -1) {
              continue;
            } else {
              fiveSuggestions.push(potentialSuggestions[indexValue]);
            }
          }

          return fiveSuggestions;
        }

        function displayFormCSendJSON(obj) {
          var formObj = processFormB(obj);

          displayFormC();

          console.log(formObj);
          console.log($.param(formObj));

          $.ajax({
            type: 'POST',
            data: $.param(formObj),
            url: '/database/save',
            crossDomain: true
          }).done(function(returnData) {

          });

        }

        function displayFormC() {
          var s = "";
          s += '<h2 id="webform-head">Information</h2><hr/><div style="text-align:center;" class="webform-content"><p>Thank you for contributing to Athena! Refresh the page to view your changes (it might take a few moments).</p><p>Would you like to add or edit more info?</p>';

          s += '<ul id="suggestions">';

          var suggestions = determineNullFields();


          suggestions.forEach(function(d) {
            s += '<li><a style="cursor:pointer;">' + d.name + '</a></li>';
          });

          s += '</ul></div>';

          // Render the string into HTML
          d3.select('#info')
            .html(s);

          d3.selectAll('#info ul a').on('click', function(d, i) {
            sinclick(suggestions[i]);
            editForm();
            preFillFormA(suggestions[i]);
          });
        }

        // Prefilling the form for editing...
        function preFillFormA(obj) {
          // Time to prefill the form...
          d3.selectAll('#name').text(function(d) {
            this.value = obj.name;
          });
          d3.selectAll('#location').text(function(d) {
            this.value = obj.location;
          });
          d3.selectAll('input[name="entitytype"]').filter(function(d, i) {
            if (this.value === obj.type)
              this.checked = true;
            else
              this.checked = false;
          });

          if (obj.categories !== null) {
            d3.selectAll('.webform-categories input').filter(function(d, i) {
              if ((obj.categories).indexOf(d3.selectAll('.webform-categories h4')[0][i].textContent) > -1)
                this.checked = true;
              else
                this.checked = false;
            });
          }

          d3.selectAll('#website').text(function(d) {
            this.value = obj.url;
          });
          d3.selectAll('#employee').text(function(d) {
            this.value = obj.employees;
          });

          if (obj.key_people !== null) {
            var keypeople = obj.key_people;
            for (var i = 0; i < keypeople.length; i++) {
              $("#key-people-" + i).after('<div id="key-people-' + (i + 1) + '" class="input-control text" data-role="input-control"><input type="text" name="kpeople" class="kpeople" placeholder="Key Person\'s Name""/></div>');
              d3.select('#key-people-' + i + ' input[name="kpeople"]').on('keyup', null);
              d3.select('#key-people-' + i + ' input[name="kpeople"]').text(function(e) {
                this.value = keypeople[i].name;
              });
            }
            // keypeople.forEach(function(d, i) {
            //   // typeIntoFields(d, 0, d3.selectAll('#keypeople input')[0][i]);


            // });
            d3.select('#key-people-' + keypeople.length + ' input[name="kpeople"]').on('keyup', function() {
              add_input_kp(keypeople.length);
            });
          }

          if (obj.funding_received !== null) {
            var fundingreceived = obj.funding_received;

            fundingreceived.forEach(function(d, i) {
              $("#funding-" + i).after('<div id="funding-' + (i + 1) + '"><div class="fund-input input-control text" data-role="input-control"><input type="text" name="fund" class="funder" placeholder="Funder" style="display:inline-block; width:50%;" list="funding-received-list"/><datalist id="funding-received-list"></datalist><input type="text" name="fund_amt" class="fund_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="fund_year" class="fund_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
              addDataList('#funding-' + i + ' datalist');

              d3.select('#funding-' + i + ' input[name="fund"]').on('keyup', function() {
                preFillName(this.value, '#funding-' + i + ' input[name="fund"]');
              });
              d3.select('#funding-' + i + ' input[name="fund"]').text(function(e) {
                this.value = d.entity;
              });
              d3.select('#funding-' + i + ' input[name="fund_amt"]').text(function(e) {
                this.value = d.amount;
              });
              d3.select('#funding-' + i + ' input[name="fund_year"]').text(function(e) {
                this.value = d.year;
              });
            });
            d3.select("#funding-" + fundingreceived.length + " input[name='fund']").on("keyup", function() {
              add_input_fund(fundingreceived.length);
            });
          }

          if (obj.funding_given !== null) {
            var fundinggiven = obj.funding_given;

            fundinggiven.forEach(function(d, i) {
              $("#fundinggiven-" + i).after('<div id="fundinggiven-' + (i + 1) + '"><div class="fundgiven-input input-control text" data-role="input-control"><input type="text" name="fundgiven" class="fundee" placeholder="Fundee" style="display:inline-block; width:50%;" list="funding-given-list"/><datalist id="funding-given-list"></datalist><input type="text" name="fundgiven_amt" class="fundgiven_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="fundgiven_year" class="fundgiven_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
              addDataList('#fundinggiven-' + i + ' datalist');

              d3.select('#fundinggiven-' + i + ' input[name="fundgiven"]').on('keyup', function() {
                preFillName(this.value, '#fundinggiven-' + i + ' input[name="fundgiven"]');
              });
              d3.select('#fundinggiven-' + i + ' input[name="fundgiven"]').text(function(e) {
                this.value = d.entity;
              });
              d3.select('#fundinggiven-' + i + ' input[name="fundgiven_amt"]').text(function(e) {
                this.value = d.amount;
              });
              d3.select('#fundinggiven-' + i + ' input[name="fundgiven_year"]').text(function(e) {
                this.value = d.year;
              });
            });
            d3.select("#fundinggiven-" + fundinggiven.length + " input[name='fundgiven']").on("keyup", function() {
              add_input_fund_given(fundinggiven.length);
            });
          }

          if (obj.investments_received !== null) {
            var investmentreceived = obj.investments_received;

            investmentreceived.forEach(function(d, i) {
              $("#investing-" + i).after('<div id="investing-' + (i + 1) + '"><div class="invest-input input-control text" data-role="input-control"><input type="text" name="invest" class="investor" placeholder="Investor" style="display:inline-block; width:50%;" list="investment-received-list"/><datalist id="investment-received-list"></datalist><input type="text" name="invest_amt" class="invest_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="invest_year" class="invest_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
              addDataList('#investing-' + i + ' datalist');

              d3.select('#investing-' + i + ' input[name="invest"]').on('keyup', function() {
                preFillName(this.value, '#investing-' + i + ' input[name="invest"]');
              });
              d3.select('#investing-' + i + ' input[name="invest"]').text(function(e) {
                this.value = d.entity;
              });
              d3.select('#investing-' + i + ' input[name="invest_amt"]').text(function(e) {
                this.value = d.amount;
              });
              d3.select('#investing-' + i + ' input[name="invest_year"]').text(function(e) {
                this.value = d.year;
              });

            });
            d3.select("#investing-" + investmentreceived.length + " input[name='invest']").on("keyup", function() {
              add_input_invest(investmentreceived.length);
            });
          }

          if (obj.investments_made !== null) {
            var investmentsmade = obj.investments_made;

            investmentsmade.forEach(function(d, i) {
              $("#investmentmade-" + i).after('<div id="investmentmade-' + (i + 1) + '"><div class="investmade-input input-control text" data-role="input-control"><input type="text" name="investmade" class="investee" placeholder="Investee" style="display:inline-block; width:50%;" list="investment-made-list"/><datalist id="investment-made-list"></datalist><input type="text" name="investmade_amt" class="investmade_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="investmade_year" class="investmade_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
              addDataList('#investmentmade-' + i + ' datalist');

              d3.select('#investmentmade-' + i + ' input[name="investmade"]').on('keyup', function() {
                preFillName(this.value, '#investmentmade-' + i + ' input[name="investmade"]');
              });
              d3.select('#investmentmade-' + i + ' input[name="investmade"]').text(function(e) {
                this.value = d.entity;
              });
              d3.select('#investmentmade-' + i + ' input[name="investmade_amt"]').text(function(e) {
                this.value = d.amount;
              });
              d3.select('#investmentmade-' + i + ' input[name="investmade_year"]').text(function(e) {
                this.value = d.year;
              });

            });
            d3.select("#investmentmade-" + investmentsmade.length + " input[name='investmade']").on("keyup", function() {
              add_input_invest_made(investmentsmade.length);
            });
          }

          if (obj.data !== null) {
            var dataProviders = obj.data;

            dataProviders.forEach(function(d, i) {
              $("#data-" + i).after('<div id="data-' + (i + 1) + '" class="input-control text" data-role="input-control"><input type="text" name="data" class="data-entity" placeholder="Data Resource" list="data-received-list"/><datalist id="data-received-list"></datalist></div>');
              addDataList('#data-' + i + ' datalist');

              d3.select('#data-' + i + ' input[name="data"]').on('keyup', function() {
                preFillName(this.value, '#data-' + i + ' input[name="data"]');
              });
              d3.select('#data-' + i + ' input[name="data"]').text(function(e) {
                this.value = d.entity;
              });
            });
            d3.select("#data-" + dataProviders.length + " input[name='data']").on("keyup", function() {
              add_input_data(dataProviders.length);
            });
          }

          d3.selectAll('#submit-A').on('click', function() {
            d3.select('#name').style("border-color", "#d9d9d9");
            d3.select('#location').style("border-color", "#d9d9d9");
            displayFormB();
            preFillFormB(obj);
          });
        }

        function preFillFormB(obj) {
          d3.selectAll('#nickname').text(function(d) {
            this.value = obj.nickname;
          });
          d3.selectAll('#twitterhandle').text(function(d) {
            this.value = obj.twitter_handle;
          });

          d3.selectAll('input[name="influence-type"]').filter(function(d, i) {
            if (obj.influence === "local" && this.value === "Local Influence")
              this.checked = true;
            else if (obj.influence === "global" && this.value === "Global Influence")
              this.checked = true;
            else
              this.checked = false;
          });

          if (obj.collaborations !== null) {
            var collaboration = obj.collaborations;

            collaboration.forEach(function(d, i) {
              // typeIntoFields(d, 0, d3.selectAll('#keypeople input')[0][i]);
              $("#collaboration-" + i).after('<div id="collaboration-' + (i + 1) + '" class="input-control text" data-role="input-control"><input type="text" name="collaboration" class="collaborator" placeholder="Collaborator" list="collaborator-list"/><datalist id="collaborator-list"></datalist></div>');
              addDataList('#collaboration-' + i + ' datalist');

              d3.select('#collaboration-' + i + ' input[name="collaboration"]').on('keyup', function() {
                preFillName(this.value, '#collaboration-' + i + ' input[name="collaboration"]');
              });
              d3.select('#collaboration-' + i + ' input[name="collaboration"]').text(function(e) {
                this.value = d.entity;
              });

            });

            d3.select('#collaboration-' + collaboration.length + ' input[name="collaboration"]').on('keyup', function() {
              add_input_collab(collaboration.length);
            });
          }

          if (obj.expenses !== null) {
            var expenseValues = obj.expenses;

            expenseValues.forEach(function(d, i) {
              $("#expense-" + i).after('<div id="expense-' + (i + 1) + '"><div class="expense-input input-control text" data-role="input-control"><input type="text" name="expense_amt" class="expense_amt" placeholder="Amount" style="display:inline-block; width: 57%;"/><input type="text" name="expense_year" class="expense_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
              d3.select('#expense-' + i + ' input[name="expense_amt"]').on('keyup', null);
              d3.select('#expense-' + i + ' input[name="expense_amt"]').text(function(e) {
                this.value = d.amount;
              });
              d3.select('#expense-' + i + ' input[name="expense_year"]').text(function(e) {
                this.value = d.year;
              });
            });
            d3.select('#expense-' + expenseValues.length + ' input[name="expense_amt"]').on('keyup', function() {
              add_input_exp(expenseValues.length);
            });
          }

          if (obj.revenue !== null) {
            var revenueValues = obj.revenue;

            revenueValues.forEach(function(d, i) {
              $("#revenue-" + i).after('<div id="revenue-' + (i + 1) + '"><div class="revenue-input input-control text" data-role="input-control"><input type="text" name="revenue_amt" class="revenue_amt" placeholder="Amount" style="display:inline-block; width: 57%;"/><input type="text" name="revenue_year" class="revenue_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div>');
              d3.select('#revenue-' + i + ' input[name="revenue_amt"]').on('keyup', null);
              d3.select('#revenue-' + i + ' input[name="revenue_amt"]').text(function(e) {
                this.value = d.amount;
              });
              d3.select('#revenue-' + i + ' input[name="revenue_year"]').text(function(e) {
                this.value = d.year;
              });
            });
            d3.select('#revenue-' + revenueValues.length + ' input[name="revenue_amt"]').on('keyup', function() {
              add_input_rev(revenueValues.length);
            });
          }
        }

        var forProfitObjects = [];
        var nonProfitObjects = [];
        var governmentObjects = [];
        var individualObjects = [];

        initialInfo();

        // Initial display on sidebar
        function initialInfo() {
          var s = "";

          var countTypes = [0, 0, 0, 0];

          var forProfitsArray = [];
          var nonProfitsArray = [];
          var governmentArray = [];
          var individualArray = [];

          for (var x = 0; x < filteredNodes.length; x++) {
            if (filteredNodes[x].type === "Individual") {
              individualArray.push(filteredNodes[x].name);
              individualObjects.push(filteredNodes[x]);
              countTypes[3] ++;
            }
            if (filteredNodes[x].type === "Non-Profit") {
              nonProfitsArray.push(filteredNodes[x].name);
              nonProfitObjects.push(filteredNodes[x]);
              countTypes[1] ++;
            }
            if (filteredNodes[x].type === "For-Profit") {
              forProfitsArray.push(filteredNodes[x].name);
              forProfitObjects.push(filteredNodes[x]);
              countTypes[0] ++;
            }
            if (filteredNodes[x].type === "Government") {
              governmentArray.push(filteredNodes[x].name);
              governmentObjects.push(filteredNodes[x]);
              countTypes[2] ++;
            }
          }


          s += "<h3 style='padding-bottom:10px;'>The Data</h3>";


          //  Printing to side panel within web application.
          d3.select('#info')
            .html(s)
            .style('list-style', 'square');

          d3.select('#info').append('div').attr('id', 'breakdown').style('width', '100%');

          var x = d3.scale.linear()
            .domain([0, d3.max(countTypes)])
            .range([0, $('#breakdown').width()]);

          var typesColor = 0;
          var typesText = 0;

          d3.select("#breakdown")
            .selectAll("div")
            .data(countTypes)
            .enter().append("div")
            .style("width", function(d) {
              return x(d) / 5 + "%";
            })
            .style("height", "20px")
            .style("font", "8px sans-serif")
            .style("background-color", function(d) {
              if (typesColor === 0) {
                typesColor++;
                return "rgb(127,186,0)";
              }
              if (typesColor === 1) {
                typesColor++;
                return "rgb(0,164,239)";
              }
              if (typesColor === 2) {
                typesColor++;
                return "rgb(242,80,34)";
              }
              if (typesColor === 3) {
                typesColor++;
                return "rgb(255,185,0)";
              }
            })
            .style("text-align", "right")
            .style("padding", "3px")
            .style("margin", "1px")
            .style("color", "white")
            .text(function(d) {
              if (typesText === 0) {
                typesText++;
                return;
              }
              if (typesText === 1) {
                typesText++;
                return;
              }
              if (typesText === 2) {
                typesText++;
                return;
              }
              if (typesText === 3) {
                typesText++;
                return;
              }
            });

          var t = "";

          t += "<h3 style='padding-top:15px; color:rgb(127,186,0);'>For-Profit (" + countTypes[0] + "):</h3> ";
          for (var x = 0; x < forProfitsArray.length; x++) {
            if (x === forProfitsArray.length - 1) {
              t += "<a class='for-profit-entity' style='font-size:16px; cursor:pointer;'>" + forProfitsArray[x] + "</a>";
            } else {
              t += "<a class='for-profit-entity' style='font-size:16px; cursor:pointer;'>" + forProfitsArray[x] + ", </a>";
            }
          }
          t += "<h3 style='padding-top:15px; color:rgb(0,164,239);'>Non-Profit (" + countTypes[1] + "):</h3> ";
          for (var x = 0; x < nonProfitsArray.length; x++) {
            if (x === nonProfitsArray.length - 1) {
              t += "<a class='non-profit-entity' style='font-size:16px; cursor:pointer;'>" + nonProfitsArray[x] + "</a>";
            } else {
              t += "<a class='non-profit-entity' style='font-size:16px; cursor:pointer;'>" + nonProfitsArray[x] + ", </a>";
            }
          }
          t += "<h3 style='padding-top:15px; color:rgb(242,80,34);'>Government (" + countTypes[2] + "):</h3> ";
          for (var x = 0; x < governmentArray.length; x++) {
            if (x === governmentArray.length - 1) {
              t += "<a class='government-entity' style='font-size:16px; cursor:pointer;'>" + governmentArray[x] + "</a>";
            } else {
              t += "<a class='government-entity' style='font-size:16px; cursor:pointer;'>" + governmentArray[x] + ", </a>";
            }
          }
          t += "<h3 style='padding-top:15px; color:rgb(255,185,0);'>Individual (" + countTypes[3] + "):</h3> ";
          for (var x = 0; x < individualArray.length; x++) {
            if (x === individualArray.length - 1) {
              t += "<a  class='individual-entity' style='font-size:16px; cursor:pointer;'>" + individualArray[x] + "</a>";
            } else {
              t += "<a  class='individual-entity' style='font-size:16px; cursor:pointer;'>" + individualArray[x] + ", </a>";
            }
          }

          d3.select('#info')
            .append('text')
            .style('padding-bottom', '20px')
            .html(t);

        }

        d3.selectAll('.for-profit-entity').on('click', function(n, i) {

          sinclick(forProfitObjects[i]);

        });

        d3.selectAll('.non-profit-entity').on('click', function(n, i) {

          sinclick(nonProfitObjects[i]);

        });

        d3.selectAll('.individual-entity').on('click', function(n, i) {

          sinclick(individualObjects[i]);

        });

        d3.selectAll('.government-entity').on('click', function(n, i) {

          sinclick(governmentObjects[i]);

        });

        //click-location works here...
        d3.selectAll('.click-location').on('click', function(r) {

          handleQuery(this.innerHTML);
        });


        searchAutoComplete();


        function searchAutoComplete() {
          var s = "";

          filteredNodes.forEach(function(d) {
            name = d.name.toLowerCase();
            nickname = d.nickname.toLowerCase();
            var splitLocations = (d.location).split("; ");

            if (!(name in entitiesHash)) {
              entitiesHash[name] = d;
              sortedNamesList.push(d.name);
            }

            if (!(nickname in entitiesHash)) {
              entitiesHash[nickname] = d;
              sortedNamesList.push(d.nickname);
            }

            splitLocations.forEach(function(l) {
              var lwcLocation = l.toLowerCase();
              (!(lwcLocation in locationsHash)) ? (locationsHash[lwcLocation] = [], locationsHash[lwcLocation].push(d), sortedLocationsList.push(l)) : (locationsHash[lwcLocation].push(d));
            });

          });

          // entitiesHash = _.sortBy(entitiesHash, function(value, key, object){
          //   return key;
          // });

          sortedNamesList = _.sortBy(sortedNamesList, function(names) {
            return names.toLowerCase();
          });
          sortedLocationsList = _.sortBy(sortedLocationsList, function(locations) {
            return locations.toLowerCase();
          });
          sortedSearchList = _.sortBy(sortedNamesList.concat(sortedLocationsList), function(keys) {
            return keys;
          });

          for (var count = 0; count < sortedSearchList.length; count++) {
            s += '<option value="' + sortedSearchList[count] + '">';
          }

          d3.select('.filter-name-location datalist')
            .html(s);
        }

        d3.selectAll('#search-text').on('keydown', function() {
          if (d3.event.keyCode === 13) {
            handleQuery(this.value);
          }
        }).on('keyup', function() {
          handleQuery(this.value);
        });

        d3.selectAll('option').on('keydown', function(n, i) {
          if (d3.event.keyCode === 13) {
            var query = (d3.selectAll('option'))[0][i].value;
            handleQuery(query);
          }
        });

        function handleQuery(query) {

          query = query.toLowerCase();

          if (query in entitiesHash) {

            sinclick(entitiesHash[query]);
          }

          if (query in locationsHash) {
            fundLink.style("opacity", function(l) {
              return ((l.source).location.toLowerCase() === query && (l.target).location.toLowerCase() === query) ? 1 : 0.05;
            });

            investLink.style("opacity", function(l) {
              return ((l.source).location.toLowerCase() === query && (l.target).location.toLowerCase() === query) ? 1 : 0.05;
            });

            porucsLink.style("opacity", function(l) {
              return ((l.source).location.toLowerCase() === query && (l.target).location.toLowerCase() === query) ? 1 : 0.05;
            });

            dataLink.style("opacity", function(l) {
              return ((l.source).location.toLowerCase() === query && (l.target).location.toLowerCase() === query) ? 1 : 0.05;
            });

            d3.selectAll('circle').style("stroke", "white");

            d3.selectAll('.node').style('opacity', function(n) {
              return (n.location.toLowerCase().indexOf(query) === -1) ? 0.05 : 1;
            }).select('text').style('opacity', 1);

            node.on('mouseout', null)
              .on('mouseover', null)
              .on('click', null);

            node.filter(function(n, i) {
                return nodeInit[0][i].style.opacity == 1;
              })
              .on('mouseover', handleClickNodeHover);
          }
        }

        dataListSortedNames = generateNamesDataList(sortedNamesList);
        dataListSortedLocations = generateNamesDataList(sortedLocationsList);


        function generateNamesDataList(sortedList) {
          var datalist = "";
          for (var i = 0; i < sortedList.length; i++) {
            datalist += '<option value="' + sortedList[i] + '">';
          }
          return datalist;
        }


        function handleNodeHover(d) {

          var s = textDisplay(d);

          //  Printing to side panel within web application.
          webform = editDisplay(d);

          // For editing the data displayed within the side panel.
          d3.select('#edit')
            .html(webform);

          d3.select('#info')
            .html(s)
            .style('list-style', 'square');

          fundLink.transition()
            .duration(350)
            .delay(0).style("opacity", function(l) {
              return (d === l.source || d === l.target) ? 1 : 0.05;
            });

          investLink.transition()
            .duration(350)
            .delay(0).style("opacity", function(l) {
              return (d === l.source || d === l.target) ? 1 : 0.05;
            });

          porucsLink.transition()
            .duration(350)
            .delay(0).style("opacity", function(l) {
              return (d === l.source || d === l.target) ? 1 : 0.05;
            });

          dataLink.transition()
            .duration(350)
            .delay(0).style("opacity", function(l) {
              return (d === l.source || d === l.target) ? 1 : 0.05;
            });

          var isLinkTarget = function(link, node) {
            return link.target.index === node.index;
          }

          var isLinkSource = function(link, node) {
            return link.source.index === node.index;
          }

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

          d3.select(this).style("stroke", "rgba(0,0,0,0.6)");

          svg.selectAll('.node')
            .transition()
            .duration(350)
            .delay(0)
            .style("opacity", function(n) {
              if (n.ID in neighboringNodesIndices)
                return "1";
              else
                return "0.05";
            }).select('text').style('opacity', 1);

          d3.select(this.parentNode).select("text").transition()
            .duration(350)
            .delay(0).style("opacity", 1).style("font-weight", "bold");
        }

        function handleAdjNodeClick(d) {
          fundLink.style("opacity", function(l) {
            if (d === l.source || d === l.target) {
              return "1";
            } else
              return "0.05";
          });

          investLink.style("opacity", function(l) {
            if (d === l.source || d === l.target) {

              return "1";
            } else
              return "0.05";
          });

          porucsLink.style("opacity", function(l) {
            if (d === l.source || d === l.target) {
              return "1";
            } else
              return "0.05";
          });

          dataLink.style("opacity", function(l) {
            if (d === l.source || d === l.target) {
              return "1";
            } else
              return "0.05";
          });

          var isLinkTarget = function(link, node) {
            return link.target.index === node.index;
          }

          var isLinkSource = function(link, node) {
            return link.source.index === node.index;
          }

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

          svg.selectAll('.node').style("opacity", function(n) {
            if (n.ID in neighboringNodesIndices)
              return "1";
            else
              return "0.05";
          });

          d3.select(this).style("stroke", "black").on('mouseout', null);

          node.filter(function(singleNode) {
              if (singleNode !== d) {
                return singleNode;
              }
            }).style("stroke", "white")
            .on('mouseover', null)
            .on('mouseout', null)
            .on('click', null);

          node.filter(function(l) {
              return (neighborFund.indexOf(l.index) > -1 || neighborInvest.indexOf(l.index) > -1 || neighborPorucs.indexOf(l.index) > -1 || neighborData.indexOf(l.index) > -1 || l === d);
            }).on('mouseover', handleClickNodeHover)
            .on('click', sinclick);

        }

        function offNode() {
          node
            .style("stroke", "white")
            .on('mouseover', handleNodeHover)
            .on('mouseout', offNode)
            .on('click', sinclick);
          //.on("dblclick", dblclick);

          fundLink
            .transition()
            .duration(350)
            .delay(0)
            .style("stroke", "rgb(111,93,168)")
            .style("opacity", "0.2")
            .style("stroke-width", "1px");
          // .each(function(){this.parentNode.insertBefore(this, this);});

          investLink
            .transition()
            .duration(350)
            .delay(0)
            .style("stroke", "rgb(38,114,114)")
            .style("opacity", "0.2")
            .style("stroke-width", "1px");
          // .each(function(){this.parentNode.insertBefore(this, this);});

          porucsLink
            .transition()
            .duration(350)
            .delay(0)
            .style("stroke", "rgb(235,232,38)")
            .style("opacity", "0.2")
            .style("stroke-width", "1px");
          // .each(function(){this.parentNode.insertBefore(this, this);});

          dataLink
            .transition()
            .duration(350)
            .delay(0)
            .style("stroke", "rgb(191,72,150)")
            .style("opacity", "0.2")
            .style("stroke-width", "1px");
          // .each(function(){this.parentNode.insertBefore(this, this);});

          // svg.selectAll('.node text').style('opacity', 1); 
          d3.selectAll('.node').transition()
            .duration(350)
            .delay(0)
            .style("opacity", "1");

          d3.selectAll('.node').selectAll('text').transition()
            .duration(350)
            .delay(0).style('opacity', function(d) {

              var textOpacity;
              if (d.type === "For-Profit")
                textOpacity = (fiveMostConnectedForProfit.hasOwnProperty(d.name)) ? 1 : 0;
              if (d.type === "Non-Profit")
                textOpacity = (fiveMostConnectedNonProfit.hasOwnProperty(d.name)) ? 1 : 0;
              if (d.type === "Individual")
                textOpacity = (fiveMostConnectedIndividuals.hasOwnProperty(d.name)) ? 1 : 0;
              if (d.type === "Government")
                textOpacity = (fiveMostConnectedGovernment.hasOwnProperty(d.name)) ? 1 : 0;

              return textOpacity;
            }).style('font-size', '14px').style('font-weight', 'normal');


        }

        function sinclick(d) {
          clearResetFlag = 0;


          handleClickNodeHover(d);

          fundLink.transition()
            .duration(350)
            .delay(0).style("opacity", function(l) {
              if (d === l.source || d === l.target) {
                return "1";
              } else
                return "0.05";
            });

          investLink.transition()
            .duration(350)
            .delay(0).style("opacity", function(l) {
              if (d === l.source || d === l.target) {

                return "1";
              } else
                return "0.05";
            });

          porucsLink.transition()
            .duration(350)
            .delay(0).style("opacity", function(l) {
              if (d === l.source || d === l.target) {
                return "1";
              } else
                return "0.05";
            });

          dataLink.transition()
            .duration(350)
            .delay(0).style("opacity", function(l) {
              if (d === l.source || d === l.target) {
                return "1";
              } else
                return "0.05";
            });

          node.style("stroke", function(singleNode) {
            if (singleNode !== d) {
              return "white";
            } else
              return "black";
          }).on('mouseout', null);

          node.filter(function(singleNode) {
            if (singleNode !== d) {
              // d3.select(singleNode).on('click', null);
              return singleNode;
            }
          }).on('mouseover', null);

          var neighborFund = graph.funding_connections.filter(function(link) {
            return link.source.index === d.index || link.target.index === d.index;
          }).map(function(link) {
            return link.source.index === d.index ? link.target.index : link.source.index;
          });

          var neighborInvest = graph.investment_connections.filter(function(link) {
            return link.source.index === d.index || link.target.index === d.index;
          }).map(function(link) {
            return link.source.index === d.index ? link.target.index : link.source.index;
          });

          var neighborPorucs = graph.collaboration_connections.filter(function(link) {
            return link.source.index === d.index || link.target.index === d.index;
          }).map(function(link) {
            return link.source.index === d.index ? link.target.index : link.source.index;
          });

          var neighborData = graph.data_connections.filter(function(link) {
            return link.source.index === d.index || link.target.index === d.index;
          }).map(function(link) {
            return link.source.index === d.index ? link.target.index : link.source.index;
          });

          svg.selectAll('.node').transition()
            .duration(350)
            .delay(0).style("opacity", function(l) {
              return (neighborFund.indexOf(l.index) > -1 || neighborInvest.indexOf(l.index) > -1 || neighborPorucs.indexOf(l.index) > -1 || neighborData.indexOf(l.index) > -1 || l === d) ? 1 : 0.05;
            }).select('text').style('opacity', 1);


          node.filter(function(l) {
              return (neighborFund.indexOf(l.index) > -1 || neighborInvest.indexOf(l.index) > -1 || neighborPorucs.indexOf(l.index) > -1 || neighborData.indexOf(l.index) > -1 || l === d);
            }).on('mouseover', handleClickNodeHover)
            .on('click', function(l) {});

        }

        function dragstart(d) {
          // d3.select(this).classed("fixed", function(d){if(d !== centeredNode){d.fixed = true;} else d.fixed = false;});
          d3.select(this).classed("fixed", function(d) {
            d.fixed = false;
          });

          node.on('mouseover', null)
            .on('mouseout', null)
            .on('click', null);
        }

        function drag(d) {
          node.on('mouseover', null)
            .on('mouseout', null)
            .on('click', null);
        }

        function dragend(d) {
          d3.select(this).classed("fixed", function(d) {
            d.fixed = true;
          });


          node.on('mouseover', handleNodeHover)
            .on('mouseout', offNode)
            .on('click', sinclick);
        }



        function tick(e) {
          // Push different nodes in different directions for clustering.
          var k = 8 * e.alpha;

          /* Four quandrant separation */
          filteredNodes.forEach(function(o, i) {
            if (o.type !== null) {
              if (o.type === "Individual") {
                //o.x += k;
                //o.y += k;
                o.x += (k + k);
                o.y += (k + k);
              }
              if (o.type === "Non-Profit") {
                //o.x += -k;
                //o.y += k;
                o.x += (-k - k);
                o.y += (k + k);
              }
              if (o.type === "For-Profit") {
                //o.x += k;
                //o.y += -k;
                o.x += (k + k);
                o.y += (-k - k);
              }
              if (o.type === "Government") {
                //o.x += -k;
                //o.y += -k;
                o.x += (-k - k);
                o.y += (-k - k);
              }
            }
          });

          if (_.isEmpty(centeredNode)) {
            fundLink.attr("x1", function(d) {
                return d.source.x;
              })
              .attr("y1", function(d) {
                return d.source.y;
              })
              .attr("x2", function(d) {
                return d.target.x;
              })
              .attr("y2", function(d) {
                return d.target.y;
              });

            investLink.attr("x1", function(d) {
                return d.source.x;
              })
              .attr("y1", function(d) {
                return d.source.y;
              })
              .attr("x2", function(d) {
                return d.target.x;
              })
              .attr("y2", function(d) {
                return d.target.y;
              });

            porucsLink.attr("x1", function(d) {
                return d.source.x;
              })
              .attr("y1", function(d) {
                return d.source.y;
              })
              .attr("x2", function(d) {
                return d.target.x;
              })
              .attr("y2", function(d) {
                return d.target.y;
              });

            dataLink.attr("x1", function(d) {
                return d.source.x;
              })
              .attr("y1", function(d) {
                return d.source.y;
              })
              .attr("x2", function(d) {
                return d.target.x;
              })
              .attr("y2", function(d) {
                return d.target.y;
              });

            node.attr("cx", function(d) {
                return d.x = d.x;
              })
              .attr("cy", function(d) {
                return d.y = d.y;
              });

            textElement.attr("transform", transformText);


          } else {
            fundLink.attr("x1", function(d) {
                if (d.source === centeredNode) {
                  d.source.x = centeredNode.x;

                  return d.source.x;
                } else return d.source.x;
              })
              .attr("y1", function(d) {
                if (d.source === centeredNode) {
                  d.source.y = centeredNode.y;

                  return d.source.y;
                } else return d.source.y;
              })
              .attr("x2", function(d) {
                if (d.target === centeredNode) {
                  d.target.x = centeredNode.x;

                  return d.target.x;
                } else return d.target.x;
              })
              .attr("y2", function(d) {
                if (d.target === centeredNode) {
                  d.target.y = centeredNode.y;

                  return d.target.y;
                } else return d.target.y;
              });

            investLink.attr("x1", function(d) {
                if (d.source === centeredNode) {
                  d.source.x = centeredNode.x;

                  return d.source.x;
                } else return d.source.x;
              })
              .attr("y1", function(d) {
                if (d.source === centeredNode) {
                  d.source.y = centeredNode.y;

                  return d.source.y;
                } else return d.source.y;
              })
              .attr("x2", function(d) {
                if (d.target === centeredNode) {
                  d.target.x = centeredNode.x;

                  return d.target.x;
                } else return d.target.x;
              })
              .attr("y2", function(d) {
                if (d.target === centeredNode) {
                  d.target.y = centeredNode.y;

                  return d.target.y;
                } else return d.target.y;
              });

            porucsLink.attr("x1", function(d) {
                if (d.source === centeredNode) {
                  d.source.x = centeredNode.x;

                  return d.source.x;
                } else return d.source.x;
              })
              .attr("y1", function(d) {
                if (d.source === centeredNode) {
                  d.source.y = centeredNode.y;

                  return d.source.y;
                } else return d.source.y;
              })
              .attr("x2", function(d) {
                if (d.target === centeredNode) {
                  d.target.x = centeredNode.x;

                  return d.target.x;
                } else return d.target.x;
              })
              .attr("y2", function(d) {
                if (d.target === centeredNode) {
                  d.target.y = centeredNode.y;

                  return d.target.y;
                } else return d.target.y;
              });

            dataLink.attr("x1", function(d) {
                if (d.source === centeredNode) {
                  d.source.x = centeredNode.x;

                  return d.source.x;
                } else return d.source.x;
              })
              .attr("y1", function(d) {
                if (d.source === centeredNode) {
                  d.source.y = centeredNode.y;

                  return d.source.y;
                } else return d.source.y;
              })
              .attr("x2", function(d) {
                if (d.target === centeredNode) {
                  d.target.x = centeredNode.x;

                  return d.target.x;
                } else return d.target.x;
              })
              .attr("y2", function(d) {
                if (d.target === centeredNode) {
                  d.target.y = centeredNode.y;

                  return d.target.y;
                } else return d.target.y;
              });

            node.attr("cx", function(d, i) {
                if ((d3.select(node)[0][0].data())[i].name === centeredNode.name) {
                  d.x = centeredNode.x;
                  return d.x;
                } else return d.x = d.x;
              })
              .attr("cy", function(d, i) {
                if ((d3.select(node)[0][0].data())[i].name === centeredNode.name) {
                  d.y = centeredNode.y;
                  return d.y;
                } else return d.y = d.y;
              });

            textElement.attr("transform", transformText);

          }

        }

        function determineVisibleNodes() {
          var visibleNodesIndices = [];
          for (var x = 0; x < nodeInit[0].length; x++) {
            if (nodeInit[0][x].style.visibility === "visible") {
              visibleNodesIndices.push(x);
            }
          }

          var visibleNodes = [];
          nodeInit.filter(function(d, i) {
            if (visibleNodesIndices.indexOf(i) > -1)
              visibleNodes.push(d);
          });

          return visibleNodes;
        }

        d3.selectAll('#cb_fund').on('click', function() {
          var visibleNodes = determineVisibleNodes();
          //  Form links for funds.

          if (document.getElementById("cb_fund").checked) {


            var count = 0;
            // drawFundLink();
            d3.selectAll('.fund').style("visibility", function(l) {
              if (visibleNodes.indexOf(l.source) > -1 && visibleNodes.indexOf(l.target) > -1 && this.style.visibility === "hidden") {
                count++;
                return "visible";
              } else
                return "hidden";
            });
            // .classed("visfund", true); 
          }

          if (!document.getElementById("cb_fund").checked) {
            // d3.selectAll(".fund").remove();
            d3.selectAll('.fund').style("visibility", function(l) {
              // if(visibleNodes.indexOf(l.source) > -1 && visibleNodes.indexOf(l.target) > -1 && this.style.visibility === "visible")
              // {
              return "hidden";
              // }
            });

            // .classed("visfund", false);
          }

          if (visibleNodes.length === 0 || (!document.getElementById("cb_individ").checked && !document.getElementById("cb_forpro").checked && !document.getElementById("cb_nonpro").checked && !document.getElementById("cb_gov").checked)) {
            document.getElementById("cb_fund").checked = false;
          }

        });

        d3.selectAll('#cb_invest').on('click', function() {
          var visibleNodes = determineVisibleNodes();

          //  Form links for investments.
          if (document.getElementById("cb_invest").checked) {




            // drawInvestLink();
            d3.selectAll('.invest').style("visibility", function(l) {
              if (visibleNodes.indexOf(l.source) > -1 && visibleNodes.indexOf(l.target) > -1 && this.style.visibility === "hidden") {
                return "visible";
              } else
                return "hidden";
            });

            // .classed("visinvest", true);

          }

          if (!document.getElementById("cb_invest").checked) {
            // d3.selectAll(".invest").remove();
            d3.selectAll('.invest').style("visibility", function(l) {
              // if(visibleNodes.indexOf(l.source) > -1 && visibleNodes.indexOf(l.target) > -1 && this.style.visibility === "visible")
              return "hidden";
            });
            // .classed("visinvest", false);

          }

          if (visibleNodes.length === 0 || (!document.getElementById("cb_individ").checked && !document.getElementById("cb_forpro").checked && !document.getElementById("cb_nonpro").checked && !document.getElementById("cb_gov").checked)) {
            document.getElementById("cb_invest").checked = false;
          }
        });

        d3.selectAll('#cb_porucs').on('click', function() {
          var visibleNodes = determineVisibleNodes();

          //  Form links for partnerships or unidentified collaborations.
          if (document.getElementById("cb_porucs").checked) {


            // drawInvestLink();
            d3.selectAll('.porucs').style("visibility", function(l) {
              if (visibleNodes.indexOf(l.source) > -1 && visibleNodes.indexOf(l.target) > -1 && this.style.visibility === "hidden")
                return "visible";
              else
                return "hidden";
            });
            // .classed("visporucs", true);

          }

          if (!document.getElementById("cb_porucs").checked) {
            // d3.selectAll(".porucs").remove();
            d3.selectAll('.porucs').style("visibility", function(l) {
              // if(visibleNodes.indexOf(l.source) > -1 && visibleNodes.indexOf(l.target) > -1 && this.style.visibility === "visible")
              return "hidden";
            });
            // .classed("visporucs", false);

          }

          if (visibleNodes.length === 0 || (!document.getElementById("cb_individ").checked && !document.getElementById("cb_forpro").checked && !document.getElementById("cb_nonpro").checked && !document.getElementById("cb_gov").checked)) {
            document.getElementById("cb_porucs").checked = false;
          }
        });

        d3.selectAll('#cb_data').on('click', function() {
          var visibleNodes = determineVisibleNodes();

          //  Form links for data.
          if (document.getElementById("cb_data").checked) {


            // drawInvestLink();
            d3.selectAll('.data').style("visibility", function(l) {
              if (visibleNodes.indexOf(l.source) > -1 && visibleNodes.indexOf(l.target) > -1 && this.style.visibility === "hidden")
                return "visible";
              else
                return "hidden";
            });
            // .classed("visdata", true);

          }

          if (!document.getElementById("cb_data").checked) {
            // d3.selectAll(".porucs").remove();
            d3.selectAll('.data').style("visibility", function(l) {

              // if(visibleNodes.indexOf(l.source) > -1 && visibleNodes.indexOf(l.target) > -1 && this.style.visibility === "visible")
              return "hidden";

            });
            // .classed("visdata", false);

          }

          if (visibleNodes.length === 0 || (!document.getElementById("cb_individ").checked && !document.getElementById("cb_forpro").checked && !document.getElementById("cb_nonpro").checked && !document.getElementById("cb_gov").checked)) {
            document.getElementById("cb_data").checked = false;
          }

        });


        d3.selectAll('#cb_individ, #cb_nonpro, #cb_forpro, #cb_gov').on('click', function() {
          //  Variables for visible.

          var fNCArray0v = [];
          var iNCArray0v = [];
          var pcNCArray0v = [];
          var aNCArray0v = [];
          var countIndex0v = [];

          var fNCArray1v = [];
          var iNCArray1v = [];
          var pcNCArray1v = [];
          var aNCArray1v = [];
          var countIndex1v = [];

          var fNCArray2v = [];
          var iNCArray2v = [];
          var pcNCArray2v = [];
          var aNCArray2v = [];
          var countIndex2v = [];

          var fNCArray3v = [];
          var iNCArray3v = [];
          var pcNCArray3v = [];
          var aNCArray3v = [];
          var countIndex3v = [];

          //  Variables for hidden.

          var fNCArray0h = [];
          var iNCArray0h = [];
          var pcNCArray0h = [];
          var aNCArray0h = [];
          var countIndex0h = [];

          var fNCArray1h = [];
          var iNCArray1h = [];
          var pcNCArray1h = [];
          var aNCArray1h = [];
          var countIndex1h = [];

          var fNCArray2h = [];
          var iNCArray2h = [];
          var pcNCArray2h = [];
          var aNCArray2h = [];
          var countIndex2h = [];

          var fNCArray3h = [];
          var iNCArray3h = [];
          var pcNCArray3h = [];
          var aNCArray3h = [];
          var countIndex3h = [];


          if (document.getElementById("cb_individ").checked) {

            d3.selectAll(".node").filter(function(d) {
              if (d.type === "Individual") return this;
            }).style("visibility", "visible");
            //  For funding connections

            countIndex0v = 0;

            filteredNodes.forEach(function(node0v) {
              if (node0v.type === 'Individual') {
                fundingConnections.forEach(function(fundNodeCon0v) {
                  if (node0v === fundNodeCon0v.source || node0v === fundNodeCon0v.target) {
                    fNCArray0v.push(countIndex0v); //  store positions inside of array...
                  }
                  countIndex0v++;
                });
                countIndex0v = 0;
              }
            });

            //  For investing connections

            countIndex0v = 0;

            filteredNodes.forEach(function(node0v) {
              if (node0v.type === 'Individual') {
                investmentConnections.forEach(function(investNodeCon0v) {
                  if (node0v === investNodeCon0v.source || node0v === investNodeCon0v.target) {
                    iNCArray0v.push(countIndex0v); //  store positions inside of array...
                  }
                  countIndex0v++;
                });
                countIndex0v = 0;
              }
            });

            //  For partnerships/collaborations connections

            countIndex0v = 0;

            filteredNodes.forEach(function(node0v) {
              if (node0v.type === 'Individual') {
                collaborationConnections.forEach(function(porucsNodeCon0v) {
                  if (node0v === porucsNodeCon0v.source || node0v === porucsNodeCon0v.target) {
                    pcNCArray0v.push(countIndex0v); //  store positions inside of array...
                  }
                  countIndex0v++;
                });
                countIndex0v = 0;
              }
            });

            //  For data connections

            countIndex0 = 0;

            filteredNodes.forEach(function(node0) {
              if (node0.type === 'Individual') {
                dataConnections.forEach(function(dataNodeCon0) {
                  if (node0 === dataNodeCon0.source || node0 === dataNodeCon0.target) {
                    aNCArray0v.push(countIndex0); //  store positions inside of array...
                  }
                  countIndex0++;
                });
                countIndex0 = 0;
              }
            });

          }
          if (!document.getElementById("cb_individ").checked)

          {

            d3.selectAll(".node").filter(function(d) {
              if (d.type === "Individual") return this;
            }).style("visibility", "hidden");

            //  For funding connections

            countIndex0h = 0;

            filteredNodes.forEach(function(node0h) {
              if (node0h.type === 'Individual') {
                fundingConnections.forEach(function(fundNodeCon0h) {
                  if (node0h === fundNodeCon0h.source || node0h === fundNodeCon0h.target) {
                    fNCArray0h.push(countIndex0h); //  store positions inside of array...
                  }
                  countIndex0h++;
                });
                countIndex0h = 0;
              }
            });

            //  For investing connections

            countIndex0h = 0;

            filteredNodes.forEach(function(node0h) {
              if (node0h.type === 'Individual') {
                investmentConnections.forEach(function(investNodeCon0h) {
                  if (node0h === investNodeCon0h.source || node0h === investNodeCon0h.target) {
                    iNCArray0h.push(countIndex0h); //  store positions inside of array...
                  }
                  countIndex0h++;
                });
                countIndex0h = 0;
              }
            });

            //  For partnerships/collaborations connections

            countIndex0h = 0;

            filteredNodes.forEach(function(node0h) {
              if (node0h.type === 'Individual') {
                collaborationConnections.forEach(function(porucsNodeCon0h) {
                  if (node0h === porucsNodeCon0h.source || node0h === porucsNodeCon0h.target) {
                    pcNCArray0h.push(countIndex0h); //  store positions inside of array...
                  }
                  countIndex0h++;
                });
                countIndex0h = 0;
              }
            });

            //  For data connections

            countIndex0h = 0;

            filteredNodes.forEach(function(node0h) {
              if (node0h.type === 'Individual') {
                dataConnections.forEach(function(dataNodeCon0h) {
                  if (node0h === dataNodeCon0h.source || node0h === dataNodeCon0h.target) {
                    aNCArray0h.push(countIndex0h); //  store positions inside of array...
                  }
                  countIndex0h++;
                });
                countIndex0h = 0;
              }
            });
          }

          if (document.getElementById("cb_nonpro").checked) {
            d3.selectAll(".node").filter(function(d) {
              if (d.type === "Non-Profit") return this;
            }).style("visibility", "visible");

            //  For funding connections

            countIndex1v = 0;

            filteredNodes.forEach(function(node1v) {
              if (node1v.type === 'Non-Profit') {
                fundingConnections.forEach(function(fundNodeCon1v) {
                  if ((node1v === fundNodeCon1v.source || node1v === fundNodeCon1v.target) && fNCArray1v.indexOf(countIndex1v) === -1) {
                    fNCArray1v.push(countIndex1v); //  store positions inside of array...
                  }
                  countIndex1v++;
                });
                countIndex1v = 0;
              }
            });

            //  For investing connections

            countIndex1v = 0;

            filteredNodes.forEach(function(node1v) {
              if (node1v.type === 'Non-Profit') {
                investmentConnections.forEach(function(investNodeCon1v) {
                  if ((node1v === investNodeCon1v.source || node1v === investNodeCon1v.target) && iNCArray1v.indexOf(countIndex1v) === -1) {
                    iNCArray1v.push(countIndex1v); //  store positions inside of array...
                  }
                  countIndex1v++;
                });
                countIndex1v = 0;
              }
            });

            //  For partnerships/collaborations connections

            countIndex1v = 0;

            filteredNodes.forEach(function(node1v) {
              if (node1v.type === 'Non-Profit') {
                collaborationConnections.forEach(function(porucsNodeCon1v) {
                  if ((node1v === porucsNodeCon1v.source || node1v === porucsNodeCon1v.target) && pcNCArray1v.indexOf(countIndex1v) === -1) {
                    pcNCArray1v.push(countIndex1v); //  store positions inside of array...
                  }
                  countIndex1v++;
                });
                countIndex1v = 0;
              }
            });

            //  For data connections

            countIndex1v = 0;

            filteredNodes.forEach(function(node1v) {
              if (node1v.type === 'Non-Profit') {
                dataConnections.forEach(function(dataNodeCon1v) {
                  if ((node1v === dataNodeCon1v.source || node1v === dataNodeCon1v.target) && aNCArray1v.indexOf(countIndex1v) === -1) {
                    aNCArray1v.push(countIndex1v); //  store positions inside of array...
                  }
                  countIndex1v++;
                });
                countIndex1v = 0;
              }
            });


          }
          if (!document.getElementById("cb_nonpro").checked) {
            d3.selectAll(".node").filter(function(d) {
              if (d.type === "Non-Profit") return this;
            }).style("visibility", "hidden");


            //  For funding connections

            countIndex1h = 0;

            filteredNodes.forEach(function(node1h) {
              if (node1h.type === 'Non-Profit') {
                fundingConnections.forEach(function(fundNodeCon1h) {
                  if ((node1h === fundNodeCon1h.source || node1h === fundNodeCon1h.target) && fNCArray1h.indexOf(countIndex1h) === -1) {
                    fNCArray1h.push(countIndex1h); //  store positions inside of array...
                  }
                  countIndex1h++;
                });
                countIndex1h = 0;
              }
            });

            //  For investing connections

            countIndex1h = 0;

            filteredNodes.forEach(function(node1h) {
              if (node1h.type === 'Non-Profit') {
                investmentConnections.forEach(function(investNodeCon1h) {
                  if ((node1h === investNodeCon1h.source || node1h === investNodeCon1h.target) && iNCArray1h.indexOf(countIndex1h) === -1) {
                    iNCArray1h.push(countIndex1h); //  store positions inside of array...
                  }
                  countIndex1h++;
                });
                countIndex1h = 0;
              }
            });

            //  For partnerships/collaborations connections

            countIndex1h = 0;

            filteredNodes.forEach(function(node1h) {
              if (node1h.type === 'Non-Profit') {
                collaborationConnections.forEach(function(porucsNodeCon1h) {
                  if ((node1h === porucsNodeCon1h.source || node1h === porucsNodeCon1h.target) && pcNCArray1h.indexOf(countIndex1h) === -1) {
                    pcNCArray1h.push(countIndex1h); //  store positions inside of array...
                  }
                  countIndex1h++;
                });
                countIndex1h = 0;
              }
            });

            //  For data connections

            countIndex1h = 0;

            filteredNodes.forEach(function(node1h) {
              if (node1h.type === 'Non-Profit') {
                dataConnections.forEach(function(dataNodeCon1h) {
                  if ((node1h === dataNodeCon1h.source || node1h === dataNodeCon1h.target) && aNCArray1h.indexOf(countIndex1h) === -1) {
                    aNCArray1h.push(countIndex1h); //  store positions inside of array...
                  }
                  countIndex1h++;
                });
                countIndex1h = 0;
              }
            });



          }


          if (document.getElementById("cb_forpro").checked) {
            d3.selectAll(".node").filter(function(d) {
              if (d.type === "For-Profit") return this;
            }).style("visibility", "visible");


            //  For funding connections

            countIndex2v = 0;

            filteredNodes.forEach(function(node2v) {
              if (node2v.type === 'For-Profit') {
                fundingConnections.forEach(function(fundNodeCon2v) {
                  if ((node2v === fundNodeCon2v.source || node2v === fundNodeCon2v.target) && fNCArray2v.indexOf(countIndex2v) === -1) {
                    fNCArray2v.push(countIndex2v); //  store positions inside of array...
                  }
                  countIndex2v++;
                });
                countIndex2v = 0;
              }
            });

            //  For investing connections

            countIndex2v = 0;

            filteredNodes.forEach(function(node2v) {
              if (node2v.type === 'For-Profit') {
                investmentConnections.forEach(function(investNodeCon2v) {
                  if ((node2v === investNodeCon2v.source || node2v === investNodeCon2v.target) && iNCArray2v.indexOf(countIndex2v) === -1) {
                    iNCArray2v.push(countIndex2v); //  store positions inside of array...
                  }
                  countIndex2v++;
                });
                countIndex2v = 0;
              }
            });

            //  For partnerships/collaborations connections

            countIndex2v = 0;

            filteredNodes.forEach(function(node2v) {
              if (node2v.type === 'For-Profit') {
                collaborationConnections.forEach(function(porucsNodeCon2v) {
                  if ((node2v === porucsNodeCon2v.source || node2v === porucsNodeCon2v.target) && pcNCArray2v.indexOf(countIndex2v) === -1) {
                    pcNCArray2v.push(countIndex2v); //  store positions inside of array...
                  }
                  countIndex2v++;
                });
                countIndex2v = 0;
              }
            });

            //  For data connections

            countIndex2v = 0;

            filteredNodes.forEach(function(node2v) {
              if (node2v.type === 'For-Profit') {
                dataConnections.forEach(function(dataNodeCon2v) {
                  if ((node2v === dataNodeCon2v.source || node2v === dataNodeCon2v.target) && aNCArray2v.indexOf(countIndex2v) === -1) {
                    aNCArray2v.push(countIndex2v); //  store positions inside of array...
                  }
                  countIndex2v++;
                });
                countIndex2v = 0;
              }
            });

          }
          if (!document.getElementById("cb_forpro").checked)

          {
            d3.selectAll(".node").filter(function(d) {
              if (d.type === "For-Profit") return this;
            }).style("visibility", "hidden");

            //  For funding connections

            countIndex2h = 0;

            filteredNodes.forEach(function(node2h) {
              if (node2h.type === 'For-Profit') {
                fundingConnections.forEach(function(fundNodeCon2h) {
                  if ((node2h === fundNodeCon2h.source || node2h === fundNodeCon2h.target) && fNCArray2h.indexOf(countIndex2h) === -1) {
                    fNCArray2h.push(countIndex2h); //  store positions inside of array...
                  }
                  countIndex2h++;
                });
                countIndex2h = 0;
              }
            });

            //  For investing connections

            countIndex2h = 0;

            filteredNodes.forEach(function(node2h) {
              if (node2h.type === 'For-Profit') {
                investmentConnections.forEach(function(investNodeCon2h) {
                  if ((node2h === investNodeCon2h.source || node2h === investNodeCon2h.target) && iNCArray2h.indexOf(countIndex2h) === -1) {
                    iNCArray2h.push(countIndex2h); //  store positions inside of array...
                  }
                  countIndex2h++;
                });
                countIndex2h = 0;
              }
            });



            //  For partnerships/collaborations connections

            countIndex2h = 0;

            filteredNodes.forEach(function(node2h) {
              if (node2h.type === 'For-Profit') {
                collaborationConnections.forEach(function(porucsNodeCon2h) {
                  if ((node2h === porucsNodeCon2h.source || node2h === porucsNodeCon2h.target) && pcNCArray2h.indexOf(countIndex2h) === -1) {
                    pcNCArray2h.push(countIndex2h); //  store positions inside of array...
                  }
                  countIndex2h++;
                });
                countIndex2h = 0;
              }
            });

            //  For data connections

            countIndex2h = 0;

            filteredNodes.forEach(function(node2h) {
              if (node2h.type === 'For-Profit') {
                dataConnections.forEach(function(dataNodeCon2h) {
                  if ((node2h === dataNodeCon2h.source || node2h === dataNodeCon2h.target) && aNCArray2h.indexOf(countIndex2h) === -1) {
                    aNCArray2h.push(countIndex2h); //  store positions inside of array...
                  }
                  countIndex2h++;
                });
                countIndex2h = 0;
              }
            });


          }

          if (document.getElementById("cb_gov").checked) {
            d3.selectAll(".node").filter(function(d) {
              if (d.type === "Government") return this;
            }).style("visibility", "visible");

            // For funding connections

            countIndex3v = 0;

            filteredNodes.forEach(function(node3v) {
              if (node3v.type === 'Government') {
                fundingConnections.forEach(function(fundNodeCon3v) {
                  if ((node3v === fundNodeCon3v.source || node3v === fundNodeCon3v.target) && fNCArray3v.indexOf(countIndex3v) === -1) {
                    fNCArray3v.push(countIndex3v); //  store positions inside of array...
                  }
                  countIndex3v++;
                });
                countIndex3v = 0;
              }
            });




            //  For investing connections

            countIndex3v = 0;

            filteredNodes.forEach(function(node3v) {
              if (node3v.type === 'Government') {
                investmentConnections.forEach(function(investNodeCon3v) {
                  if ((node3v === investNodeCon3v.source || node3v === investNodeCon3v.target) && iNCArray3v.indexOf(countIndex3v) === -1) {
                    iNCArray3v.push(countIndex3v); //  store positions inside of array...
                  }
                  countIndex3v++;
                });
                countIndex3v = 0;
              }
            });



            //  For partnerships/collaborations connections

            countIndex3v = 0;

            filteredNodes.forEach(function(node3v) {
              if (node3v.type === 'Government') {
                collaborationConnections.forEach(function(porucsNodeCon3v) {
                  if ((node3v === porucsNodeCon3v.source || node3v === porucsNodeCon3v.target) && pcNCArray3v.indexOf(countIndex3v) === -1) {
                    pcNCArray3v.push(countIndex3v); //  store positions inside of array...
                  }
                  countIndex3v++;
                });
                countIndex3v = 0;
              }
            });



            //  For data connections

            countIndex3v = 0;

            filteredNodes.forEach(function(node3v) {
              if (node3v.type === 'Government') {
                dataConnections.forEach(function(dataNodeCon3v) {
                  if ((node3v === dataNodeCon3v.source || node3v === dataNodeCon3v.target) && aNCArray3v.indexOf(countIndex3v) === -1) {
                    aNCArray3v.push(countIndex3v); //  store positions inside of array...
                  }
                  countIndex3v++;
                });
                countIndex3v = 0;
              }
            });

          }
          if (!document.getElementById("cb_gov").checked) {
            d3.selectAll(".node").filter(function(d) {
              if (d.type === "Government") return this;
            }).style("visibility", "hidden");
            //  For funding connections

            countIndex3h = 0;

            filteredNodes.forEach(function(node3h) {
              if (node3h.type === 'Government') {
                fundingConnections.forEach(function(fundNodeCon3h) {
                  if ((node3h === fundNodeCon3h.source || node3h === fundNodeCon3h.target) && fNCArray3h.indexOf(countIndex3h) === -1) {
                    fNCArray3h.push(countIndex3h); //  store positions inside of array...
                  }
                  countIndex3h++;
                });
                countIndex3h = 0;
              }
            });

            //  For investing connections

            countIndex3h = 0;

            filteredNodes.forEach(function(node3h) {
              if (node3h.type === 'Government') {
                investmentConnections.forEach(function(investNodeCon3h) {
                  if ((node3h === investNodeCon3h.source || node3h === investNodeCon3h.target) && iNCArray3h.indexOf(countIndex3h) === -1) {
                    iNCArray3h.push(countIndex3h); //  store positions inside of array...
                  }
                  countIndex3h++;
                });
                countIndex3h = 0;
              }
            });

            //  For partnerships/collaborations connections

            countIndex3h = 0;

            filteredNodes.forEach(function(node3h) {
              if (node3h.type === 'Government') {
                collaborationConnections.forEach(function(porucsNodeCon3h) {
                  if ((node3h === porucsNodeCon3h.source || node3h === porucsNodeCon3h.target) && pcNCArray3h.indexOf(countIndex3h) === -1) {
                    pcNCArray3h.push(countIndex3h); //  store positions inside of array...
                  }
                  countIndex3h++;
                });
                countIndex3h = 0;
              }
            });

            //  For data connections

            countIndex3h = 0;

            filteredNodes.forEach(function(node3h) {
              if (node3h.type === 'Government') {
                dataConnections.forEach(function(dataNodeCon3h) {
                  if ((node3h === dataNodeCon3h.source || node3h === dataNodeCon3h.target) && aNCArray3h.indexOf(countIndex3h) === -1) {
                    aNCArray3h.push(countIndex3h); //  store positions inside of array...
                  }
                  countIndex3h++;
                });
                countIndex3h = 0;
              }
            });

            // return;
          }
          //  Merge and eliminate dupllicate elements

          function merge() {
            var args = arguments;
            var hash = {};
            var arr = [];
            for (var i = 0; i < args.length; i++) {
              for (var j = 0; j < args[i].length; j++) {
                if (hash[args[i][j]] !== true) {
                  arr[arr.length] = args[i][j];
                  hash[args[i][j]] = true;
                }
              }
            }
            return arr;
          }

          var fNCArrayV = [];
          var iNCArrayV = [];
          var pcNCArrayV = [];
          var aNCArrayV = [];

          if (fNCArray0v.length !== 0)
            fNCArrayV = merge(fNCArrayV, fNCArray0v);
          if (fNCArray1v.length !== 0)
            fNCArrayV = fNCArrayV = merge(fNCArrayV, fNCArray1v);
          if (fNCArray2v.length !== 0)
            fNCArrayV = merge(fNCArrayV, fNCArray2v);
          if (fNCArray3v.length !== 0)
            fNCArrayV = merge(fNCArrayV, fNCArray3v);

          if (iNCArray0v.length !== 0)
            iNCArrayV = merge(iNCArrayV, iNCArray0v);
          if (iNCArray1v.length !== 0)
            iNCArrayV = merge(iNCArrayV, iNCArray1v);
          if (iNCArray2v.length !== 0)
            iNCArrayV = merge(iNCArrayV, iNCArray2v);
          if (iNCArray3v.length !== 0)
            iNCArrayV = merge(iNCArrayV, iNCArray3v);

          if (pcNCArray0v.length !== 0)
            pcNCArrayV = merge(pcNCArrayV, pcNCArray0v);
          if (pcNCArray1v.length !== 0)
            pcNCArrayV = merge(pcNCArrayV, pcNCArray1v);
          if (pcNCArray2v.length !== 0)
            pcNCArrayV = merge(pcNCArrayV, pcNCArray2v);
          if (pcNCArray3v.length !== 0)
            pcNCArrayV = merge(pcNCArrayV, pcNCArray3v);

          if (aNCArray0v.length !== 0)
            aNCArrayV = merge(aNCArrayV, aNCArray0v);
          if (aNCArray1v.length !== 0)
            aNCArrayV = merge(aNCArrayV, aNCArray1v);
          if (aNCArray2v.length !== 0)
            aNCArrayV = merge(aNCArrayV, aNCArray2v);
          if (aNCArray3v.length !== 0)
            aNCArrayV = merge(aNCArrayV, aNCArray3v);

          //  hidden

          var fNCArrayH = [];
          var iNCArrayH = [];
          var pcNCArrayH = [];
          var aNCArrayH = [];

          if (fNCArray0h.length !== 0)
            fNCArrayH = merge(fNCArrayH, fNCArray0h);
          if (fNCArray1h.length !== 0)
            fNCArrayH = merge(fNCArrayH, fNCArray1h);
          if (fNCArray2h.length !== 0)
            fNCArrayH = merge(fNCArrayH, fNCArray2h);
          if (fNCArray3h.length !== 0)
            fNCArrayH = merge(fNCArrayH, fNCArray3h);

          if (iNCArray0h.length !== 0)
            iNCArrayH = merge(iNCArrayH, iNCArray0h);
          if (iNCArray1h.length !== 0)
            iNCArrayH = merge(iNCArrayH, iNCArray1h);
          if (iNCArray2h.length !== 0)
            iNCArrayH = merge(iNCArrayH, iNCArray2h);
          if (iNCArray3h.length !== 0)
            iNCArrayH = merge(iNCArrayH, iNCArray3h);

          if (pcNCArray0h.length !== 0)
            pcNCArrayH = merge(pcNCArrayH, pcNCArray0h);
          if (pcNCArray1h.length !== 0)
            pcNCArrayH = merge(pcNCArrayH, pcNCArray1h);
          if (pcNCArray2h.length !== 0)
            pcNCArrayH = merge(pcNCArrayH, pcNCArray2h);
          if (pcNCArray3h.length !== 0)
            pcNCArrayH = merge(pcNCArrayH, pcNCArray3h);

          if (aNCArray0h.length !== 0)
            aNCArrayH = merge(aNCArrayH, aNCArray0h);
          if (aNCArray1h.length !== 0)
            aNCArrayH = merge(aNCArrayH, aNCArray1h);
          if (aNCArray2h.length !== 0)
            aNCArrayH = merge(aNCArrayH, aNCArray2h);
          if (aNCArray3h.length !== 0)
            aNCArrayH = merge(aNCArrayH, aNCArray3h);

          var alreadyHFundLinks = [];
          var alreadyHInvestLinks = [];
          var alreadyHPorucsLinks = [];
          var alreadyHDataLinks = [];

          if (!document.getElementById("cb_fund").checked) {
            fundLink.filter(function(d, i) {
              if (fundLink[0][i].style.visibility === "hidden") {
                alreadyHFundLinks.push(i);
              }
            });


          }

          if (!document.getElementById("cb_invest").checked) {
            investLink.filter(function(d, i) {
              if (investLink[0][i].style.visibility === "hidden") {
                alreadyHInvestLinks.push(i);
              }
            });

            //
          }

          if (!document.getElementById("cb_porucs").checked) {
            porucsLink.filter(function(d, i) {
              if (porucsLink[0][i].style.visibility === "hidden") {
                alreadyHPorucsLinks.push(i);
              }
            });

            //
          }

          if (!document.getElementById("cb_data").checked) {
            dataLink.filter(function(d, i) {
              if (dataLink[0][i].style.visibility === "hidden") {
                alreadyHDataLinks.push(i);
              }
            });


          }

          d3.selectAll('.fund').style('visibility', function(l, i) {
            //  If the index of the funding line equals to the funding connection index...
            if (fNCArrayV.indexOf(i) > -1) {
              return "visible";
            } else {
              return "hidden";
            }

          });

          d3.selectAll('.invest').style('visibility', function(l, i) {
            //  If the index of the funding line equals to the funding connection index...
            if (iNCArrayV.indexOf(i) > -1) {

              return "visible";
            } else {
              return "hidden";
            }
          });


          d3.selectAll('.porucs').style('visibility', function(l, i) {
            //  If the index of the funding line equals to the funding connection index...
            if (pcNCArrayV.indexOf(i) > -1) {

              return "visible";
            } else {
              return "hidden";
            }

          });


          d3.selectAll('.data').style('visibility', function(l, i) {
            //  If the index of the funding line equals to the funding connection index...
            if (aNCArrayV.indexOf(i) > -1) {
              return "visible";
            } else {
              return "hidden";
            }
          });

          d3.selectAll('.fund').style('visibility', function(l, i) {
            //  If the index of the funding line equals to the funding connection index...
            if (fNCArrayH.indexOf(i) > -1 || alreadyHFundLinks.indexOf(i) > -1) {
              return "hidden";
            } else {
              return "visible";
            }

          });

          d3.selectAll('.invest').style('visibility', function(l, i) {
            //  If the index of the funding line equals to the funding connection index...
            if (iNCArrayH.indexOf(i) > -1 || alreadyHInvestLinks.indexOf(i) > -1) {

              return "hidden";
            } else {
              return "visible";
            }
          });

          d3.selectAll('.porucs').style('visibility', function(l, i) {
            //  If the index of the funding line equals to the funding connection index...
            if (pcNCArrayH.indexOf(i) > -1 || alreadyHPorucsLinks.indexOf(i) > -1) {

              return "hidden";
            } else {
              return "visible";
            }
          });

          d3.selectAll('.data').style('visibility', function(l, i) {
            //  If the index of the funding line equals to the funding connection index...
            if (aNCArrayH.indexOf(i) > -1 || alreadyHDataLinks.indexOf(i) > -1) {
              return "hidden";
            } else {
              return "visible";
            }
          });

          var countFund = 0;
          for (var x = 0; x < fundLink[0].length; x++) {
            if (fundLink[0][x].style.visibility === "hidden") {
              countFund++;
            }
          }

          var countInvest = 0;
          for (var x = 0; x < investLink[0].length; x++) {
            if (investLink[0][x].style.visibility === "hidden") {
              countInvest++;
            }
          }

          var countPorucs = 0;
          for (var x = 0; x < porucsLink[0].length; x++) {
            if (porucsLink[0][x].style.visibility === "hidden") {
              countPorucs++;
            }
          }

          var countData = 0;
          for (var x = 0; x < dataLink[0].length; x++) {
            if (dataLink[0][x].style.visibility === "hidden") {
              countData++;
            }
          }


          // If all funding connections are hidden
          if (countFund === fundLink[0].length)
            if (document.getElementById("cb_fund").checked) {
              document.getElementById("cb_fund").checked = false;
              // document.getElementById("cb_fund").disabled = true;
            }
            //  If some or all funding connections are shown
          if (countFund !== fundLink[0].length)
            if (!document.getElementById("cb_fund").checked) {
              document.getElementById("cb_fund").checked = true;
              // document.getElementById("cb_fund").disabled = false;
            }
            // If all investing connections are hidden
          if (countInvest === investLink[0].length)
            if (document.getElementById("cb_invest").checked) {
              document.getElementById("cb_invest").checked = false;
              // document.getElementById("cb_invest").disabled = true;
            }
            //  If some or all investing connections are shown
          if (countInvest !== investLink[0].length)
            if (!document.getElementById("cb_invest").checked) {
              document.getElementById("cb_invest").checked = true;
              // document.getElementById("cb_invest").disabled = false;
            }
            // If all collaboration connections are hidden
          if (countPorucs === porucsLink[0].length)
            if (document.getElementById("cb_porucs").checked) {
              document.getElementById("cb_porucs").checked = false;
              // document.getElementById("cb_porucs").disabled = true;
            }
            //  If some or all collaboration connections are shown
          if (countPorucs !== porucsLink[0].length)
            if (!document.getElementById("cb_porucs").checked) {
              document.getElementById("cb_porucs").checked = true;
              // document.getElementById("cb_porucs").disabled = false;
            }
            // If all data connections are hidden
          if (countData === dataLink[0].length)
            if (document.getElementById("cb_data").checked) {
              document.getElementById("cb_data").checked = false;
              // document.getElementById("cb_data").disabled = true;
            }
            //  If some or all data connections are shown
          if (countData !== dataLink[0].length)
            if (!document.getElementById("cb_data").checked) {
              document.getElementById("cb_data").checked = true;
              // document.getElementById("cb_data").disabled = false;
            }



        });

        d3.selectAll('#cb_emp, #cb_numtwit').on('click', function() {
          if (document.getElementById("cb_emp").checked) {
            node.transition()
              .duration(350)
              .delay(0).attr("r", function(d) {
                if (d.employees !== null) return empScale(d.employees);
                else return "7";
              });
            textElement.attr('transform', function(d) {
              if (d.employees !== null) return translation(0, -(empScale(d.employees)));
              else return translation(0, -7);
            });
          }

          if (document.getElementById("cb_numtwit").checked) {
            node.transition()
              .duration(350)
              .delay(0).attr("r", function(d) {
                if (d.followers !== null) {
                  if (d.followers > 1000000) {
                    return "50";
                  } else {
                    return twitScale(d.followers);
                  }
                } else
                  return "7";
              });
            textElement.attr('transform', function(d) {
              if (d.followers !== null) {
                return translation(0, -(twitScale(d.followers)));
              } else
                return translation(0, -7);
            });
          }
        });

        d3.select('svg').on('click', function() {
          var m = d3.mouse(this);

          if (clearResetFlag === 1) {
            d3.event.preventDefault();
            offNode();
            d3.selectAll('g').classed("fixed", function(d) {
              d.fixed = false;
            });
            d3.selectAll('g').call(drag);
            centeredNode = jQuery.extend(true, {}, {});


            var force = d3.layout.force()
              .nodes(rawNodes)
              .size([width, height])
              .links(rawConnections)
              .linkStrength(0)
              .charge(function(d) {
                // if (d.employees !== null)
                //   return -5 * empScale(parseInt(d.employees));
                // else
                //   return -50;
                if (d.render === 1) {
                  if (d.employees !== null)
                    return -6 * empScale(d.employees);
                  else
                    return -25;
                } else
                  return 0;
              })
              .linkDistance(50)

            .on("tick", tick)
              .start();
            for (var i = 0; i < 150; ++i) {
              force.tick();
            }
            
          }
          clearResetFlag = 1;
        });

      });
    }
    // drawGraph();

  function drawMap() {
    var width = 960,
      height = 500;


    var projection = d3.geo.albers()
      .scale(1000)
      .translate([width / 2 - 40, height / 2 + 30]);

    var path = d3.geo.path()
      .projection(projection);

    var svg = d3.select(".content").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("id", "map");

    d3.json("../data/us.json", function(error, us) {
      svg.insert("path", ".graticule")
        .datum(topojson.feature(us, us.objects.land))
        .attr("class", "land")
        .attr("d", path);

      svg.insert("path", ".graticule")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) {
          return a !== b;
        }))
        .attr("class", "state-boundary")
        .attr("d", path);


      var locations = {};

      d3.json("../data/civicgeo.json", function(error, json) {
        console.log("asdasd")
        console.log(error)
        if (error) return console.warn(error);
        data = json;

        data.nodes.forEach(function(d) {
          if (d.coordinates == null)
            return
          d.coordinates.forEach(function(coordinate) {

            key = coordinate[0] + ":" + coordinate[1]
            if (key in locations) {
              locations[key] ++;
            } else {
              locations[key] = 1
            }
          });
        });


        var maxVal = 0
        locationData = [];
        for (var loc in locations) {
          var d = {};
          coor = loc.split(":");
          d.val = locations[loc];
          d.lat = coor[0];
          d.lon = coor[1];
          locationData[locationData.length] = d;

          if (d.val > maxVal) {
            maxVal = d.val;
          }
        }

        radiusScale = d3.scale.linear().domain([0, maxVal]).range([3, 10]);
        svg.selectAll("circle")
          .data(locationData)
          .enter()
          .append("circle")
          .attr("cx", function(d) {
            return projection([d.lon, d.lat])[0];
          })
          .attr("cy", function(d) {
            return projection([d.lon, d.lat])[1];
          })
          .attr("r", function(d) {
            return radiusScale(d.val);
          })
          .style("fill", "red");
      });
    });

    d3.select(self.frameElement).style("height", height + "px");

  }

  if (current_view == 'map') {
    drawMap();
    document.getElementById('cb_mapview').checked = true;
    document.getElementById('cb_networkview').checked = false;
  } else if (current_view == 'network') {
    drawGraph();
    document.getElementById('cb_mapview').checked = false;
    document.getElementById('cb_networkview').checked = true;
  } else {
    drawGraph();
    document.getElementById('cb_mapview').checked = false;
    document.getElementById('cb_networkview').checked = true;
  }

  d3.selectAll('#cb_networkview').on('click', function() {
    if (document.getElementById('cb_networkview').checked) {
      drawGraph();
      var map = document.getElementById('map');
      map.parentNode.removeChild(map);
    }
  });

  d3.selectAll('#cb_mapview').on('click', function() {
    if (document.getElementById('cb_mapview').checked) {
      var network = document.getElementById('network');
      network.parentNode.removeChild(network);
      drawMap();
    }
  });


// })();
