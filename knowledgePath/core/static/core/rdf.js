var focus;
var graph;
var stack;
var pinnedStacks;
var activeId;
var categoryBoxes;
var categories;
var labels;
var boxes;

function nodeInDict(node, dict) {
    for (let key in dict) {
        if (dict[key].includes(node)) {
            return true;
        }
    }
    return false;
}

function getNodeStackOrder(node, stacks) {
    const sortedKeys = Object.keys(stacks).sort();
    for (let i = 0; i < sortedKeys.length; i++) {
        if (stacks[sortedKeys[i]].includes(node)) {
            return i + 1; // 1-based index
        }
    }
    return null; // Not found
}



// Function to calculate text width
function getTextWidth(text, font) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

function findType(d) {
  var typeNames = ""
  var formattedTypes = ""
  var typesArray = [];
  for (var link of graph.links) {
    if (link.predicate == 'is a' && link.source == d){
      if (typeNames.length > 0) {
       typeNames += ", "; // Add a comma and space if not the first class
      }
      typeNames += link.target.label;
      typesArray.push(link.target.label);
      //possible substitution for 'homo sapiens'
      //if (link.target.label == "Homo sapiens") {
      //  typeNames += 'Administrative Staff'

      //} else {

      //  typeNames += link.target.label;
      //}
    }
  }

  if (typesArray.includes('collection of humans')) {
    return 'people';
  } else if (typesArray.includes('Homo sapiens')) {
    return 'person';
  } else if (typesArray.includes('Geographic Region')) {
    return 'geographic';
  } else {
    return 'none';
  }

}

function addLabels(d, thisElement) {

  var infoContainer = document.getElementById("info-container");
  var typeNames = ""
  var formattedTypes = ""
  for (var link of graph.links) {
    if (link.predicate == 'is a' && link.source == d){
      link.target['enabled'] = false
      // Append the class name to the 'typeNames' string
      if (typeNames.length > 0) {
       typeNames += ", "; // Add a comma and space if not the first class
      }
      typeNames += link.target.label;
      //possible substitution for 'homo sapiens'
      //if (link.target.label == "Homo sapiens") {
      //  typeNames += 'Administrative Staff'

      //} else {

      //  typeNames += link.target.label;
      //}
    }
  }

  if (typeNames.length > 0) {
    // Split typeNames by comma and join with line breaks
    var typesArray = typeNames.split(',');
    formattedTypes = typesArray.join(",\n");

    typeNames = '\nTypes: ' + typeNames 
    //infoContainer.innerHTML += typeNames;
    formattedTypes = '\nTypes: ' + formattedTypes
  }

  var roleNames = ""
  var formattedRoles = ""
  for (var link of graph.links) {
    if (['bearer of', 'bearer_of', 'has role'].includes(link.predicate) && link.source == d) {
      link.target['enabled'] = false
      // Append the class name to the 'roleNames' string
      if (roleNames.length > 0) {
       roleNames += ", "; // Add a comma and space if not the first class
      }
      roleNames += link.target.label;
    }
  }

  if (roleNames.length > 0) {
    // Split roleNames by comma and join with line breaks
    var rolesArray = roleNames.split(',');
    formattedRoles = rolesArray.join(",\n");
  
    // Display the formatted roles
    infoContainer.innerHTML += "<p>Roles: " + formattedRoles + "</p>";
    roleNames = '\nRoles: ' + roleNames;
    formattedRoles = '\nRoles: ' + formattedRoles
  }


  textElement = thisElement.select("text")

  let textNode = thisElement.select("text").node();
  let width = textNode.getComputedTextLength();
  console.log(textNode.textContent);
  console.log('this is the width ' + width);


  //console.log('text element ' + textElement)
  textElement.selectAll("tspan").remove();
  //console.log('text element ' + textElement)
  
  //additions = formattedTypes + formattedRoles
  additions = formattedRoles

  // Split the newText into an array of lines
  var lines = additions.split('\n');
  
  // Add a tspan element for each line
  textElement.selectAll("tspan")
    .data(lines)
    .enter()
    .append("tspan")
    .text(function(d) { return d;})
    .attr("x", 5)
    //.attr("dy", function(d, i) { return (i) * 15; }); // Adjust the line height as needed
    .attr("dy", function(d, i) { return  15; }); // Adjust the line height as needed
  
  // Update the dimensions of the rectangles
  var textElement = thisElement.select("text").node();
  //console.log('text element ' + textElement)
  var textHeight = textElement.getBBox().height;
  var padding = 10; // Adjust thisElement value as needed
  thisElement.select("rect")
    .attr("width", Math.max(width, textElement.getBBox().width + padding * 2))
    .attr("height", textHeight + 20);

}

// Peek at the top element without removing it
function peek(stack) {
  if (stack.length === 0) {
    //console.log("Stack is empty");
    return undefined;
  }

  return stack[stack.length - 1];
}

function shortestDistance(startNode, endNode) {
  // Check if the start and end nodes are valid
  if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
    return Infinity; // Invalid nodes, return infinity as distance
  }

  // Create a queue to perform breadth-first search (BFS)
  const queue = [{ node: startNode, distance: 0 }];

  // Keep track of visited nodes
  const visited = new Set();

  while (queue.length > 0) {
    const { node, distance } = queue.shift();

    // Check if the current node is the destination
    if (node === endNode) {
      return distance; // Return the shortest distance
    }

    // Mark the current node as visited
    visited.add(node);

    // Find neighbors of the current node
    const neighbors = graph.links
      .filter(link => link.source === node || link.target === node)
      .map(link => (link.source === node ? link.target : link.source));

    // Enqueue unvisited neighbors
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push({ node: neighbor, distance: distance + 1 });
      }
    }
  }

  return Infinity; // No path found, return infinity as distance
}


function setrdf(triplesvar, targetvar) {
  triples = triplesvar;
  targetNode = targetvar;
}

function startHere() {

  svgBody = d3.select("#svg-body");

  scrollContainer = svgBody.append("div")
    .style("overflow", "auto")
    .style("width", "100%")
    .style("max-height", "600px")
    .style("overflow-x", "auto")
    .style("overflow-y", "auto");

  // Append SVG element
  svg = scrollContainer.append("svg")
    .attr('width', 1200)
    .attr('height', 600)
    //.append("g");

  width = 1200;
  height = 600;
  
  active = d3.select(null);
  activeId = null

  zoom = d3.zoom()
    .scaleExtent([1 /2, 4])
    .on("zoom", zoomed);


  triplesToGraph(triples);
  simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) {
      return d.id;
    }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));;

  stack = []
  initializeDisplay();
  initializeSimulation();
}

