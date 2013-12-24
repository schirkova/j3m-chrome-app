/*******************/    
/* json tree code */    
/*****************/
var j3mTree = new Object();
j3mTree.height = 0;

function convertToTree(d ){
		var kids = [];
		for (var key in d) {
			
			var kidData = {};		
  		    if (angular.isArray(d[key]) || angular.isObject(d[key])) 
			{
				kidData["d3DisplayName"] = key  + " : ";
				kidData["children"] = convertToTree(d[key]);	
					
  			}else {
				if (angular.isArray(d)) {
					kidData["d3DisplayName"] =  d[key];
				} else {
					kidData["d3DisplayName"] = key + " : " + JSON.stringify(d[key]);
				} 			
  			}
  			kids.push(kidData);
  			j3mTree.height++;
  			
  		}
  		return kids;
 };



function initTree(jsonData) {
    j3mTree.w = 960,
    j3mTree.h = j3mTree.height * 20;
 
    j3mTree.tree = d3.layout.tree()
    .size([j3mTree.h, 200]);

    j3mTree.diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

    j3mTree.vis = d3.select("#chart").append("svg:svg")
    .attr("width", j3mTree.w)
    .attr("height", j3mTree.h)
    .append("svg:g")
    .attr("transform", "translate(20,30)");


    jsonData.x0 = 0;
    jsonData.y0 = 0;
    update(j3mTree.root = jsonData);
}


function update(source) {
	var i = 0,
    barHeight = 20,
    barWidth = j3mTree.w * .5,
    duration = 400;
    
  // Compute the flattened node list. TODO use d3.layout.hierarchy.
  var nodes = j3mTree.tree.nodes(j3mTree.root);
  
  // Compute the "layout".
  nodes.forEach(function(n, i) {
    n.x = i * barHeight;
  });
  
  // Update the nodes
  var node = j3mTree.vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });
  
  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .style("opacity", 1e-6);

  // Enter any new nodes at the parent's previous position.
  nodeEnter.append("svg:rect")
      .attr("y", -barHeight / 2)
      .attr("height", barHeight)
      .attr("width", barWidth)
          .attr("rx", 6)
    .attr("ry", 6)
      .style("fill", color)
      .on("click", click);
  
  nodeEnter.append("svg:text")
      .attr("dy", 3.5)
      .attr("dx", 5.5)
      .text(function(d) 
      { 
		return d.d3DisplayName;
      });
  
  // Transition nodes to their new position.
  nodeEnter.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
      .style("opacity", 1);
  
  node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
      .style("opacity", 1)
    .select("rect")
      .style("fill", color);
  
  // Transition exiting nodes to the parent's new position.
  node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .style("opacity", 1e-6)
      .remove();
  // Update the links
  var link = j3mTree.vis.selectAll("path.link")
      .data(j3mTree.tree.links(nodes), function(d) { return d.target.id; });
  
  // Enter any new links at the parent's previous position.
  link.enter().insert("svg:path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return j3mTree.diagonal({source: o, target: o});
      })
    .transition()
      .duration(duration)
      .attr("d", j3mTree.diagonal);
  
  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", j3mTree.diagonal);
  
  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return j3mTree.diagonal({source: o, target: o});
      })
      .remove();
  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Toggle children on click.
function click(d) {
//alert("click!");
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}

function color(d) {
  return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
}

/*******************/    
/* end json tree code */    
/*****************/


/*******************/    
/* timeline code */    
/*****************/
var j3mTimeline = new Object();

 function addJ3M (j3m) {
    var _j3m = JSON.parse(j3m);
    
    console.log(_j3m.genealogy.dateCreated);
 	if ( _j3m.genealogy.dateCreated > 0) {
		var timePoint = {};
		timePoint["id"] = _j3m._id;
		timePoint["time"] = _j3m.genealogy.dateCreated;
		timePoint["alias"] = _j3m.intent.alias;
		timePoint["pgpkey"] = _j3m.intent.pgpKeyFingerprint;
		
		j3mTimeline.calendarData.push(timePoint);
		console.log(j3mTimeline.calendarData);
		draw_events();
	}
 }


function initTimeline(){

	j3mTimeline = new Object();
	j3mTimeline.calendarData = new Array ();
	
	j3mTimeline.Ytracker =  new Array ();
	var w = 1200;
 	var h = 300;

console.log(j3mTimeline.calendarData);
 
 	d3.select("svg")
       .remove();
        
 	j3mTimeline.svg = d3.select("#timeline")
        .append("svg")
        .attr("width", w)
        .attr("height", h);


	//j3m metadat can't date back further than 2013, and can't be in the future,
	//so the timescale is bound by those two dates
	j3mTimeline.scale = d3.time.scale()
                .domain([new Date(2013,10,1), new Date()])
                .range([10, w-110]);


	var xaxis = d3.svg.axis().scale(j3mTimeline.scale)
                .orient("bottom");


	var zoom = d3.behavior.zoom()
                    .on("zoom", function(){
                        j3mTimeline.svg.select("g").call(xaxis).selectAll("text").style("font-size", "10px");
                        update_events();
                    }).x(j3mTimeline.scale);



	var rect = j3mTimeline.svg.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", w-100)
                .attr("height", h)
                .attr("opacity", 0)
                .call(zoom);

	j3mTimeline.svg.append("g")
    .attr("class", "xaxis")
    .call(xaxis)
    .selectAll("text")
        .style("font-size", "10px");
    
    draw_events();
}

