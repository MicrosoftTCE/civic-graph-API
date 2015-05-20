var nodeInit;
var fundLink;
var fundingConnections;
var porucsLink;


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
        // var fundingConnections;
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

            var rawNodes = graph.nodes;  //intercept location.
            var fundingConnections = graph.funding_connections;
            var investmentConnections = graph.investment_connections;
            var collaborationConnections = graph.collaboration_connections;
            var dataConnections = graph.data_connections;
            var rawConnections = fundingConnections
                .concat(investmentConnections)
                .concat(collaborationConnections)
                .concat(dataConnections);

            var filteredNodes = rawNodes;

            /*
            // Check to see if nodes are undefined.
            // http://stackoverflow.com/a/29605668
            rawConnections.forEach(function(link, index, list) {
                    if (typeof graph.nodes[link.source] === 'undefined') {
                        console.log('undefined source', link);
                    }
                    if (typeof graph.nodes[link.target] === 'undefined') {
                        console.log('undefined target', link);
                    }
                });
            */

            var force = d3.layout.force()
                .nodes(rawNodes)
                .size([width, height])
                .links(rawConnections)
                .linkStrength(0)
                .charge(function(d) {
                    if (d.employees !== null)
                        return -6 * empScale(d.employees);
                    else
                        return -25;
                })
                .linkDistance(50)

            var drag = force.drag()
                .on("dragstart", drag)
                .on("drag", drag)
                .on("dragend", dragend);

            //  FUNDINGS
            fundLink = svg.selectAll(".fund")
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
            porucsLink = svg.selectAll(".porucs")
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

            nodeInit = svg.selectAll(".node")
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
                        if (d.employees !== null)
                            return -6 * empScale(d.employees);
                        else
                            return -25;
                    })
                    .linkDistance(50)

                .on("tick", tick)
                    .start();
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


                //do it here
                //



                if (d.location !== null) {
                    s += '<br/>' + '<h6> ' + 'Location:  ' + '</h6>';
                    var locationArray= d.location;

                    if (locationArray.length > 1) {
                        var locationArr = [];
                        s += '<br/> <h5><ul>';
                        locationArray.forEach(function(loc) {
                            locationArr.push(loc.location);

                        });
                        for (var count = 0; count < locationArr.length; count++) {
                            s += '<li style="display:block;">' + '<h5><a class="click-location" style="cursor:pointer;">' + locationArr[count] + '</h5></a>' + '</li>';
                        }
                    }
                    else {
                        locationArray.forEach(function(loc) {
                            locString = loc.location;

                            s += '<h5><ul>'
                            s += '<li style="display:inline-block;">' + '<h5><a class="click-location" style="cursor:pointer;">' + locString + '</h5></a>' + '</li>';
                        });
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
                    add_input_locations(0);
                });


                //To split the location string into different fields(city, state and country field)
                $( ".webform-content" ).on( "input", ".locations", function() {
                    var string = $(this).val();
                    var splitString = string.split(",");
                    $(this).val(splitString[0]);
                    input1 = $(this).siblings("#state");
                    input2 = $(this).siblings("#country");

                    //make an ajax call to get the state and country code on select of a location.
                    d3.json("/cities", function(error, cities){
                        var cityNode = cities.nodes;
                        for (var i =0; i <cityNode.length; i++) {
                            var city = cityNode[i];
                            if(city.City_Name == splitString[0]) {
                                if(splitString.length === 2) {
                                    input1.val(city.State_Code);
                                }
                                if(splitString.length === 3) {
                                    input1.val(city.State_Code);
                                    input2.val(city.Country_Code);
                                }
                            }
                        }
                    });
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
                    formObject.location = [];
                    d3.selectAll('.locations').filter(function(d) {
                        if (this.value !== "") {
                            var city = this.value;
                            var state = $(this).siblings("#state").val();
                            var country = $(this).siblings("#country").val();
                            if(city && state && country) {
                                formObject.location.push(city + ',' + ' ' +  state + ',' + ' ' + country);
                            } else {
                                formObject.location.push(city + ',' + ' ' +  state);
                            }
                        }
                    });
                    if(formObject.location.length === 0) {
                        formObject.location = null;
                    }

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

                    s = '<h2 id="webform-head">Information</h2><hr/><div class="webform-content"><div class="input-control text" data-role="input-control"><input type="text" name="name" id="name" placeholder="Name of Entity"/></div><h3 class="form-header">Entity Type</h3><div class="webform-entities"><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_forpro" type="radio" name="entitytype" value="For-Profit" checked="checked"/><span class="check"></span><h4 class="webform-labels">For-Profit</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_nonpro" type="radio" name="entitytype" value="Non-Profit"/><span class="check"></span><h4 class="webform-labels">Non-Profit</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_gov" type="radio" name="entitytype" value="Government"/><span class="check"></span><h4 class="webform-labels">Government</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_individs" type="radio" name="entitytype" value="Individual"/><span class="check"></span><h4 class="webform-labels">Individual</h4></label></div></div><div id="location-0" class="input-control text" data-role="input-control"><input type="text" name="location" class="locations" id="location" placeholder="City" /></div>';
                    // d3.select("#expense").on("keyup", function() {
                    //     add_input_exp(counterE);
                    // });
                    //
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

                    if( formObject.location !== null) {
                        var location = formObject.location;
                        for(var i=0; i<location.length; i++) {
                            if(i === 0) {
                                d3.select('#location-' + i + ' input[name="location"]').on('keyup', null);
                                d3.select('#location-' + i + ' input[name="location"]').text(function(e) {
                                    this.value = location[i];
                                    this.disabled = true;
                                });
                            } else {
                                $("#location-" + (i-1)).after('<div id="location-' + i + '" class="input-control text" data-role="input-control"><input type="text" name="location" class="locations" id="location" placeholder="City" /></div>');
                                d3.select('#location-' + i + ' input[name="location"]').on('keyup', null);
                                d3.select('#location-' + i + ' input[name="location"]').text(function(e) {
                                    this.value = location[i];
                                    this.disabled = true;
                                });
                            }
                        }

                        d3.select('#location-' + location.length + ' input[name="location"]').on('keyup', function() {
                            add_input_loc(location.length);
                        }).style("margin-top", "10px");
                    }

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

            function add_input_locations(counterJ) {
                if ($('#location-' + counterJ + ' input[name="location"]').val() !== "") {
                    d3.select('#location-' + counterJ + ' input[name="location"]').on('keyup', function (){
                        preFillLocation(this.value);
                    });
                    counterJ++;

                    $("#location-" + (counterJ - 1)).after('<div id="location-' + counterJ + '" class="input-control text" data-role="input-control"><input type="text" name="location" id="location" class="locations" placeholder="City" list="list-location" style="width:50%;"/><input type="text" id="state" placeholder="State" style="width:22%;"/><input type="text" id="country" placeholder="Country" style="width:28%;"/></div>');
                    d3.select("#location-" + counterJ +  " input[name='location']").on("keyup", function() {
                        add_input_locations(counterJ);
                    });
                }
            }

            function add_input_loc(counterU) {
                if ($('#location-' + counterU + ' input[name="location"]').val() !== "") {
                    d3.select('#location-' + counterU + ' input[name="location"]').on('keyup', null);
                    counterU++;

                    $("#location-" + (counterU - 1)).after('<div id="location-' + counterU + '" class="input-control text" data-role="input-control"><input type="text" name="location" class="locations" id="location" placeholder="City" /></div>');
                    d3.select("#location-" + counterU +  " input[name='location']").on("keyup", function() {
                        add_input_loc(counterU);
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
                s = '<h2 id="webform-head">Information</h2><hr/><div class="webform-content"><div class="input-control text" data-role="input-control"><input type="text" name="name" id="name" placeholder="Name of Entity" list="list-name"/><datalist id="list-name"></datalist></div><h3 class="form-header">What type of entity?</h3><div class="webform-entities"><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_forpro" type="radio" name="entitytype" value="For-Profit" checked="checked"/><span class="check"></span><h4 class="webform-labels">For-Profit</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_nonpro" type="radio" name="entitytype" value="Non-Profit"/><span class="check"></span><h4 class="webform-labels">Non-Profit</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_gov" type="radio" name="entitytype" value="Government"/><span class="check"></span><h4 class="webform-labels">Government</h4></label></div><div data-role="input-control" class="input-control radio default-style webform"><label><input id="rb_individs" type="radio" name="entitytype" value="Individual"/><span class="check"></span><h4 class="webform-labels">Individual</h4></label></div></div><h3 class="form-header">What kind of work do they do?</h3><h4>(Select All That Apply)</h4><div class="webform-categories"><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_gen" type="checkbox" name="gen" data-show="general" value="General"/><span class="check"></span><h4 class="webform-labels">General Civic Tech</h4></label></div><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_datat" type="checkbox" name="datat" data-show="datalytics" value="DataAnalytics"/><span class="check"></span><h4 class="webform-labels">Data & Analytics</h4></label></div><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_eced" type="checkbox" name="eced" data-show="econedu" value="EconGrowthEdu"/><span class="check"></span><h4 class="webform-labels">Jobs & Education</h4></label></div><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_src" type="checkbox" name="srcities" data-show="srcities" value="SRCities"/><span class="check"></span><h4 class="webform-labels">Smart & Resilient Cities</h4></label></div><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_socs" type="checkbox" name="socserv" data-show="socserv" value="SocialServ"/><span class="check"></span><h4 class="webform-labels">Social Services</h4></label></div><div data-role="input-control" class="input-control checkbox webform"><label><input id="cb_govt" type="checkbox" name="govtech" data-show="govtech" value="GovTech"/><span class="check"></span><h4 class="webform-labels">GovTech</h4></label></div></div><div id="location-0"><div class="input-control text" data-role="input-control"><input type="text" name="location" id="location" class="locations" placeholder="City" list="list-location" style="width:50%;"/><input type="text" id="state" placeholder="State" style="width:22%;"/><input type="text" id="country" placeholder="Country" style="width:28%;"/></div></div><datalist id="list-location"></datalist></div><div class="input-control text" data-role="input-control"><input type="text" name="website" id="website" placeholder="Website"/></div><h3 class="form-header" style="display:inline-block;">Number of Employees</h3><div class="input-control text" data-role="input-control" style="width:27% !important; display:inline-block; float:right; margin-top: 2%;"><input type="text" name="employees" id="employee" maxlength="6" style="width:100% !important;"/></div><h3 class="form-header">Key People?</h3><div id="key-people-0" class="input-control text" data-role="input-control"><input type="text" name="kpeople" class="kpeople" placeholder="Key Person\'s Name"/></div><h3 class="form-header">Who funds them via grants?</h3><div id="funding-0"><div class="fund-input input-control text" data-role="input-control"><input type="text" name="fund" class="funder" placeholder="Funder" style="display:inline-block; width:50%;" list="funding-received-list"/><datalist id="funding-received-list"></datalist><input type="text" name="fund_amt" class="fund_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="fund_year" class="fund_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div><h3 class="form-header">Who invests in them via equity stakes (stock)?</h3><div id="investing-0"><div class="invest-input input-control text" data-role="input-control"><input type="text" name="invest" class="investor" placeholder="Investor" style="display:inline-block; width:50%;" list="investment-received-list"/><datalist id="investment-received-list"></datalist><input type="text" name="invest_amt" class="invest_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="invest_year" class="invest_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div><h3 class="form-header">Who do they fund via grants?</h3><div id="fundinggiven-0"><div class="fundgiven-input input-control text" data-role="input-control"><input type="text" name="fundgiven" class="fundee" placeholder="Fundee" style="display:inline-block; width:50%;" list="funding-given-list"/><datalist id="funding-given-list"></datalist><input type="text" name="fundgiven_amt" class="fundgiven_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="fundgiven_year" class="fundgiven_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div><h3 class="form-header">Who do they invest in via equity stakes (stock)?</h3><div id="investmentmade-0"><div class="investmade-input input-control text" data-role="input-control"><input type="text" name="investmade" class="investee" placeholder="Investee" style="display:inline-block; width:50%;" list="investment-made-list"/><datalist id="investment-made-list"></datalist><input type="text" name="investmade_amt" class="investmade_amt" placeholder="Amount" style="display:inline-block; width: 27%;"/><input type="text" name="investmade_year" class="investmade_year" placeholder="Year" style="display:inline-block; width: 20%;"/></div></div><h3 class="form-header">Who provides them with data?</h3><div id="data-0" class="input-control text" data-role="input-control"><input type="text" name="data" class="data-entity" placeholder="Data Resource" list="data-received-list"/><datalist id="data-received-list"></datalist></div><div id="nextPhase"><button type="button" id="submit-A" href="javascript: check_empty()">Next</button></div></div><hr/><div class="webform-footer"><span id="">Some entities lack adequate information. Would you like to help?</span><br/><span id="toFormC">Click here!</span></div>';

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
                s += '<h2 id="webform-head">Information</h2><hr/><div style="text-align:center;" class="webform-content"><p>Thank you for contributing to Civic Graph! Refresh the page to view your changes (it might take a few moments).</p><p>Would you like to add or edit more info?</p>';

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

                if(obj.location !== null) {
                    d3.json("/cities", function(error, cities){
                        var location = obj.location;
                        var cityNodes = cities.nodes;
                        for (var i = 0; i < location.length; i++) {
                            var string = location[i].location;
                            var splitString = string.split(",");
                            $("#location-" + i).after('<div id="location-' + (i + 1) + '" class="input-control text" data-role="input-control"><input type="text" name="location" id="location" class="locations" placeholder="City" list="list-location" style="width:50%;"/><input type="text" id="state" placeholder="State" style="width:22%;"/><input type="text" id="country" placeholder="Country" style="width:28%;"/></div>');
                            d3.select('#location-' + i + ' input[name="location"]').on('keyup', null);
                            d3.select('#location-' + i + ' input[name="location"]').text(function(e) {
                                $(this).val(splitString[0]);
                                input1 = $(this).siblings("#state");
                                input2 = $(this).siblings("#country");

                                for (var j = 0; j < cityNodes.length; j++) {
                                    var city = cityNodes[j];
                                    if(city.City_Name == splitString[0]) {
                                        if(splitString.length === 2) {
                                            input1.val(city.State_Code);
                                        }
                                        if(splitString.length === 3) {
                                            input1.val(city.State_Code);
                                            input2.val(city.Country_Code);
                                        }
                                    }
                                }
                            });
                        }
                    });

                    d3.select('#location-' + location.length + ' input[name="location"]').on('keyup', function() {
                        add_input_locaions(location.length);
                    });
                }

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
                        countTypes[3]++;
                    }
                    if (filteredNodes[x].type === "Non-Profit") {
                        nonProfitsArray.push(filteredNodes[x].name);
                        nonProfitObjects.push(filteredNodes[x]);
                        countTypes[1]++;
                    }
                    if (filteredNodes[x].type === "For-Profit") {
                        forProfitsArray.push(filteredNodes[x].name);
                        forProfitObjects.push(filteredNodes[x]);
                        countTypes[0]++;
                    }
                    if (filteredNodes[x].type === "Government") {
                        governmentArray.push(filteredNodes[x].name);
                        governmentObjects.push(filteredNodes[x]);
                        countTypes[2]++;
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
                    var splitLocations = d.location;

                    if (!(name in entitiesHash)) {
                        entitiesHash[name] = d;
                        sortedNamesList.push(d.name);
                    }

                    if (!(nickname in entitiesHash)) {
                        entitiesHash[nickname] = d;
                        sortedNamesList.push(d.nickname);
                    }

                    if(splitLocations) {
                        splitLocations.forEach(function(l) {
                            var location = l.location;
                            var lwcLocation = location.toLowerCase();
                            (!(lwcLocation in locationsHash)) ? (locationsHash[lwcLocation] = [], locationsHash[lwcLocation].push(d), sortedLocationsList.push(location)) : (locationsHash[lwcLocation].push(d));
                        });
                    }
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

                // d3.select('.filter-name-location datalist')
                //     .html(s);



            }

            //filter the sortedSearchList on keyup
            $('#search-text').autocomplete({
                lookup: sortedSearchList,
                appendTo: $('.filter-name-location'),
                onSelect: function (suggestion) {
                    handleQuery(suggestion.value);
                }
            }).on('keyup', function(){
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
                        var locationSource = l.source.location;
                        var locationTarget = l.target.location;
                        if(locationSource && locationTarget){
                            for(var i =0; i < locationSource.length; i++){
                                for(var j=0; j<locationTarget.length; j++){
                                    return (locationSource[i].location.toLowerCase() === query && locationTarget[j].location.toLowerCase() === query) ? 1 : 0.05;
                                }
                            }
                        }
                    });

                    investLink.style("opacity", function(l) {
                        var locationSource = l.source.location;
                        var locationTarget = l.target.location;
                        if(locationSource && locationTarget){
                            for(var i =0; i<locationSource.length; i++){
                                for(var j=0; j<locationTarget.length; j++){
                                    return (locationSource[i].location.toLowerCase() === query && locationTarget[j].location.toLowerCase() === query) ? 1 : 0.05;
                                }
                            }
                        }
                    });

                    porucsLink.style("opacity", function(l) {
                        var locationSource = l.source.location;
                        var locationTarget = l.target.location;
                        if(locationSource && locationTarget){
                            for(var i =0; i<locationSource.length; i++){
                                for(var j=0; j<locationTarget.length; j++){
                                    return (locationSource[i].location.toLowerCase() === query && locationTarget[j].location.toLowerCase() === query) ? 1 : 0.05;
                                }
                            }
                        }
                    });

                    dataLink.style("opacity", function(l) {
                        var locationSource = l.source.location;
                        var locationTarget = l.target.location;
                        if(locationSource && locationTarget){
                            for(var i =0; i<locationSource.length; i++){
                                for(var j=0; j<locationTarget.length; j++){
                                    return (locationSource[i].location.toLowerCase() === query && locationTarget[j].location.toLowerCase() === query) ? 1 : 0.05;
                                }
                            }
                        }
                    });

                    d3.selectAll('circle').style("stroke", "white");

                    d3.selectAll('.node').style('opacity', function(n) {
                        var locationSource = n.location;
                        if(locationSource){
                            for(var i =0; i<locationSource.length; i++){
                                return (locationSource[i].location.toLowerCase().indexOf(query) === -1) ? 0.05 : 1;
                            }
                        }
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

            /***

              For the "Connections" checkboxes

            ***/
            var connectionsCheckboxActions = function() {

                var connectionClasses = ['.invest', '.fund', '.porucs', '.data'];

                d3.selectAll('.group-items.connections input')[0].forEach(function(d, i) {
                    d3.selectAll('#' + d.id).on('click', (function(d, i) {
                        return function() {
                            // d3.selectAll('#cb_fund')[0][0].checked
                            var visibleNodes = determineVisibleNodes();
                            $('#' + d.id).is(':checked') ? revealConnections(connectionClasses[i], visibleNodes) : hideConnections(connectionClasses[i]);
                            shouldCheckboxRemainUnchecked(connectionClasses[i], visibleNodes);
                        };
                    })(d, i));
                });
            };

            // Only reveal the connections with both source and target nodes visible.
            var revealConnections = function(selector, visibleNodes) {
                // drawFundLink();
                d3.selectAll(selector).style("visibility", function(l) {
                    if (l.source.index in visibleNodes && l.target.index in visibleNodes && this.style.visibility === "hidden") {
                        return "visible";
                    } else
                        return "hidden";
                });
            };

            //
            var hideConnections = function(selector) {
                d3.selectAll(selector).style("visibility", function(l) {
                    return "hidden";
                });
            };


            // If none of the type's nodes are visible, then the connections should not be visible as well (no nodes = no connections).
            var shouldCheckboxRemainUnchecked = function(selector, visibleNodes) {
                if (visibleNodes.length === 0 || ($('#cb_individ').is('checked') && $('#cb_forpro').is('checked') && $('#cb_nonpro').is('checked') && $('#cb_gov').is('checked'))) {
                    $(selector).attr('checked', false);
                }
            }


            connectionsCheckboxActions();

            /***

              For the "Types" checkboxes

            ***/
            var typesCheckboxActions = function() {
                d3.selectAll('#cb_forpro, #cb_nonpro, #cb_gov, #cb_individ').on('click', function() {
                    $('#cb_forpro').is(':checked') ? nodeVisibility('For-Profit', 'visible') : nodeVisibility('For-Profit', 'hidden');
                    $('#cb_nonpro').is(':checked') ? nodeVisibility('Non-Profit', 'visible') : nodeVisibility('Non-Profit', 'hidden');
                    $('#cb_gov').is(':checked') ? nodeVisibility('Government', 'visible') : nodeVisibility('Government', 'hidden');
                    $('#cb_individ').is(':checked') ? nodeVisibility('Individual', 'visible') : nodeVisibility('Individual', 'hidden');

                    var visibleNodes = determineVisibleNodes();

                    toggleLinks(visibleNodes);
                });
            };

            //  Initialize the display accordingly...
            var nodeVisibility = function(type, visibility) {
                d3.selectAll(".node").filter(function(d) {
                    if (d.type === type) return this;
                }).style("visibility", visibility);
            };

            var setVisibility = function(link, linkData, visibleNodes, connectionType) {
                if (linkData.source.ID in visibleNodes && linkData.target.ID in visibleNodes) {
                    switch (connectionType) {
                        case "Funding":
                            ($('#cb_fund').is(':checked')) ? d3.select(link).style('visibility', 'visible'): d3.select(link).style('visibility', 'hidden');
                            break;
                        case "Investment":
                            ($('#cb_invest').is(':checked')) ? d3.select(link).style('visibility', 'visible'): d3.select(link).style('visibility', 'hidden');
                            break;
                        case "Collaboration":
                            ($('#cb_porucs').is(':checked')) ? d3.select(link).style('visibility', 'visible'): d3.select(link).style('visibility', 'hidden');
                            break;
                        case "Data":
                            ($('#cb_data').is(':checked')) ? d3.select(link).style('visibility', 'visible'): d3.select(link).style('visibility', 'hidden');
                            break;
                        default:
                            break;
                    }
                } else {
                    d3.select(link).style('visibility', 'hidden');
                }
            };

            //  For each rendered node, if the node is a for-profit, then for each connection type, determine if the node is a source or target of the connection, add the connection to the array.
            var toggleLinks = function(visibleNodes) {

                //  Finding links with nodes of a certain type.
                fundLink.filter(function(link) {
                    setVisibility(this, this.__data__, visibleNodes, "Funding");
                });
                investLink.filter(function(link) {
                    setVisibility(this, this.__data__, visibleNodes, "Investment");
                });
                porucsLink.filter(function(link) {
                    setVisibility(this, this.__data__, visibleNodes, "Collaboration");
                });
                dataLink.filter(function(link) {
                    setVisibility(this, this.__data__, visibleNodes, "Data");
                });

                // porucsLink.filter(function(d){console.log(d3.select(this).style('visibility', 'hidden'))})

                // Time to reflect these changes accordingly with the connection checkboxes to ensure consistency.
                reflectConnectionChanges();
            };

            var reflectConnectionChanges = function() {
                var visibleFundingConnections = fundLink.filter(function(link) {
                    return d3.select(this).style('visibility') === 'visible';
                });
                var visibleInvestmentConnections = investLink.filter(function(link) {
                    return d3.select(this).style('visibility') === 'visible';
                });
                var visibleCollaborationsConnections = porucsLink.filter(function(link) {
                    return d3.select(this).style('visibility') === 'visible';
                });
                var visibleDataConnections = dataLink.filter(function(link) {
                    return d3.select(this).style('visibility') === 'visible';
                });

                if (visibleFundingConnections[0].length === 0) {
                    $('#cb_fund').attr('checked', false);
                }
                if (visibleInvestmentConnections[0].length === 0) {
                    $('#cb_invest').attr('checked', false);
                }
                if (visibleCollaborationsConnections[0].length === 0) {
                    $('#cb_porucs').attr('checked', false);
                }
                if (visibleDataConnections[0].length === 0) {
                    $('#cb_data').attr('checked', false);
                }
            };

            typesCheckboxActions();



















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
                            if (d.employees !== null)
                                return -6 * empScale(d.employees);
                            else
                                return -25;
                        })
                        .linkDistance(50)

                    .on("tick", tick)
                        .start();
                }
                clearResetFlag = 1;
            });

        });
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
            console.log("asd");
            var network = document.getElementById('network');
            network.parentNode.removeChild(network);
            drawMap();
        }
    });