function initializeSimulation() {

  //const nodeWithLocation = graph.nodes.find(node => node.id === "http://purl.obolibrary.org/obo/OOSTT_154/trauma_medical_director");
  //const nodeWithLocation = graph.nodes.find(node => node.id === "http://purl.obolibrary.org/obo/OOSTT_154/trauma_program");
  const nodeWithLocation = graph.nodes.find(node => node.id === targetNode);
  //const nodeWithLocation = targetNode
  //console.log(nodeWithLocation)
  nodeWithLocation.x = width * .025; // Set the desired x-coordinate
  nodeWithLocation.fx = width * .025; // Set the desired x-coordinate
  //console.log(width * .025)
  //console.log(nodeWithLocation.fx)
  nodeWithLocation.y = height * .5; // Set the desired y-coordinate
  nodeWithLocation.fy = height * .5; // Set the desired y-coordinate

  categories = {}
  categoryBoxes = []

  focus = targetNode;
  stack = [];
  pinnedStacks = {}
  labels = [];
  boxes = [];
  stack.push(focus.id);
  //console.log('stack ' + stack)

  activeId = focus;
  //var getAllParentChildren = getAllChildrenOfFocus(focus);
  //for (var child of getAllParentChildren.children) {
  //  if (child !== focus.id) {
  //   //console.log(child)
  //    var nodeToChange = graph.nodes.find(node => node.id == child)
  //    nodeToChange.fx = width * .2;
  //  }
  //}
  for (var node of graph.nodes) {
    if (node.id !== focus) {
      //distance = shortestDistance(node, focus); 
      //console.log(distance)
      //node.level = distance
      node.fx = width * .2 * node.level + (width * .025)
      if (node.level > 1) {
        node.enabled = false
      }
      nodes.style('opacity', function(o){
        if(o.enabled) {
          return 1;
        }else return 0;
      });
    }
  }

  for (var link of graph.links) {
    //console.log('target level' + link.target.level)
    if (link.source.id == peek(stack) && link.target.level > link.source.level) {
      //console.log('link')
      //console.log(link)
      if (!['bearer of', 'bearer_of', 'has role', 'is a'].includes(link.predicate)){
        if (categories[link.predicate]) {
          categories[link.predicate].push(link.target.id)
        } else {
          categories[link.predicate] = [link.target.id]
        }
      }
    }
  }
 //console.log(categories)

  // Set to store unique values
  let uniqueValues = new Set();
  
  // Loop through each key in the dictionary
  for (let key in categories) {
    let value = categories[key];
  
    // Check if the value is unique
    if (!uniqueValues.has(value)) {
      categoryBoxes.push(value)
      //console.log("Unique value:", value);
      
      // Add the value to the set
      uniqueValues.add(value);
    }
  }

  


  //console.log('stack ' + stack)
  updateDisplay()



  simulation.nodes(graph.nodes);
  initializeForces();
  //simulation.on("tick", ticked);

  textElement = svg.selectAll("text")
  textElement.selectAll("tspan").remove();


  elements = svg.selectAll('g')
  elements.each(function() {
    //var textHeight = this.select('text').getBBox().height;
    textElement = d3.select(this).select('text')
    var textHeight = textElement.node().getBBox().height;

    var padding = 10; // Adjust this value as needed
  
    d3.select(this).select("rect")
      .attr("width", textElement.node().getBBox().width + padding * 2)
      .attr("height", textHeight + padding * 2);
  });
  //console.log('focus ' + focus)

  selectNode = graph.nodes.find(node => node.id == focus);
  //console.log(selectNode)
  clicked(selectNode)
  //updateDisplay()
  clicked(selectNode)
  //updateDisplay()

}

function printRDF(triples) {
  //console.log(triples)
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
    //console.log('init forces');
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
	graph={nodes:[], links:[]};

	//Initial Graph from triples
	triples.forEach(function(triple){
		var subjId = triple.subject;
		var predId = triple.predicate;
		var objId = triple.object;
		var subjLabel = triple.slabel;
		var predLabel = triple.plabel;
		var objLabel = triple.olabel;

    if (predId == 'http://www.w3.org/2000/01/rdf-schema#label') {
      return;
    }

   //console.log('start here')
    if (predLabel == 'has part') {
     //console.log('has part ' + subjLabel)
    }
    //if (subjLabel.startsWith("x") && subjLabel.length === 22) {
    //  subjLabel = 'bnode'
    //}

    let anotherDictionary = {
      "bnode:http://cafe-trauma.com/bnode/orth4072": "Orthopedic Liaison",
      "bnode:http://cafe-trauma.com/bnode/ns4072": "Neurosurgury Liaison",
      "bnode:http://cafe-trauma.com/bnode/cc4072": "Critical Care Liaison",
      "bnode:http://cafe-trauma.com/bnode/ra4072": "Radiology Liaison",
      "bnode:http://cafe-trauma.com/bnode/u4073": "Program Staff",
      "bnode:http://cafe-trauma.com/bnode/an4072": "Anesthesiology Liaison",
      "http://purl.obolibrary.org/obo/OOSTT_167/emergency_medicine_liaison": "Emergency Medicine Liaison",
      "bnode:http://cafe-trauma.com/bnode/y4098": "Critical Care Trauma Surgeons more text more more more",
      "bnode:http://cafe-trauma.com/bnode/v4123": "Central Arkansas",
      "bnode:http://cafe-trauma.com/bnode/v4122": "Northeast Arkansas",
      "http://purl.obolibrary.org/obo/GEO_000000151": "Geographic Region",
      "bnode:http://cafe-trauma.com/bnode/emr4072": "Emergency Medicine Liaison Role",
      "bnode:http://cafe-trauma.com/bnode/z4089": "Certified Trauma Surgeon Role",
      "bnode:http://cafe-trauma.com/bnode/orthr4072": "Orthopedic Liaison Role",
      "bnode:http://cafe-trauma.com/bnode/nsr4072": "Neurosurgery Liaison Role",
      "bnode:http://cafe-trauma.com/bnode/anr4072": "Anesthesiology Liaison Role",
      "bnode:http://cafe-trauma.com/bnode/ccr4072": "Critical Care Liaison Role",
      "bnode:http://cafe-trauma.com/bnode/rar4072": "Radiology Liaison Role",
      "bnode:http://cafe-trauma.com/bnode/y4073" : "Trauma System Development",
      "bnode:http://cafe-trauma.com/bnode/z4073" : "Trauma System Plan",
      "http://purl.obolibrary.org/obo/OOSTT_167/trauma_program": "Your Trauma Program",
      "bnode:http://cafe-trauma.com/bnode/x4073": "State of Arkansas",


      "bnode:http://cafe-trauma.com/bnode/orth6298": "Orthopedic Liaison",
      "bnode:http://cafe-trauma.com/bnode/ns6298": "Neurosurgury Liaison",
      "bnode:http://cafe-trauma.com/bnode/cc6298": "Critical Care Liaison",
      "bnode:http://cafe-trauma.com/bnode/ra6298": "Radiology Liaison",
      "bnode:http://cafe-trauma.com/bnode/u6299": "Program Staff",
      "bnode:http://cafe-trauma.com/bnode/an6298": "Anesthesiology Liaison",
      "http://purl.obolibrary.org/obo/OOSTT_167/emergency_medicine_liaison": "Emergency Medicine Liaison",
      "bnode:http://cafe-trauma.com/bnode/y6327": "Critical Care Trauma Surgeons more text more more more",
      "bnode:http://cafe-trauma.com/bnode/v6291": "Central Arkansas",
      "bnode:http://cafe-trauma.com/bnode/v6292": "Northeast Arkansas",
      "bnode:http://cafe-trauma.com/bnode/y6324": "General Surgeons current in ATLS",
      "bnode:http://cafe-trauma.com/bnode/y6321": "Emergency Surgeons current in ATLS",
      "bnode:http://cafe-trauma.com/bnode/y6320": "Emergency Physicians",
      "bnode:http://cafe-trauma.com/bnode/y6319": "Emergency Physicians current in ATLS",
      "bnode:http://cafe-trauma.com/bnode/y6325": "Anesthesiologists on trauma panel",
      "bnode:http://cafe-trauma.com/bnode/y6328": "Orthopedic Surgeons on trauma panel with CME",
      "bnode:http://cafe-trauma.com/bnode/y6329": "Orthopedic Surgeons on trauma panel",
      "bnode:http://cafe-trauma.com/bnode/y6330": "Orthopedic Surgeons with on call exclusivity",
      "bnode:http://cafe-trauma.com/bnode/y6331": "Board certified Neurosurgeons on trauma panel",
      "bnode:http://cafe-trauma.com/bnode/y6332": "Neurosurgeons on trauma panel with CME",
      "bnode:http://cafe-trauma.com/bnode/y6333": "Neurosurgeons with on call exclusivity",
      "bnode:http://cafe-trauma.com/bnode/y6334": "Trauma Surgeons on trauma panel with CME",
      "bnode:http://cafe-trauma.com/bnode/y6335": "Trauma Surgeons with on call exclusivity",
      "bnode:http://cafe-trauma.com/bnode/y6336": "TMD-approved orthopedic surgeon backup call schedule",
      "bnode:http://cafe-trauma.com/bnode/z6324": "6",
      "http://purl.obolibrary.org/obo/OBI_0000295": "Count:",
      "is_specified_input_of": "Count:",
      "bnode:http://cafe-trauma.com/bnode/z6333": "2",
      "bnode:http://cafe-trauma.com/bnode/z6332": "3",
      "has value specification": "has value",
      "https://cafe-trauma.com/cafe/mean_los/mean_los_1": "mean length of stay",
      "https://cafe-trauma.com/cafe/mortality/mortality_1": "mortality rate",
      "https://cafe-trauma.com/cafe/patient_population/patient_population_1": "Your patient population",
      "http://purl.obolibrary.org/obo/OOSTT/temp/has_patient_outcome_measure": "has patient outcome measure",
      "http://purl.obolibrary.org/obo/OOSTT/temp/serves_population": "serves population",
      
    };


    //replacement text for demo
    if (anotherDictionary.hasOwnProperty(subjLabel)) {
      //console.log('match')
      subjLabel = anotherDictionary[subjLabel]
    }

    if (anotherDictionary.hasOwnProperty(predLabel)) {
      //console.log('match')
      predLabel = anotherDictionary[predLabel]
    }

    if (objLabel.startsWith("x") && objLabel.length === 22) {
      //console.log('match')
      objLabel = 'bnode'
    }

    if (anotherDictionary.hasOwnProperty(objLabel)) {
      objLabel = anotherDictionary[objLabel]
    }

    if (subjLabel.startsWith('bnode') || objLabel.startsWith('bnode')) {
      //return;
    }


		var subjNode = filterNodesById(graph.nodes, subjId)[0];
		var objNode  = filterNodesById(graph.nodes, objId)[0];


    //level = distance from focus
		if(subjNode==null){
      if (predLabel == 'has part') {
       //console.log('insert subj ' + subjLabel)
       //console.log('obj would be ' + objLabel)
      }
			subjNode = {id:subjId, label:subjLabel, weight:1, level:null, enabled:true, pinned:false};
      //console.log(subjId)
			graph.nodes.push(subjNode);
		}

		if(objNode==null){
      if (predLabel == 'has part') {
       //console.log('insert obj ' + objLabel)
      }
			objNode = {id:objId, label:objLabel, weight:1, level:null, enabled:true, pinned:false};
			graph.nodes.push(objNode);
		}

    // IMPORTANT NOTE:  Only displays the first link created, not the most important.
    // Needs to have some way of prioritizing.
    // Assuming graph is your graph object
    //let linkExists = false;
    //
    //for (let i = 0; i < graph.links.length; i++) {
    //  const link = graph.links[i];
    //
    //  if (link.source === subjNode && link.target === objNode)  {
    //    linkExists = true;
    //    break;
    //  }
    //}
    
   // if (linkExists) {
   //  //console.log("The link already exists in the graph.");
   // } else {
      // Add the link to the graph
      graph.links.push({source: subjNode, target: objNode, predicate: predLabel, weight: 1});
   // }


	});



  //focus = graph.nodes.find(node => node.id === "http://purl.obolibrary.org/obo/OOSTT_154/trauma_program");
  focus = graph.nodes.find(node => node.id === targetNode);
  //console.log(targetNode)
  //console.log(focus)
  //console.log('updating')
  updateDistances()

  // Create a set to store unique source-target combinations
  const uniqueLinks = new Set();
  
  // Iterate through links in reverse order
  for (let i = graph.links.length - 1; i >= 0; i--) {
    const link = graph.links[i];
    // Your existing condition for removing links based on level
    if (link.source.level > link.target.level) {
      graph.links.splice(i, 1);
      continue;
    }
  
    // Check if the source and target combination is already in the set
    const linkKey = `${link.source.id}-${link.target.id}`;
    if (uniqueLinks.has(linkKey)) {
      // If duplicate, remove the link from the array
      graph.links.splice(i, 1);
    } else {
      // If not a duplicate, add the combination to the set
      uniqueLinks.add(linkKey);
    }
  
  }
  updateDistances()

	return graph;
}

