var focus;

function setrdf(triplesvar) {
  triples = triplesvar;
}

function startHere() {
  
  svg = d3.select("#svg-body").append("svg")
          .attr('width', 600)
          .attr('height', 600)
          .append("g")

  width = 600;
  height = 600;
  
  active = d3.select(null);

  zoom = d3.zoom()
    .scaleExtent([1 /2, 4])
    .on("zoom", zoomed);


  graph = triplesToGraph(triples);
  simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) {
      return d.id;
    }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));;

  initializeDisplay();
  initializeSimulation();
}

function initializeSimulation() {
  console.log('init sim');

  const nodeWithLocation = graph.nodes.find(node => node.id === "http://purl.obolibrary.org/obo/OOSTT_154/trauma_medical_director");
  nodeWithLocation.fx = width * .05; // Set the desired x-coordinate
  nodeWithLocation.fy = height * .5; // Set the desired y-coordinate

  focus = nodeWithLocation;
  var getAllParentChildren = getAllChildrenOfFocus(focus);
  for (var child of getAllParentChildren.children) {
    if (child !== focus.id) {
      console.log(child)
      var nodeToChange = graph.nodes.find(node => node.id == child)
      nodeToChange.fx = width * .2;
    }
  }



  simulation.nodes(graph.nodes);
  initializeForces();
  simulation.on("tick", ticked);
}

function printRDF(triples) {
  console.log(triples)
}

// values for all forces
forceProperties = {
    center: {
        x: 0.5,
        y: 0.5
    },
    charge: {
        enabled: true,
        strength: -30,
        distanceMin: 1,
        distanceMax: 2000
    },
    collide: {
        enabled: true,
        strength: .7,
        iterations: 1,
        radius: 40 
    },
    forceX: {
        enabled: false,
        strength: .1,
        x: .5
    },
    forceY: {
        enabled: false,
        strength: .1,
        y: .5
    },
    link: {
        enabled: true,
        distance: 30,
        iterations: 1
    }
}

// add forces to the simulation
function initializeForces() {
    console.log('init forces');
    simulation
        .force("link", d3.forceLink())
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY());
    // apply properties to each of the forces
    updateForces();
}

function filterNodesById(nodes,id){
	return nodes.filter(function(n) { return n.id === id; });
}

function triplesToGraph(triples){

	svg.html("");
	//Graph
	var graph={nodes:[], links:[]};

	//Initial Graph from triples
	triples.forEach(function(triple){
		var subjId = triple.subject;
		var predId = triple.predicate;
		var objId = triple.object;
		var subjLabel = triple.slabel;
		var predLabel = triple.plabel;
		var objLabel = triple.olabel;

    if (subjLabel.startsWith("x") && subjLabel.length === 22) {
      subjLabel = 'bnode'
    }

    if (objLabel.startsWith("x") && objLabel.length === 22) {
      objLabel = 'bnode'
    }

		var subjNode = filterNodesById(graph.nodes, subjId)[0];
		var objNode  = filterNodesById(graph.nodes, objId)[0];

		if(subjNode==null){
			subjNode = {id:subjId, label:subjLabel, weight:1};
			graph.nodes.push(subjNode);
		}

		if(objNode==null){
			objNode = {id:objId, label:objLabel, weight:1};
			graph.nodes.push(objNode);
		}

    // IMPORTANT NOTE:  Only displays the first link created, not the most important.
    // Needs to have some way of prioritizing.
    // Assuming graph is your graph object
    let linkExists = false;
    
    for (let i = 0; i < graph.links.length; i++) {
      const link = graph.links[i];
    
      if (link.source === subjNode && link.target === objNode) {
        linkExists = true;
        break;
      }
    }
    
    if (linkExists) {
      console.log("The link already exists in the graph.");
    } else {
      // Add the link to the graph
      graph.links.push({source: subjNode, target: objNode, predicate: predLabel, weight: 1});
    }


	});

	return graph;
}


function initializeDisplay(){
  console.log('init display');
	// ==================== Add Marker ====================
	svg.append("svg:defs").selectAll("marker")
	    .data(["end"])
	  .enter().append("svg:marker")
	    .attr("id", String)
	    .attr("viewBox", "0 -5 10 10")
	    .attr("refX", 30)
	    .attr("refY", -0.5)
	    .attr("markerWidth", 6)
	    .attr("markerHeight", 6)
	    .attr("orient", "auto")
	  .append("svg:polyline")
	    .attr("points", "0,-5 10,0 0,5")
	    ;

	// ==================== Add Links ====================
	links = svg.selectAll(".link")
						.data(graph.links)
						.enter()
						.append("line")
							.attr("marker-end", "url(#end)")
							.attr("class", "link")
							.attr("stroke-width",1)
					;//links

	// ==================== Add Link Names =====================
	linkTexts = svg.selectAll(".link-text")
                .data(graph.links)
                .enter()
                .append("text")
					.attr("class", "link-text")
					.text( function (d) { return d.predicate; })
				;

		//linkTexts.append("title")
		//		.text(function(d) { return d.predicate; });

	// ==================== Add Link Names =====================
	nodeTexts = svg.selectAll(".node-text")
                .data(graph.nodes)
                .enter()
                .append("text")
					.attr("class", "node-text")
					.text( function (d) { return d.label; })
				;

		//nodeTexts.append("title")
		//		.text(function(d) { return d.label; });

	// ==================== Add Node =====================
  //
   nodes = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("r", 8)
		.call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .on('dblclick', doubleClickEvent)
    .on('click', clicked)
;  
    


	// ==================== Force ====================
	// ==================== Run ====================
}