/************************************/
/*                                  */
/*           MAP VIEW               */    
/*                                  */
/***********************************/    

var d3MapTools, d3Layer;

function drawMap() {
  var width = 960,
    height = 500;

  var wmap = d3.select(".content").append("div")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "map");


  map = new Microsoft.Maps.Map(document.getElementById('map'), {
    credentials: 'Ah_CBBU6s6tupk_v45WVz46zMfevFT5Lkt9vpmwqV5LedzE221Kfridd7khQxD8M',
    center: new Microsoft.Maps.Location(40, -80),
    zoom: 4,
    mapTypeId: Microsoft.Maps.MapTypeId.road
  });

  Microsoft.Maps.registerModule("D3OverlayModule", "static/scripts/D3OverlayManager.js");
  Microsoft.Maps.loadModule("D3OverlayModule", {
      callback: loadD3Layer
  });



    d3.select(self.frameElement).style("height", height + "px");
    

}


var d3Layers = {};

function loadD3Layer() {
    //Create an instance of the D3 Overlay Manager
    // console.log(map);
  d3MapTools = new D3OverlayManager(map);

  var radius = 80;

  var cityData = [];
  
  var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([0, 0])
      .html(function(d){
          return d.name + "<br/> " + d.val + (d.val > 1 ? " Entities, " : " Entity, ")  + "<br/>" + parseFloat((d.val/d.totalCount) * 100).toFixed(2) + "%";
          
  });


  var donutTip = d3.tip()
            .attr("class", "d3-tip")
            .offset([0, 0])
            .html(function(d) {
                return d.cityName + ", " + d.type + "<br/>" + d.count + (d.count > 1 ? " Entities, " : " Entity, ") + parseFloat((d.count/d.totalCount) * 100).toFixed(2) + "%";
            });



  var routeTip = d3.tip()
                    .attr("class", "d3-tip")
                    .offset([0, 0])
                    .html(function(d) {
                        return d.cityA + " - " + d.cityB + ", <br/>" + d.count + " connections, <br/>" +  parseFloat((d.count/d.totalCount) * 100).toFixed(2) + "% of total connections";

                    });


  var locations = {};

  var Links = [];
  // var collabLinks = [];
  // var dataLinks = [];
  // var invstLinks = [];

  // var topology;
  // var connData;
  // var locData;

  queue()
      .defer(d3.json, "static/data/world-110m.json")
      .defer(d3.json, "static/data/civicgeo.json")
      .defer(d3.json, "static/data/civicgeoloc.json")
      .defer(d3.json, "static/data/demo.json")
      .await(analyze);


  function analyze(error, topology, connData, locData, demoData) {


    if (error) {
        throw error;
        console.log(error);
    }

    var topology = topology;
    var connData = connData;
    var locData = locData;
    console.log(locData);
    // console.log(connData);



    locationData = [];
    var totalEntityCount = null;
    locData.nodes.forEach(function (d) {
      if (d.City_Lat == null || d.City_Long == null)
        return;
      key = d.City_Lat + ":" + d.City_Long;
      if (key in locations) {
        locations[key] += d.entitycount
      }
      else {
        locations[key] = d.entitycount
      }
      totalEntityCount += d.entitycount;
    });
    // console.log(totalEntityCount, "totalEntityCount");

    var maxVal = 0;
    // console.log(locations)
    for (var loc in locations) {
        // console.log(loc);
      var d = {};
      coor = loc.split(":");
      d.val = locations[loc];
      d.lat = coor[0];
      d.lon = coor[1];
      locData.nodes.forEach(function(place) {
        var name = "Unknown";
        if (place.City_Lat == d.lat && place.City_Long == d.lon) {
            d.id = place.City_ID;
          if (place.City_Name != null && place.State_Code != null) {
            name = place.City_Name + ", " + place.State_Code + ", " + place.Country_Name;
            return d.name = name;
          }
          else if(place.City_Name != null && place.Country_Name != (null || "United States")) {
            name = place.City_Name + ", " + place.Country_Name;
            return d.name = name;
          }
          else {
            name = place.Country_Name;
            return d.name = name
          }
          // console.log("place: " + name);
          return d.name = name;
        }
      });
      d.totalCount = totalEntityCount;
      locationData[locationData.length] = d;

      if (d.val > maxVal) {
        maxVal = d.val;
      }
    }

    // console.log(topology);
    // console.log(connData);
    // console.log(locData);
    console.log(locationData);

    Object.keys(connData).forEach(function(key) {
      if (key === "nodes")
        return;

      connData[key].forEach(function(d) {
          var nodeA, nodeB;
          nodeA = _.find(locData.nodes, function(x) {
              return x.Entity_List.indexOf("." + d.source +".") >= 0;
          });
          nodeB = _.find(locData.nodes, function(y) {
              return y.Entity_List.indexOf("." + d.target +".") >= 0;
          });
          if (nodeA == null || nodeB == null || (nodeA.City_Lat == null) || (nodeB.City_Lat == null))
              return
          else {    
              Links.push({
                  type: "LineString",
                  coordinates: [
                      [nodeA.City_Long, nodeA.City_Lat],
                      [nodeB.City_Long, nodeB.City_Lat]
                  ],
                  category: key,
                  cityA: nodeA.City_Name,
                  cityB: nodeB.City_Name,
                  id_A: nodeA.City_ID,
                  id_B: nodeB.City_ID
              });
          }
      });
    });

    var totalConnCount = _.chain(connData).map(function(d, i) {
        if (i === "nodes")
            return 0;
        return d.length;
    }).reduce(function(a, b) { return a + b; }).value();
    // console.log(totalConnCount, "totalConnCount");

    // console.log(Links, "before");
    Links = _.chain(Links)
        .groupBy(function(d) {
            return d.category + d.coordinates.toString();
        })
        .map(function(subArray, key){
            var link = subArray[0];
            link.count = subArray.length;
            link.totalCount = totalConnCount;
            return link;
        })
        .value();
    console.log(Links, "after");

    demoData.stationBeanList.forEach(function(station) {
        if (station.availableDocks <= 10) {
            station.category = "Non-Profit";
        }
        else if(station.category <= 25) {
            station.category = "Government";
        }
        else
            station.category = "For-Profit";
    });


    d3Layers.d3Topology = d3MapTools.addLayer({
      loaded: function (svg, projection) {
        // console.log(Links, " the links ");


        svg.selectAll(".topology")
            .data(topojson.feature(topology, topology.objects.countries).features)
            .enter()
            .append("path")
            .attr("d", projection)
            .attr("opacity", 0)
            .attr("class", "topology");



        },

       viewChanged: function(svg, projection) {
       } 
    
    });
    
    d3Layers.d3Routes = d3MapTools.addLayer({

        pinpoints: null, 
        routes: null,
        thisClick: false,

        opacityLevel: function(a, b) {
            var bool = true;
            if (a.id === b.id) return false;
            Links.forEach(function(link) {
                if((link.id_A === a.id && link.id_B === b.id) || (link.id_A === b.id && link.id_B === a.id)) {
                    bool = false;
                }
            });
            return bool;
        },

        highlight:  function(a) {
            tip.show(a);
            d3Layers.d3Routes.svg.selectAll(".pinpoint")
                .classed("hidden", function(b) {
                    return d3Layers.d3Routes.options.opacityLevel(a, b);
            });
            d3Layers.d3Routes.svg.selectAll(".routes")
                .classed("hidden", function(b) {
                    return (b.id_A != a.id && b.id_B != a.id);
            });
        },

        highlightHover: function(a) {
            if (!d3Layers.d3Routes.options.thisClick) {
                d3Layers.d3Routes.options.highlight(a);
            }
        },

        highlightClick: function(a) {
            d3Layers.d3Routes.options.thisClick = true;
            d3Layers.d3Routes.options.highlight(a);
        },

        reset: function() {
            d3Layers.d3Routes.svg.selectAll(".pinpoint")
                    .classed("hidden", false);

            d3Layers.d3Routes.svg.selectAll(".routes")
                .classed("hidden", false);
            tip.hide();
        },

        resetHover: function() {
            if (!d3Layers.d3Routes.options.thisClick) {
                d3Layers.d3Routes.options.reset();
            }
        },

        resetClick: function() {
            d3Layers.d3Routes.options.reset();
            d3Layers.d3Routes.options.thisClick = false;
        },

        loaded: function(svg, projection) {

            svg.call(routeTip);

            strokeScale = d3.scale.log().domain([1, 100]).range([3, 15]);

             svg.append("rect")
                .attr("class", "rect")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("opacity", 0);

            this.routes = svg.selectAll(".routes")
                .data(Links)
                .enter()
                .append("path")
                .attr("class", function(d){
                  return "routes " + d.category;
                })
                .attr("d", projection)
                .attr("fill-opacity", 0)
                .attr("opacity", 0)
                .attr("visibility", "visible")
                .style("stroke-width", function(d) {
                  return strokeScale(d.count) + "px";
                })
                .on('mouseover', routeTip.show)
                .on('mouseout', routeTip.hide);


            svg.call(tip);
            // console.log(locationData);
            radiusScale = d3.scale.linear().domain([0, maxVal]).range([5, 55]);

            // console.log(maxVal)
            this.pinpoints = svg.selectAll(".pinpoint")
                 .data(locationData)
                 .enter()
                 .append("circle")
                 .attr("transform", function(d) {
                    return "translate(" + projection.projection()([d.lon, d.lat]) + ")";
                 })
                 .attr("r", function(d){
                    return radiusScale(d.val);
                })
                .style({
                    fill: "grey",
                    stroke: "black",
                })
                .attr("class", "pinpoint")
                .attr("opacity", 0)
                .attr("stroke-opacity", 0)
                .on('mouseout', d3Layers.d3Routes.options.resetHover)
                .on('mouseover', d3Layers.d3Routes.options.highlightHover)
                .on("click", d3Layers.d3Routes.options.highlightClick);

            svg.select(".rect").on("click", function() {
                d3Layers.d3Routes.options.resetClick();
            });

        },

        viewChanged: function(svg, projection) {
            svg.attr("visibility", map.getTargetZoom() < 10 ? "visible":"hidden");

            svg.selectAll("circle")
                .attr("transform", function(d) {
                    return "translate(" + projection.projection()([d.lon, d.lat]) + ")" ;
                });

            svg.attr("visibility", map.getTargetZoom() < 10 ? "visible":"hidden");

        }
    });

    // d3Layers.d3Circles = d3MapTools.addLayer({
    //   loaded: function (svg, projection) {

    //     svg.call(tip);
    //         // console.log(locationData);
    //     radiusScale = d3.scale.linear().domain([0, maxVal]).range([5, 55]);

    //         // console.log(maxVal)
    //     svg.selectAll("circle")
    //          .data(locationData)
    //          .enter()
    //          .append("circle")
    //          .attr("transform", function(d) {
    //             return "translate(" + projection.projection()([d.lon, d.lat]) + ")";
    //          })
    //          .attr("r", function(d){
    //             return radiusScale(d.val);
    //         })
    //         .style({
    //             fill: "grey",
    //             stroke: "black"
    //         })
    //         .attr("class", "pinpoint")
    //         .attr("opacity", 0.8)
    //         .on('mouseover', tip.show)
    //         .on('mouseout', tip.hide)

    //     },

    //    viewChanged: function(svg, projection) {


    //         svg.selectAll("circle")
    //             .attr("transform", function(d) {
    //                 return "translate(" + projection.projection()([d.lon, d.lat]) + ")" ;
    //             });

    //         svg.attr("visibility", map.getTargetZoom() < 10 ? "visible":"hidden");

    //    }
    // });

            d3Layers.d3Donuts = d3MapTools.addLayer({
                
                radius: 0.2,

                loaded: function(svg, projection) {
                    var arc = d3.svg.arc();


                    svg.attr("visibility", "hidden");
                    svg.call(donutTip);

                    var list = [];
        
                    function sum(arr) {
                        return _.reduce(arr, function(a, b) {
                            return a + b;
                        }, 0);
                    };

                    var totalCountList = _.chain(locData.nodes)
                        .groupBy("City_ID")
                        .map(function(subArray, key){
                        return {
                            Id: key,
                            total: sum(_.pluck(subArray, "entitycount"))
                        }
                    })
                    .value();

                    // console.log(totalCountList);

                    var subtotal = 0;
                    var lasCityId = null;
                    locData.nodes.forEach(function(node) {
                        var etotal = _.find(totalCountList, function(x) {
                            return x.Id == node.City_ID ? x.total : 0
                        });
                        if (lasCityId !== node.City_ID) {
                            subtotal = 0;
                        }
                        list.push({
                            cityName: node.City_Name,
                            lat: node.City_Lat,
                            lon: node.City_Long,
                            type: node.Type,
                            count: node.entitycount,
                            totalCount: etotal.total,
                            start: subtotal
                        });
                        subtotal += node.entitycount;
                        lasCityId = node.City_ID;
                    });
                    // console.log(list);
                    
                    svg.selectAll(".arc")
                        .data(list)
                        .enter()
                        .append("path")
                        .attr("cityName", function(d) {
                            return d.cityName;
                        })
                        .attr("class", "arc")
                        .attr( "d", function(d) {
                            var sliceAngle = 2 * Math.PI / d.totalCount;
                            return arc({
                              // outerRadius: sf * (1 + 2 * Math.log(1 + d.totalCount)),
                              outerRadius: radius,
                              innerRadius: radius - 45,
                              startAngle: d.start * sliceAngle,
                              endAngle: (d.start + d.count) * sliceAngle
                            });
                        })
                        .attr("lat", function(d){ return d.lat;})
                        .attr("lon", function(d){ return d.lon;})
                        .attr("transform", function(d) {
                            return "translate(" + projection.projection()([d.lon, d.lat]) + ")";
                        })
                        .style("fill", function(d) {
                            if (d.type === "For-Profit")
                                return "#7cbd42";
                            if (d.type === "Non-Profit")
                                return "#269fd9";
                            if (d.type === "Individual")
                                return "#fbb717";
                            if (d.type === "Government")
                                return "#f05026";

                            return "#FFFFFF";

                        })
                        .style("stroke", "white")
                        .on('mouseover', donutTip.show)
                        .on('mouseout', donutTip.hide);


                },

                viewChanged: function(svg, projection) {

                    var arc = d3.svg.arc();

                    svg.selectAll(".arc")
                        .attr( "d", function(d) {
                            var sliceAngle = 2 * Math.PI / d.totalCount;
                            var outrad = 20 + (radius * Math.log(d.totalCount)/5 * map.getTargetZoom()/10);
                            return arc({
                              // outerRadius: sf * (1 + 2 * Math.log(1 + d.totalCount)),
                              outerRadius: outrad,
                              innerRadius: outrad - (0.75 * outrad),
                              startAngle: d.start * sliceAngle,
                              endAngle: (d.start + d.count) * sliceAngle
                            });
                        })
                        .attr("transform", function(d) {
                            return "translate(" + projection.projection()([this.getAttribute("lon"), this.getAttribute("lat")]) + ")";
                        });

                    svg.attr("visibility", map.getTargetZoom() < 10 || map.getTargetZoom() > 13 ? "hidden" : "visible");

                }
            });


        d3Layers.d3Entities = d3MapTools.addLayer({
            loaded: function(svg, projection) {

                // svg.call(tip);
                // console.log(locationData);
                radiusScale = d3.scale.linear().domain([0, 65]).range([2, 10]);

                // console.log(maxVal)

                svg.attr("visibility", "hidden");

                svg.selectAll(".entities")
                     .data(demoData.stationBeanList)
                     .enter()
                     .append("circle")
                     .attr("transform", function(d) {
                        return "translate(" + projection.projection()([d.longitude, d.latitude]) + ")";
                     })
                     .attr("r", function(d){
                        return radiusScale(d.availableDocks);
                    })
                    .style({
                        stroke: "black"
                    })
                    .attr("class", function(d) {
                        return "entities " + d.category;
                    });

            },

            viewChanged: function(svg, projection) {

                 svg.selectAll(".entities")
                    .attr("transform", function(d) {
                        return "translate(" + projection.projection()([d.longitude, d.latitude]) + ")" ;
                    });

                svg.attr("visibility", map.getTargetZoom() < 14 ? "hidden":"visible");

            }
        });
    };

    setTimeout(function() {
        console.log("triggering viewchanged");
        Microsoft.Maps.Events.invoke(map, 'viewchangeend');
        var t = d3Layers.d3Routes.svg.transition().duration(1000);

        t.selectAll(".pinpoint")
                .attr("opacity", 0.8)
                .attr("stroke-opacity", 1);

        t.transition().selectAll(".routes")
                .attr("opacity", 1);

    }, 2500);
}