function updateDistances() {
  checkLinks = graph.links

  focus.level = 0
  removedLinks = ['initial']
  updatedLinks = []
  curLevel = 0

  while (removedLinks.length > 0) {
   //console.log('curlevel ' + curLevel)
    var { removedLinks, updatedLinks } = checkLinks.reduce(
      (result, link) => {
        //console.log('even working?')
        if (link.source.level == curLevel) {
          //console.log('level equal')
          //console.log(link.target.level)
          if (link.target.level === null) {
            link.target.level = curLevel + 1
            //console.log('adding target level ' + curLevel + 1)
          }
          result.removedLinks.push(link);
        } else {
          result.updatedLinks.push(link);
          //console.log('no target')
        }
        return result;
      },
      { removedLinks: [], updatedLinks: [] }
    );
    checkLinks = updatedLinks
    curLevel = curLevel + 1
  }
 //console.log('loop oer')





  //console.log('here')
  const nodesToRemove = [];
  for (var node of graph.nodes) {
    //console.log(distance)
    if (node.level === null) {
        //console.log('removing infinity')
        if (node.id.includes('y4100')) {
          //console.log('infinity removed')
        }
        nodesToRemove.push(node);
    }
  }
  

  // Remove nodes with distance infinity from graph.nodes
  nodesToRemove.forEach((nodeToRemove) => {
    const index = graph.nodes.indexOf(nodeToRemove);
    if (index !== -1) {
      graph.nodes.splice(index, 1);
    }
    // Remove links associated with the removed node
    graph.links = graph.links.filter(link => {
      return link.source !== nodeToRemove && link.target !== nodeToRemove;
    });
  });
}

function initializeDisplay(){
  //console.log('init display');
	// ==================== Add Marker ====================
	svg.append("svg:defs").selectAll("marker")
	    .data(["end"])
	  .enter().append("svg:marker")
	    .attr("id", String)
	    .attr("viewBox", "0 -5 10 10")
	    .attr("refX", 10)
	    .attr("refY", -0.5)
	    .attr("markerWidth", 6)
	    .attr("markerHeight", 6)
	    .attr("orient", "auto")
	  .append("svg:polyline")
	    .attr("points", "0,-5 10,0 0,5")
	    ;



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
					.text( function (d) { return 'x'; })
				;
  
		//nodeTexts.append("title")
		//		.text(function(d) { return d.label; });

	// ==================== Add Node =====================
  //


// Append a group for each node
nodes = svg.append("g")
  .attr("class", "nodes")
  .selectAll("g")
  .data(graph.nodes)
  .enter()
  .append("g")
  .attr("class", "node")
  .attr("id", d => d.id.replace(/[^a-zA-Z0-9_-]/g, "_")) // Sanitize the id
  //.attr("id", d => CSS.escape(d.id)) // Bind the id from graph.nodes to the SVG element
  .on('dblclick', doubleClickEvent)
  .on('click', clicked);



// Append a rectangle around each text element
nodes.append("rect")
  .attr("length", function(d) {
    const textWidth = this.parentNode.width; // Calculate the text width
    const padding = 10; // Adjust this value as needed
    return textWidth + padding * 2; // Add padding on both sides
  })
  .attr("height", 20) // You can adjust the height as needed
  .attr('y', -12)
  .attr("rx", 5) // Optional: round corners
  .attr("ry", 5); // Optional: round corners

// Append a text element to each group
nodes.append("text")
  .text(function(d) {
      const lastSlashIndex = d.label.lastIndexOf('/');
      let text = "";
      if (lastSlashIndex >= 0) {
        text = d.label.substring(lastSlashIndex + 1);
      } else {
        text = d.label;
      }
      var maxWidth = 185; // Maximum width of the box
      if (d.id == peek(stack)) {maxWidth = 1000;}
      const textWidth = getTextWidth(text, "12px Arial"); // Function to get text width
      if (textWidth > maxWidth) {
        const ellipsisWidth = getTextWidth("...", "12px Arial");
        const availableWidth = maxWidth - ellipsisWidth;
        let truncatedText = "";
        for (let i = 0; i < text.length; i++) {
          const newText = truncatedText + text[i] + "...";
          const newWidth = getTextWidth(newText, "12px Arial");
          if (newWidth > availableWidth) {
            break;
          }
          truncatedText += text[i];
        }
        return truncatedText + "...";
      }
      return text;
    // const lastSlashIndex = d.label.lastIndexOf('/');
    // if (lastSlashIndex >= 0) {
    //   const substringAfterLastSlash = d.label.substring(lastSlashIndex + 1);
    //   return substringAfterLastSlash.length <= 25
    //     ? substringAfterLastSlash
    //     : substringAfterLastSlash.substring(0, 25) + '...';
    // } else {
    //   return d.label.length <= 20
    //     ? d.label
    //     : d.label.substring(0, 20) + '...';
    // }
  })
  .style("font-size", "12px")
  .style('fill', 'white');

nodes.each(function() {
  var textWidth = this.getBBox().width; // Get the width of the text element
  var padding = 10; // Adjust this value as needed
  d3.select(this).select("rect")
    .attr("width", textWidth + padding * 2); // Set the width of the rectangle
});

    
  // Dynamically set the width of the rectangles based on the text length
nodes.each(function() {
  const text = d3.select(this); // Select the text element
  const textWidth = this.getBBox().width; // Calculate the text width

  // You can add some padding if needed
  const padding = 10; // Adjust this value as needed

  // Select the corresponding rectangle and set its width
  d3.select(this.parentNode) // Select the parent (the rectangle's container)
    .attr("width", textWidth + padding);
});

	// ==================== Add Links ====================
  //console.log('nodes')
  //console.log(nodes)
	links = svg.selectAll(".link")
						.data(graph.links)
						.enter()
      .append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .attr("marker-end", "url(#end)")

	// ==================== Force ====================
	// ==================== Run ====================
}