function draw_events(){
  var events = j3mTimeline.svg.selectAll("image.item").data(j3mTimeline.calendarData, function(d) {return d.time; });

    events.enter()
            .append("image")
            	.attr("class", "item")
            	.attr("xlink:href", "img/ic_logo.png")
                .attr("x", function(d){
                		return j3mTimeline.scale(d.time);
                 })
                .attr("y", function(d){ 
                	if (j3mTimeline.Ytracker.indexOf(d.pgpkey) == -1) {
                		j3mTimeline.Ytracker.push(d.pgpkey);       	
                		j3mTimeline.svg.append("text")
						    .text(d.alias)
						    .attr("x", "20")
						    .attr("y", 10 + (40 * j3mTimeline.Ytracker.length))
						    .attr("text-anchor","middle");	
                	}
                	console.log(j3mTimeline.Ytracker);
                	return 40+40*j3mTimeline.Ytracker.indexOf(d.pgpkey); 
                 })
                .attr("width", 20)
                .attr("height", 20);
     
     events.append("title")
      .text(function(d) { return convertTimestamp(d.time);});           
                

    events.exit()
            .remove();
}

function update_events(){
    return j3mTimeline.svg.selectAll("image.item")
        .attr("x", function(d){return j3mTimeline.scale(d.time);})    
}
/*******************/    
/* end timeline code */    
/*****************/


/*******************/    
/* file format transformation code */    
/*****************/

function toTSV (input) {
  return toXSV(input,'\t',0);
}

function toCSV (input) {
  return toXSV(input,',',0);
}

function toXSV (d, delim, indent) {
 	var result = [];
 	
	for (var key in d) {
		var line = [];		
		for (i = 0; i < indent; i++) {
			line.push("");
		}
 		if (angular.isArray(d[key]) || angular.isObject(d[key])) 
		{
			line.push( key  + " : ");
			result.push(line.join(delim));
			result.push(toXSV(d[key], delim, (indent +1)));	
				
 		}else {
			if (angular.isArray(d)) {
				line.push( d[key] );
			} else {
				line.push( key + " : ");
				line.push( JSON.stringify(d[key]));
			} 
			result.push(line.join(delim));			
 		}
 	}
 	return result.join('\n');
}
function toHTMLWrapper(d) {
	var result = [];
 	result.push("<html><head></head><body>");
 	result.push(toHTML (d));
 	result.push("</body></html>");
 	return result.join('\n'); 
}
function toHTML (d) {
 	var result = [];
 	result.push("<ul>");
	for (var key in d) {
		var line = [];		
		
 		if (angular.isArray(d[key]) || angular.isObject(d[key])) 
		{
			line.push( "<li>" + key  + " :</li>");
			result.push(line.join(""));
			result.push(toHTML(d[key]));	
				
 		}else {
			if (angular.isArray(d)) {
				line.push( "<li>" + d[key]  + "</li>");
			} else {
				line.push( "<li>" + key + " : " + JSON.stringify(d[key])  + "</li>");
			} 
			result.push(line.join(""));			
 		}
 	}
 	result.push("</ul>");
 	return result.join('\n');
}

/*******************/    
/* j3m util code */    
/*****************/
function convertTimestamp(timestampField) {
    var timestampValue = parseInt(timestampField);
    if(isNaN(timestampValue) || timestampValue != timestampField) {
        return "N/A";
    }
    else {
        var dt = new Date(timestampValue);
        console.log(dt.getFullYear() + '-' + pad(dt.getMonth()+1, 2) + '-' + pad(dt.getDate(), 2) + ' ' + pad(dt.getHours(), 2) + ':' + pad(dt.getMinutes(), 2) + ':' + pad(dt.getSeconds(), 2));
        console.log(dt.toLocaleString());
        console.log(dt.toUTCString());
        return dt.toLocaleString();
    }
}
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
var keyword_container_elements = ["data", "userAppendedData" , "associatedForms" , "answerData"];
var keywords_excluded_words = ["a", "the" , "is" , "are" , "am" , "was"];
function extractKeywords(data, path, pathIndex, keyWords) {
	if (angular.isArray(data))  {
		for (var key in data) {
	    	extractKeywords(data[key], path, pathIndex, keyWords);	
	    }
	}else if (angular.isObject(data)) {
		for (var key in data) {
			if ( key === path[pathIndex]) {
				pathIndex++;
				if (pathIndex >= path.length) {
					getEndStrings(data[key], keyWords);
				}else {
					extractKeywords(data[key], path, pathIndex, keyWords);
				}		
			}
		}		
	}else {
		if (pathIndex >= path.length) {
					console.log(JSON.stringify(data[key]));
		}
  	}
}
               
function getEndStrings(data,keyWords){
	if (angular.isArray(data) || angular.isObject(data))  {
		for (var key in data) {
			getEndStrings(data[key],keyWords);
		}
	}else {
		if (JSON.stringify(data)) {
			
			console.log(JSON.stringify(data));
			keyWords.push(data);
		}
	}
}

/*******************/    
/* end util code */    
/*****************/