function clicked(d){
  console.log("clicked");

  if (active.node() === this){
    active.classed("active", false);
    return reset();
  }

  active = d3.select(this).classed("active", true);

  svg.transition()
    .duration(750)
    .call(zoom.transform,
      d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(8)
      .translate(-(+active.attr('cx')), -(+active.attr('cy')))
    );

}

function dragstarted(d) {
  console.log("called");
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0.0001);
  //d.fx = null;
  //d.fy = null;
}

function doubleClickEvent(d){
    console.log('doubleclick')
    if(focus == d){
        focus = undefined;
        nodes.style('opacity', 1);
        nodes.style('fill', 'grey');
        nodeTexts.style('opacity', 1);
        links.style('opacity', 1);
        linkTexts.style('opacity', 1);
    }else {
        focus = d;
        var getAllParentChildren = getAllChildrenOfFocus(focus);
        nodes.style('opacity', function(o){
          if(getAllParentChildren.parent.indexOf(o.id) !== -1 ||
           getAllParentChildren.children.indexOf(o.id) !== -1 || o.id == focus.id){
            return 1;
          }else return 0;
        });
        nodes.style('fill', function(o){
          if(o.id == focus.id){
            return 'blue';
          }else return 'grey';
        });
        nodeTexts.style('opacity', function(o){
          if(getAllParentChildren.parent.indexOf(o.id) !== -1 ||
           getAllParentChildren.children.indexOf(o.id) !== -1 || o.id == focus.id){
            return 1;
          }else return 0;
        });
        links.style('opacity', function(l,i){
          if(l.source.id == d.id || l.target.id == d.id){
            return 1;
          }else { return 0}
        })
        linkTexts.style('opacity', function(l,i){
          if(l.source.id == d.id || l.target.id == d.id){
            return 1;
          }else { return 0}
        })
        initializeForces()
        updateForces();
        updateDisplay();
   }
}

// helper function
function getAllChildrenOfFocus(focus){
  let childrenArray = [];
  let parentArray = [];
  graph.links.forEach(function(eachLink){
    if(eachLink.source.id == focus.id && childrenArray.indexOf(eachLink.target.id) == -1){
      childrenArray.push(eachLink.target.id);
    }
    if(eachLink.target.id == focus.id && parentArray.indexOf(eachLink.source.id) == -1){
      parentArray.push(eachLink.source.id);
    }
  })
  return {parent: parentArray, children: childrenArray};
}

// update the display based on the forces (but not positions)
function updateDisplay() {
    nodes
        .attr("r", 8) 
        //.attr("r", forceProperties.collide.radius)
        .attr("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
        .attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15);

    links
        .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

function updateAll() {
  updateForces();
  updateDisplay();
}

function updateForces() {
    console.log('update forces');
    // get each force by name and update the properties
    simulation.force("center")
        .x(width * forceProperties.center.x)
        .y(height * forceProperties.center.y);
    simulation.force("charge")
        .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
        .distanceMin(forceProperties.charge.distanceMin)
        .distanceMax(forceProperties.charge.distanceMax);
    simulation.force("collide")
        .strength(forceProperties.collide.strength * forceProperties.collide.enabled)
        .radius(forceProperties.collide.radius)
        .iterations(forceProperties.collide.iterations);
    simulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    simulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height * forceProperties.forceY.y);
    simulation.force("link")
        .id(function(d) {return d.id;})
        .distance(forceProperties.link.distance)
        .iterations(forceProperties.link.iterations)
        .links(forceProperties.link.enabled ? graph.links : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    simulation.alpha(1).restart();
}


function ticked() {
	nodes
		.attr("cx", function(d){ return d.x; })
		.attr("cy", function(d){ return d.y; })
		;

	links
		.attr("x1", 	function(d)	{ return d.source.x; })
        .attr("y1", 	function(d) { return d.source.y; })
        .attr("x2", 	function(d) { return d.target.x; })
        .attr("y2", 	function(d) { return d.target.y; })
       ;

	nodeTexts
		.attr("x", function(d) { return d.x + 12 ; })
		.attr("y", function(d) { return d.y + 3; })
		;


  linkTexts.attr("transform", function(d) {
    // Calculate the angle between the source and target nodes
    var dx = d.target.x - d.source.x;
    var dy = d.target.y - d.source.y;
    var angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
    // Calculate the midpoint of the line
    var midX = (d.source.x + d.target.x) / 2;
    var midY = (d.source.y + d.target.y) / 2;
  
    // Get the text element
    var textElement = d3.select(this);
  
    // Get the computed text length
    var textLength = textElement.node().getComputedTextLength();
  
    // Calculate the offset for text positioning
    var offsetX = (textLength / 2) * Math.cos(angle * Math.PI / 180);
    var offsetY = (textLength / 2) * Math.sin(angle * Math.PI / 180);

    // Calculate the perpendicular distance for text positioning
    var perpendicularDistance = 2; // Adjust this value as needed
    offsetX += -perpendicularDistance * Math.sin(angle * Math.PI / 180);
    offsetY += perpendicularDistance * Math.cos(angle * Math.PI / 180);
  
    // Translate the text to the adjusted position
    var x = midX - offsetX;
    var y = midY - offsetY;
  
    return "translate(" + x + "," + y + ") rotate(" + angle + ")";
  });


}

function zoomed() {
  console.log('zoomed')
  svg.attr("transform", d3.event.transform); 
}

function reset() {
  svg.transition()
    .duration(750)
    .call(zoom.transform,
      d3.zoomIdentity
      .translate(0, 0)
      .scale(1)
    );
}