function clicked(d){
  //ticked();

  //console.log('stack ' + stack)
 //console.log("clicked");
  
  //console.log("CLICKED");
  //console.log(d);


  textElement = svg.selectAll("text")
  textElement.selectAll("tspan").remove();


  elements = svg.selectAll('g')
  elements.each(function() {
    //var textHeight = this.select('text').getBBox().height;
    textElement = d3.select(this).select('text')
    var textHeight = textElement.node().getBBox().height;

    var padding = 10; // Adjust this value as needed
  
    d3.select(this).select("rect")
      //.attr("width", textElement.node().getBBox().width + padding * 2)
      .attr("width", 210)
      .attr("height", textHeight + padding * 2);
  });



  //console.log('activeId ' + activeId)
  //console.log('d.id ' + d.id)
  //console.log('d ' + d)

  if (activeId === d.id){
    activeId = null
    if (d.level >=0 ) {
      stack.pop()
      activeId = stack[stack.length-1]
    }
    //console.log('same active id')
    for (var node of graph.nodes) {
      node['enabled'] = false

      if (node['id'] == activeId || node['id'] == targetNode) {
        node['enabled'] = true
      }

      if (stack.includes(node['id'])) {
        node['enabled'] = true
      }

      //console.log(pinnedStacks)
      for (const [key, pinStack] of Object.entries(pinnedStacks)) {
        console.log(`${key}: ${pinStack}`);
        if (pinStack.includes(node['id'])) {
          node['enabled'] = true
          console.log('enabling pinned entry')
        }
      }


      stackNode = graph.nodes.find(node => node.id === activeId)
      distance = shortestDistance(stackNode, node)
      //if (node['id'].includes('y4100')) {
      // //console.log('info')
      // //console.log(stackNode)
      // //console.log(node)
      // //console.log(distance)
      //}
      if (node['level'] == d['level'] && distance == 1) {
        node['enabled'] = true
        //if (node['id'].includes('y4100')) {
        // //console.log('enabled')
        // //console.log(node['id'])
        //}
      }
    }
    nodes.style('opacity', function(o){
      if(o.enabled) {
        return 1;
      }else return 0;
    });
    nodes.style('pointer-events', function(o){
      if(o.enabled) {
        return 'auto';
      }else return 'none';
    });


    thisNode = d
    if (thisNode.level != 0) {
      const textElement = d3.selectAll(".node").filter(function (d) {
        return d.id == peek(stack);

      });
      updateDisplay()
      parentNode = graph.nodes.find(node => node.id === peek(stack))
      //console.log(stack)
      //console.log('peek ' + peek(stack))
      //console.log('add labels parent')
      //console.log('parent node ' + parentNode)
      addLabels(parentNode, textElement)
      //console.log('add labels')
      //console.log(textElement)
    }
    
    var enabledNodes = graph.nodes.filter(node => node.enabled);

    // Update the simulation to use the enabledNodes array
    simulation.nodes(enabledNodes);

    var disabledNodes = graph.nodes.filter(node => node.enabled == false);
    // Using the forEach() method
    disabledNodes.forEach((node) => {
      // Iterate over each disabled node
      // You can access properties of each node like node.propertyName
      node.collideRadius = null;
      node.radialRadius = null;
      //console.log('disabled')
      //console.log(node);
    });

    categories = []
    for (var link of graph.links) {
      //console.log('target level' + link.target.level)
      if (link.source.id == peek(stack) && link.target.level > link.source.level) {
        //console.log('link')
        //console.log(link)
        if (!['bearer of', 'bearer_of', 'has role', 'is a'].includes(link.predicate)){
          if (categories[link.predicate]) {
            categories[link.predicate].push(link.target.id)
          } else {
            categories[link.predicate] = [link.target.id]
          }
        }
      }
    }
    //console.log(categories)

    //simulation.alpha(1).restart();
    updateDisplay();
    //console.log(stack.length)
    //console.log(stack)
    ticked();
    return reset();
  }

  active = d3.select(this)
  activeId = d.id
  clickedNode = graph.nodes.find(node => node.id === activeId)
  findNode =graph.nodes.find(node => node.id === stack[stack.length-1])
  

  //console.log(pinnedStacks)
  for (const [key, pinStack] of Object.entries(pinnedStacks)) {
    console.log(`${key}: ${pinStack}`);
    if (pinStack.includes(activeId)) {
      console.log('path should be pinned')
      stack = [...pinStack];
    }
  }


  //console.log("THE STACK");
  //console.log(stack);

  //only works for 'main' path.  need to add logic for pinned stack replacement
  while (stack.length >= 1 && graph.nodes.find(node => node.id === stack[stack.length-1]).level >= clickedNode.level) {
    stack.pop()
  }

  stack.push(activeId)
  //active.classed("active", true);

  categories = []
  for (var link of graph.links) {
    //console.log('target level' + link.target.level)
    if (link.source.id == peek(stack) && link.target.level > link.source.level) {
      //console.log('link')
      //console.log(link)
      if (!['bearer of', 'bearer_of', 'has role', 'is a'].includes(link.predicate)){
        if (categories[link.predicate]) {
          categories[link.predicate].push(link.target.id)
        } else {
          categories[link.predicate] = [link.target.id]
        }
      }
    }
  }
  //console.log(stack.length)
  //console.log(stack)

  var infoContainer = document.getElementById("info-container");
  
  infoContainer.innerHTML = "Clicked element: " + d.id;
  infoContainer.innerHTML += "<p>Label (not rdf:label): " + d.label + "</p>";

  for (var node of graph.nodes) {
    node['enabled'] = false
    if (node['id'] == activeId || node['id'] == targetNode) {
      node['enabled'] = true
    }

    if (stack.includes(node['id'])) {
      node['enabled'] = true
    }

    //console.log(pinnedStacks)
    for (const [key, pinStack] of Object.entries(pinnedStacks)) {
      console.log(`${key}: ${pinStack}`);
      if (pinStack.includes(node['id'])) {
        node['enabled'] = true
        console.log('enabling pinned entry')
      }
    }

    if (node !== d) {
      distance = shortestDistance(d, node)
      if (node['level'] > d['level'] && distance ==1) {
        node['enabled'] = true
      } 
    }
  }


  //parentNode = graph.nodes.find(node => node.id === peek(stack))
  findId = d.id
  const findElement = d3.selectAll(".node").filter(function (d) {
    return d.id == findId;

  });

  updateDisplay()
  //console.log("FIND CLICK");
  //console.log(findElement);
  //console.log('add labels this')
  //console.log('d ' + d)
  //console.log('this ' + d3.select(this))
  //console.log(d3.select(this))
  //addLabels(d, d3.select(this))
  addLabels(d, findElement)
  //console.log('add labels')
  //console.log(textElement)

  nodes.style('opacity', function(o){
    if(o.enabled) {
      return 1;
    }else return 0;
  });
  nodes.style('pointer-events', function(o){
    if(o.enabled) {
      return 'auto';
    }else return 'none';
  });


  var enabledNodes = graph.nodes.filter(node => node.enabled);

  // Update the simulation to use the enabledNodes array
  simulation.nodes(enabledNodes);

  var disabledNodes = graph.nodes.filter(node => node.enabled == false);
  // Using the forEach() method
  disabledNodes.forEach((node) => {
    // Iterate over each disabled node
    // You can access properties of each node like node.propertyName
    node.collideRadius = null;
    node.radialRadius = null;
    //console.log('disabled')
    //console.log(node);
  });

  simulation.alpha(1).restart();
  updateDisplay()
  ticked();

  //zoom
  //svg.transition()
  //  .duration(750)
  //  .call(zoom.transform,
  //    d3.zoomIdentity
  //    .translate(width / 2, height / 2)
  //    .scale(8)
  //    .translate(-(+active.attr('cx')), -(+active.attr('cy')))
  //  );

}

function dragstarted(d) {
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
    nodes.style('opacity', function(o){
      if(o.enabled) {
        return 1;
      }else return 0;
    });
    nodeTexts.style('opacity', function(o){
      if(o.enabled) {
        return 1;
      }else return 0;
    });
    links.style('opacity', function(o){
      if(o.source.enabled && o.target.enabled) {
        return 1;
      }else return 0;
    });
    linkTexts.style('opacity', function(o){
      if(o.source.enabled && o.target.enabled) {
        return 0;
      }else return 0;
    });
    nodes.style('fill', function(o){
      if (activeId == o.id) {
        return 'green'
      } else if (stack.includes(o.id)) {
        return 'blue'
      } else {
        return 'LightSlateGray'
      }
    })
  ;

  var activeNode = nodes.filter(function(o){return (activeId == o.id)})
  var stackNodes = nodes.filter(function(o){return (activeId != o.id && stack.includes(o.id))})
  var categoryNodes = nodes.filter(function(o){return (activeId != o.id && !stack.includes(o.id))})

  //activeNode.selectAll('rect').style('fill', 'green').style('height', function(o){}).style('stroke', 'none')
  //activeNode.selectAll('text').style('fill', 'white')
  //stackNodes.selectAll('rect').style('fill', 'blue').style('height', function(o){}).style('stroke', 'none')
  //stackNodes.selectAll('text').style('fill', 'white')
  //categoryNodes.selectAll('rect').style('fill', 'white').style('height', 20).style('stroke', function(o) {
  //  if (o.id.startsWith("gen")) {
  //    return 'blue'
  //  } else {
  //    return 'red'
  //  }
  //})
  //categoryNodes.selectAll('text').style('fill', 'black').attr('transform', 'translate(5, 0)');
  
  nodes.selectAll('rect').style('fill', 'white').style('height', 20).style('stroke', function(o) {
    var nodeType = findType(o);
    if (nodeType == 'person' || nodeType == 'people') {
      return 'blue'
    } else if (nodeType == 'geographic') {
      return 'green'
    } else {
      return 'red'
    }
  })
      .on("mouseover", function() {
        d3.select(this).style("fill", "orange");
      })
      .on("mouseout", function() {
        d3.select(this).style("fill", "white");
      });
  nodes.selectAll('text').style('fill', 'black').style('pointer-events', 'none').attr('transform', 'translate(5, 0)')
    .select(function() {
        return this.firstChild; // Select only the first child node
    }).text(function(d) {
        const lastSlashIndex = d.label.lastIndexOf('/');
        let text = "";
        if (lastSlashIndex >= 0) {
          text = d.label.substring(lastSlashIndex + 1);
        } else {
          text = d.label;
        }
        var nodeType = findType(d);
        if (nodeType == 'person') {
          text = '👤 ' + text;
        } else if (nodeType == 'people') {
          text = '👥 ' + text;
        } else if (nodeType == 'geographic') {
          text = '🌐 ' + text;
        }
        
        var maxWidth = 185; // Maximum width of the box
        if (d.id == peek(stack)) {maxWidth = 1000;}
        const textWidth = getTextWidth(text, "12px Arial"); // Function to get text width
        if (textWidth > maxWidth) {
          const ellipsisWidth = getTextWidth("...", "12px Arial");
          const availableWidth = maxWidth - ellipsisWidth;
          let truncatedText = "";
          for (let i = 0; i < text.length; i++) {
            const newText = truncatedText + text[i] + "...";
            const newWidth = getTextWidth(newText, "12px Arial");
            if (newWidth > availableWidth) {
              break;
            }
            truncatedText += text[i];
          }
          return truncatedText + "...";
        }
        return text;
      // const lastSlashIndex = d.label.lastIndexOf('/');
      // if (lastSlashIndex >= 0) {
      //   const substringAfterLastSlash = d.label.substring(lastSlashIndex + 1);
      //   return substringAfterLastSlash.length <= 25
      //     ? substringAfterLastSlash
      //     : substringAfterLastSlash.substring(0, 25) + '...';
      // } else {
      //   return d.label.length <= 20
      //     ? d.label
      //     : d.label.substring(0, 20) + '...';
      // }
    })
    
  rectHeight = 0
  activeNode.selectAll('text').each(function(d) {
    // `this` refers to the current `<rect>` element in the iteration
    rectHeight = this.getBBox().height;
    //console.log("Height of node", d.id, ":", rectHeight);
});


  activeNode.selectAll('rect').style('height', rectHeight + 6) 





    //nodes
    //    .attr("r", 8) 
    //    //.attr("r", forceProperties.collide.radius)
    //    .attr("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
    //    .attr("stroke-width", forceProperties.charge.enabled==false ? 0 : Math.abs(forceProperties.charge.strength)/15);

    links
        .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

function updateAll() {
  updateForces();
  updateDisplay();
}

function updateForces() {

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

function calculateNodeWidth(node) {
  // Select the text element associated with the node
  
  const textElement = d3.select(".nodes").selectAll('text').filter(function (d) {
    return d == node;
  });

  //console.log(textElement.node())
  // Get the computed text length of the label
  const textLength = textElement.node().getComputedTextLength();

  // Optionally, add padding or multiplier as needed
  const width = textLength; // You can adjust this as needed

  return width;
}

function ticked() {
  currentArrows = []
  arrowLinks = svg.selectAll(".arrowlink")
    .data(currentArrows);
  arrowLinks.exit().remove();
  svg.selectAll(".pin-hitarea").remove();
  svg.selectAll(".pin").remove();


  for (let label of labels) {
    label.remove()
  }

  for (let box of boxes) {
    box.remove()
  }
  
  if (activeId != null) {
    //console.log(activeId)
    activeNode = graph.nodes.find(node => node.id === activeId)
    activeNode.x = width * .2 * activeNode.level + (width * .025)
    activeNode.fx = width * .2 * activeNode.level + (width * .025)
    activeNode.y = height * .5; // Set the desired y-coordinate
    activeNode.fy = height * .5; // Set the desired y-coordinate
  }

  //pinned 'stacks' will be a dict of lists
  //key is 'pinned' id
  //values are a list of nodes
  //
  //for each level put the enabled nodes (in order they appear in the dict)
  //a dict doesn't have order.  find a way (alpha by keys?)
  //bottom of offset is activeId or current stack node

	//nodes
	//	//.attr("x", function(d){ return d.x; })
	//	//.attr("y", function(d){ return d.y; })
  //  .attr("transform", function(d) {
  //      return "translate(" + d.x + "," + d.y + ")";
  //  }).filter(function(d) {
  //      return stack.includes(d.id);
  //  }).attr("transform", function(d) {
  //      return "translate(" + d.x + ", " + height/2 + ")"
  //  });
  //
  const levelCounts = {};

  for (const node of graph.nodes) {
    if (node.enabled == true) {
      const level = node.level;
      if (level in levelCounts) {
        levelCounts[level]++;
      } else {
        levelCounts[level] = 1;
      }
    }
  }


  const offsetCounts = {};

  nodes.selectAll(".pin").remove();
  maxOffset = 0;
  nodes.each(function(d) {
    const level = d.level;
    if (d.enabled == true) {
      if (level in offsetCounts) {
        offsetCounts[level] ++;
      } else {
        offsetCounts[level] = 1;
      }
    }

      const pinPath = "M13.5538 2.66232C14.4174 1.85314 15.75 1.85663 16.6089 2.64211L16.7341 2.7658L21.4991 7.85135C21.6191 7.97942 21.7237 8.12108 21.8108 8.27345C22.4005 9.30545 22.0832 10.6078 21.1103 11.2587L20.9736 11.3433L16.0771 14.1413C15.9593 14.2086 15.8626 14.3062 15.7964 14.4232L15.7526 14.5144L13.9505 19.028C13.7641 19.4949 13.1888 19.6418 12.8033 19.3497L12.7237 19.2804L9.48597 16.0442L4.53489 21.0033L3.46997 21L3.47201 19.9449L8.42497 14.9832L5.22008 11.7804C4.86452 11.425 4.95639 10.8384 5.37685 10.5992L5.47194 10.5535L9.96721 8.7569C10.0987 8.70436 10.2119 8.61598 10.2946 8.50278L10.3506 8.4134L13.1069 3.24538C13.2229 3.02786 13.3739 2.83088 13.5538 2.66232ZM20.4045 8.87696L15.6395 3.7914C15.3563 3.48914 14.8817 3.4737 14.5794 3.75691C14.5394 3.79437 14.5037 3.83604 14.4729 3.88114L14.4304 3.95127L11.6742 9.11929C11.4521 9.53569 11.1055 9.87036 10.685 10.078L10.5239 10.1498L7.08541 11.524L12.9793 17.4151L14.3596 13.9582C14.5246 13.5449 14.8079 13.1911 15.172 12.9401L15.3329 12.8389L20.2293 10.0409C20.589 9.83544 20.7139 9.3773 20.5084 9.01766L20.4606 8.94427L20.4045 8.87696Z" 
      const unpinPath = "M3.28034 2.21968C2.98745 1.92678 2.51257 1.92677 2.21968 2.21966C1.92678 2.51255 1.92677 2.98743 2.21966 3.28032L8.34462 9.4054L5.47194 10.5535L5.37685 10.5992C4.95639 10.8384 4.86452 11.425 5.22008 11.7804L8.42497 14.9832L3.47201 19.9449L3.46997 21L4.53489 21.0033L9.48597 16.0442L12.7237 19.2804L12.8033 19.3497C13.1888 19.6418 13.7641 19.4949 13.9505 19.0281L15.0966 16.1575L20.7194 21.7805C21.0123 22.0734 21.4872 22.0734 21.7801 21.7805C22.073 21.4876 22.073 21.0127 21.7801 20.7198L3.28034 2.21968ZM13.9423 15.0032L12.9793 17.4151L7.08541 11.524L9.49871 10.5595L13.9423 15.0032Z M20.2293 10.041L15.7706 12.5888L16.87 13.6882L20.9736 11.3433L21.1103 11.2587C22.0832 10.6078 22.4005 9.30546 21.8108 8.27346C21.7237 8.12109 21.6191 7.97942 21.4991 7.85136L16.7341 2.76581L16.6089 2.64212C15.75 1.85664 14.4174 1.85315 13.5538 2.66233C13.3739 2.83089 13.2229 3.02787 13.1069 3.24539L10.7836 7.60169L11.8922 8.7104L14.4304 3.95127L14.4729 3.88115C14.5037 3.83605 14.5394 3.79438 14.5794 3.75692C14.8817 3.47371 15.3563 3.48915 15.6395 3.79141L20.4045 8.87697L20.4606 8.94428L20.5084 9.01767C20.7139 9.3773 20.589 9.83544 20.2293 10.041Z"

    if (activeId == d.id || ((activeId != d.id) && d.pinned)) {
      const nodeWidth = d3.select(this).select("rect").node().getBBox().width;


// remove existing circles with that class
d3.select(this).selectAll(".pin-hitarea").remove();

// then add a fresh one
d3.select(this)
  .append("circle")
  .attr("class", "pin-hitarea")
  .attr("cx", nodeWidth - 14)
  .attr("cy", -4)
  .attr("r", 7)
  .style("fill", "transparent")
  .style("pointer-events", "all")
  .on("click", function(d) {
    d3.event.stopPropagation();
    pinClicked(d);
    ticked();
  }).on("mouseover", function () {
    d3.select(this.parentNode).select(".pin")
      .attr("stroke", "black");
  })
  .on("mouseout", function () {
    d3.select(this.parentNode).select(".pin")
      .attr("stroke", "none");
  });

      d3.select(this)
        .append("path")
        .attr("d", d.pinned ? unpinPath : pinPath)
       .attr("fill", "black")
        .attr("transform", "translate(" + (nodeWidth - 20) + ", -10) scale(0.6)") // scaling down to fit
        .attr("class", "pin")
        .on("click", function(d) {
          d3.event.stopPropagation();
          pinClicked(d);
          ticked();
        }).on("mouseover", function () {
          d3.select(this)
      .attr("stroke", "black");
  }).on("mouseout", function () {
    d3.select(this)
      .attr("stroke", "none");
  });

    }
    if (targetNode == d.id || activeId == d.id) {
      d3.select(this)
        .attr("transform", "translate(" + d.x + ", " + Math.max((height / 2), offsetCounts[level] * 25)  + ")");

    } else if (stack.includes(d.id)) {
      // 'this' refers to the DOM element
      //d3.select(this)
       // .attr("transform", "translate(" + d.x + ", " + (offsetCounts[level] * 25) + ")");
      d3.select(this)
        .attr("transform", "translate(" + d.x + ", " + Math.max((offsetCounts[level] * 25), (height / 2)) + ")");

      //console.log('STACK VALUE')
    } else if (nodeInDict(d.id, pinnedStacks)) {
      order = getNodeStackOrder(d.id, pinnedStacks)
      maxOffset = Math.max(order, maxOffset);
      d3.select(this)
        .attr("transform", "translate(" + d.x + ", " + (order * 30) + ")");

    } else {
      //console.log('STACK VALUE2')
      d3.select(this)
        .attr("transform", "translate(" + d.x + ", " + d.y + ")");
    }
  });





  maxOffset = maxOffset + 1;
  offset = Math.max(50, maxOffset * 30);
  console.log('offset ' + offset);
  console.log('max offset ' + maxOffset);
  //offset = 50;
  labels = []
  boxes = []
  if (stack.length > 0) {
    currentArrows = []

      xVal = stack.length * width * .2 + (width * .025)
      rectElement = svg.select(".nodes").selectAll('rect').filter(function (d) {
        return d.id == activeId;
      });
      //console.log('rect')
      rectWidth = rectElement.attr('width')
      //console.log(rectWidth)
      widthOffset = rectWidth - 190
      if (widthOffset < 0) {widthOffset = 0;}
      xVal = xVal + widthOffset


    for (let key in categories) {
      boxTop = offset
      const valList = categories[key]
      label = svg.append("text")
      .attr("x", xVal) // Adjust the position based on your preference
      .attr("y", offset)
      .text(key)
      .style("text-decoration", "underline")
      .style("font-size", "12px");
      //.style("fill", "white");
      offset += 25
      labels.push(label)


      for (let i = 0; i < valList.length; i++) {
        val = valList[i]
        node = graph.nodes.find( node => node.id === val)
        node.x = xVal
        node.y = offset
        nodes.filter(function(d) {
          // Use a condition to filter nodes
          return d.id == val;
        })
          .attr("transform", function(d) {
            return "translate(" + xVal + "," + offset + ")";
        })
          .attr('x', xVal)
          .attr('y', offset);
        offset += 30
      }
      boxBottom = offset
      box = svg.insert("rect", ":first-child")
        .attr("x", xVal - 5)
        .attr("y", boxTop - 12)
        .attr("width", 220)
        .attr("height", boxBottom - boxTop + 15)
        .attr("rx", 5) // Optional: round corners
        .attr("ry", 5) // Optional: round corners
        //.style("stroke", "black")
        //.style("stroke-width", 2)
        //.style("fill", "LightSlateGray");
        .style("fill", "Gainsboro");
      boxes.push(box)
      rectElement = svg.select(".nodes").selectAll('rect').filter(function (d) {
        return d.id == activeId;
      });
      //console.log('rect')
      rectWidth = rectElement.attr('width')
      rectHeight =  rectElement.attr('height')
      //console.log(rectWidth)
      //currentArrows.push({targetX: stack.length * width * .2 + (width * .025) - 5, targetY: boxTop + ((boxBottom - boxTop) / 2), source: graph.nodes.find(node => node.id === activeId)})
      currentArrows.push({targetX: xVal - 5, targetY: boxTop + ((boxBottom - boxTop) / 2), sourceX: parseFloat(activeNode.x) + parseFloat(rectWidth), sourceY: parseFloat(activeNode.y) })
      console.log(activeNode.x + rectWidth)
      console.log(rectWidth)
      offset += 25
    }
  }

  for (let i = stack.length - 1; i > 0; i --) {

      const fromId = stack[i - 1].replace(/[^a-zA-Z0-9_-]/g, "_"); // Sanitize the id;
      const toId = stack[i].replace(/[^a-zA-Z0-9_-]/g, "_"); // Sanitize the id;
      const fromElem = d3.select(`#${fromId}`).node();
      const toElem = d3.select(`#${toId}`).node();
      console.log(fromElem)



      if (fromElem && toElem) {
        const fromBox = fromElem.getBBox();
        const fromCtm = fromElem.getCTM();
        const toBox = toElem.getBBox();
        const toCtm = toElem.getCTM();
        console.log(fromBox.x)
        console.log(fromBox.y)


        // Calculate the center of each node
        const fromX = (fromBox.x + fromBox.width) * fromCtm.a + (fromBox.y + fromBox.height / 2) * fromCtm.c + fromCtm.e;
        const fromY = fromBox.x * fromCtm.b + (fromBox.y + fromBox.height / 2) * fromCtm.d + fromCtm.f;
        const toX = toBox.x * toCtm.a + (toBox.y + toBox.height / 2) * toCtm.c + toCtm.e;
        const toY = toBox.x * toCtm.b + (toBox.y + toBox.height / 2) * toCtm.d + toCtm.f;
        currentArrows.push({targetX: toX,  targetY: toY,  sourceX: fromX, sourceY: fromY})
      }
  }

  for (const key in pinnedStacks) {
    const curStack = pinnedStacks[key];
    for (let i = 0; i < curStack.length - 1; i++) {

      const fromId = curStack[i].replace(/[^a-zA-Z0-9_-]/g, "_"); // Sanitize the id;
      const toId = curStack[i + 1].replace(/[^a-zA-Z0-9_-]/g, "_"); // Sanitize the id;

      // Select the SVG elements by ID
      const fromElem = d3.select(`#${CSS.escape(fromId)}`).node();
      const toElem = d3.select(`#${CSS.escape(toId)}`).node();
      console.log(fromElem)



      if (fromElem && toElem && fromId !== activeId.replace(/[^a-zA-Z0-9_-]/g, "_")) {
        const fromBox = fromElem.getBBox();
        const fromCtm = fromElem.getCTM();
        const toBox = toElem.getBBox();
        const toCtm = toElem.getCTM();
        console.log(fromBox.x)
        console.log(fromBox.y)


        // Calculate the center of each node
        const fromX = (fromBox.x + fromBox.width) * fromCtm.a + (fromBox.y + fromBox.height / 2) * fromCtm.c + fromCtm.e;
        const fromY = fromBox.x * fromCtm.b + (fromBox.y + fromBox.height / 2) * fromCtm.d + fromCtm.f;
        const toX = toBox.x * toCtm.a + (toBox.y + toBox.height / 2) * toCtm.c + toCtm.e;
        const toY = toBox.x * toCtm.b + (toBox.y + toBox.height / 2) * toCtm.d + toCtm.f;
        //console.log(fromX)
        //console.log(toX)
        //console.log(toY)
        currentArrows.push({targetX: toX,  targetY: toY,  sourceX: fromX, sourceY: fromY})
      }
      // drawLine(fromNode, toNode); // your actual drawing function here
    }
  }

      setTimeout(() => {
        console.log('test');
      }, 0);

      setTimeout(() => {
        console.log('test');
        //console.log('example')
        //console.log(currentArrows)
	      arrowLinks = svg.selectAll(".arrowlink")
	      					.data(currentArrows)
	      					.enter()
            .append("path")
          .attr("class", "arrowlink")
          .attr("fill", "none")
          .attr("stroke", "#555")
          .attr("stroke-opacity", 0.4)
          .attr("stroke-width", 1.5)
          .attr("marker-end", "url(#end)")

        //console.log('links')
        //console.log(arrowLinks)
	      arrowLinks
          .attr("d", d => {
            //console.log('start Arrow')
            //const sourceX = d.source.fx + calculateNodeWidth(d.source) + 20
            const sourceX = parseFloat(d.sourceX);
            const sourceY = parseFloat(d.sourceY);
            //console.log(d.source.id)
            //console.log('source x ' + sourceX)
            //console.log('source y ' + sourceY)
            
            //console.log('target x ' + d.targetX)
            //console.log('target y ' + d.targetY)
            //console.log(d.target)
            const targetX = d.targetX;
            //const targetY = d.target.y;
            const targetY = d.targetY;

            // Calculate control points for the curve
            const controlX1 = sourceX + (targetX - sourceX) * 0.5;
            const controlY1 = sourceY;
            const controlX2 = targetX - (targetX - sourceX) * 0.5;
            const controlY2 = targetY;

            // Construct the path using cubic Bézier curve commands
            return `M${sourceX},${sourceY} C${controlX1},${controlY1} ${controlX2},${controlY2} ${targetX},${targetY}`;

          });
        //console.log('arrow links')
        //console.log(arrowLinks)


	      //links
        //        .attr("d", d3.linkHorizontal()
        //          .x(d => d.source.y)
        //          .y(d => d.source.x));
        //     ;

//      	nodeTexts
//      		.attr("x", function(d) { return d.x + 2 ; })
//      		.attr("y", function(d) { return d.y + 12; })
//      		;


        linkTexts.attr("transform", function(d) {
          // Calculate the angle between the source and target nodes
          var sourcex = calculateNodeWidth(d.source) + d.source.x 
          var dx = d.target.x - sourcex;
          var dy = d.target.y - d.source.y;
          var angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
          // Calculate the midpoint of the line
          var midX = (sourcex + d.target.x) / 2;
          var midY = (d.source.y + d.target.y - 8) / 2;
        
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

        //updateDisplay()
        
        var bbox = svg.node().getBBox();

        // Update the SVG width and height based on the content size
        svg.attr('width', bbox.width)
           .attr('height', bbox.height);

        scrollContainer.style("height", bbox.height + "px");

      }, 25);




}

function zoomed() {
  svg.attr("transform", d3.event.transform); 
}

function reset() {
  //svg.transition()
  //  .duration(750)
  //  .call(zoom.transform,
  //    d3.zoomIdentity
  //    .translate(0, 0)
  //    .scale(1)
  //  );
}


document.addEventListener('DOMContentLoaded', function() {
  const searchButton = document.getElementById('search-button');
  searchButton.addEventListener('click', function(event) {
    event.preventDefault(); // Prevent form submission
    const searchTerm = document.getElementById('search-term').value.trim();
    if (!searchTerm) return; // Prevent empty searches
    findNodeBySearchTerm(searchTerm);
  });
});

function selectThisNode(node) {
  const escapedId = node.id.replace(/[^a-zA-Z0-9_-]/g, "_"); // Sanitize the id
  const selectedNode = d3.select(`#${escapedId}`);
  //console.log("Selected Node:", selectedNode);
  searchClick(selectedNode.datum());
}

function findNodeBySearchTerm(searchTerm) {
  const lowerCaseTerm = searchTerm.toLowerCase();
  const matches = graph.nodes.filter(node =>
    node.id.toLowerCase().includes(lowerCaseTerm) ||
    node.label.toLowerCase().includes(lowerCaseTerm)
  );

  if (matches.length === 0) {
    alert('No results found.');
    return;
  } else if (matches.length === 1) {
    // If only one match, select it immediately
    selectThisNode(matches[0]);
  } else {
    // If multiple matches, show a "Did you mean?" popup
    showDidYouMeanPopup(matches);
  }
}

function showDidYouMeanPopup(matches) {
  // Remove any existing popup
  const existingPopup = document.getElementById('did-you-mean-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create the popup container
  let popup = document.createElement('div');
  popup.id = 'did-you-mean-popup';
  popup.style.position = 'absolute';
  popup.style.background = '#fff';
  popup.style.border = '1px solid #ccc';
  popup.style.padding = '10px';
  popup.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.2)';
  popup.style.zIndex = '1000';

  let message = document.createElement('p');
  message.textContent = 'Did you mean:';
  popup.appendChild(message);

  matches.forEach(node => {
    let option = document.createElement('div');
    option.textContent = node.label;
    option.style.cursor = 'pointer';
    option.style.padding = '5px';
    option.style.borderBottom = '1px solid #ddd';
    option.addEventListener('mouseover', () => option.style.background = '#f0f0f0');
    option.addEventListener('mouseout', () => option.style.background = 'transparent');
    option.addEventListener('click', function() {
      selectThisNode(node);
      popup.remove();
    });
    popup.appendChild(option);
  });

  // Position the popup near the search input
  let searchInput = document.getElementById('search-term');
  let rect = searchInput.getBoundingClientRect();
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.top = `${rect.bottom + window.scrollY}px`;

  document.body.appendChild(popup);
}


function pinClicked(d) {

  console.log(d)
  d.pinned = !d.pinned
  console.log(d.pinned)
  if (d.pinned) {
    console.log('stack added')
    pinnedStacks[d.id] = [...stack]
  } else {
    delete pinnedStacks[d.id]
  }

  

}

function searchClick(d) {
  console.log("SEARCH");
  console.log(d);
  textElement = svg.selectAll("text")
  textElement.selectAll("tspan").remove();


  elements = svg.selectAll('g')
  elements.each(function() {
    //var textHeight = this.select('text').getBBox().height;
    textElement = d3.select(this).select('text')
    var textHeight = textElement.node().getBBox().height;

    var padding = 10; // Adjust this value as needed
  
    d3.select(this).select("rect")
      //.attr("width", textElement.node().getBBox().width + padding * 2)
      .attr("width", 210)
      .attr("height", textHeight + padding * 2);
  });
  active = d3.select(this)
  activeId = d.id
  console.log(d);
  clickedNode = graph.nodes.find(node => node.id === activeId)

  simulation.alpha(1).restart();
  updateDisplay()
  ticked();

  stack = [];
  tempStack = [];
  console.log(d.pinned)
  curLevel = clickedNode.level;
  curNode = clickedNode;
  console.log("cur nodes");
  while (curLevel > 0) {
    curLink = graph.links.find(link => (link.target == curNode && link.source.level == curLevel - 1));
    console.log(curLink);
    curNode = graph.nodes.find(node => (node.id == curLink.source.id)) ;
    console.log(curNode.id);
    tempStack.push(curNode.id);
    curLevel --;
  }

  while (tempStack.length > 0) {
    stack.push(tempStack.pop());
  }
  stack.push(clickedNode.id);
  console.log("THE STACK");
  console.log(stack);
  //active.classed("active", true);

  categories = []
  for (var link of graph.links) {
    //console.log('target level' + link.target.level)
    if (link.source.id == peek(stack) && link.target.level > link.source.level) {
      //console.log('link')
      //console.log(link)
      if (!['bearer of', 'bearer_of', 'has role', 'is a'].includes(link.predicate)){
        if (categories[link.predicate]) {
          categories[link.predicate].push(link.target.id)
        } else {
          categories[link.predicate] = [link.target.id]
        }
      }
    }
  }
  //console.log(stack.length)
  //console.log(stack)

  var infoContainer = document.getElementById("info-container");
  
  infoContainer.innerHTML = "Clicked element: " + d.id;
  infoContainer.innerHTML += "<p>Label (not rdf:label): " + d.label + "</p>";

  for (var node of graph.nodes) {
    if (node !== d) {
      distance = shortestDistance(d, node)
      if (node['level'] > d['level'] && distance ==1) {
        node['enabled'] = true
      } else if (node['level'] >= d['level']) {
        node['enabled'] = false
      } else if (node['level'] < d['level'] && !stack.includes(node.id)) {
        node['enabled'] = false;
      }
    } else {
        node['enabled'] = true
    }
  }
  var enabledNodes = graph.nodes.filter(node => node.enabled);

  // Update the simulation to use the enabledNodes array
  nodes.style('opacity', function(o){
    if(o.enabled) {
      return 1;
    }else return 0;
  });
  nodes.style('pointer-events', function(o){
    if(o.enabled) {
      return 'auto';
    }else return 'none';
  });
  var disabledNodes = graph.nodes.filter(node => node.enabled == false);
  simulation.nodes(enabledNodes);
  // Using the forEach() method
  disabledNodes.forEach((node) => {
    // Iterate over each disabled node
    // You can access properties of each node like node.propertyName
    node.collideRadius = null;
    node.radialRadius = null;
    //console.log('disabled')
    //console.log(node);
  });

  simulation.alpha(1).restart();
  updateDisplay()
  ticked();


  //parentNode = graph.nodes.find(node => node.id === peek(stack))
  findId = d.id
  const findElement = d3.selectAll(".node").filter(function (d) {
    return d.id == findId;

  });
  updateDisplay()
  console.log("FIND");
  console.log(findElement);
  //console.log('add labels this')
  //console.log('d ' + d)
  //console.log('this ' + d3.select(this))
  //console.log(d3.select(this))
  //addLabels(d, d3.select(this))
  addLabels(d, findElement)
  //console.log('add labels')
  //console.log(textElement)

  nodes.style('opacity', function(o){
    if(o.enabled) {
      return 1;
    }else return 0;
  });
  nodes.style('pointer-events', function(o){
    if(o.enabled) {
      return 'auto';
    }else return 'none';
  });


  var enabledNodes = graph.nodes.filter(node => node.enabled);

  // Update the simulation to use the enabledNodes array
  simulation.nodes(enabledNodes);

  var disabledNodes = graph.nodes.filter(node => node.enabled == false);
  // Using the forEach() method
  disabledNodes.forEach((node) => {
    // Iterate over each disabled node
    // You can access properties of each node like node.propertyName
    node.collideRadius = null;
    node.radialRadius = null;
    //console.log('disabled')
    //console.log(node);
  });

  simulation.alpha(1).restart();
  updateDisplay()
  ticked();


}
