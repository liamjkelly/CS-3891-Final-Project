var width = 1200, height = 800;
var x_pad = 50, y_pad = 20;
var actual_width = width-2*x_pad, actual_height = height-2*y_pad;
var main_width = actual_width/2, main_height = actual_height*(2/3);

var xScale, yScale
var scheme = d3.schemeCategory10
var color_array = {QB: scheme[0], RB: scheme[2], WR_TE: scheme[1], OL: scheme[8],
				   DB: scheme[4], DL_LB: scheme[3], Other: scheme[6]}

// FIXME (JOE): This is super temporary I did this on an airplane, has to be
// a way to get it to read in the data as integers instead of strings. Causing
// problems with our data
function filter_data(d) {
	d.pick = parseInt(d.pick)
	d.round = parseInt(d.round)
	d.probowls = parseInt(d.probowls)
	d.career_av = parseInt(d.career_av)
	d.first4_av = parseInt(d.first4_av)
	d.year = parseInt(d.year)
	d.seasons = parseInt(d.seasons)
}

function plot_it() {
	// Set up entire svg
	d3.select('body').append('svg').attr('width', width).attr('height', height);
	d3.select('svg').append('g').attr('transform', 'translate('+x_pad+','+y_pad+')').attr('class', 'mainview');
	
	// Set up group elements
	d3.select('.mainview').append('g').attr('class', 'mainplot');
	d3.select('.mainplot').append('rect').attr('class', 'bkgd')
		.attr('width', main_width)
		.attr('height', main_height)
		.attr('fill', '#999999')
		.attr('opacity', .4);
	d3.select('.mainview').append('g').attr('class', 'legend')
		.attr('transform', 'translate('+main_width+',0)');
	d3.select('.mainview').append('g').attr('class', 'brush')
		.attr('transform', 'translate(0,'+(main_height+20)+')');
	d3.select('.mainview').append('g').attr('class', 'options')
		.attr('transform', 'translate('+main_width+','+(actual_height*(2/7))+')');
	
	// Set up Scales
    var minX = d3.min(nfl_data, d => d.pick)
    var maxX = d3.max(nfl_data, d => d.pick)
    var minY = Math.min.apply(Math, nfl_data.map(function(d) {return d.career_av; }))
    var maxY = Math.max.apply(Math, nfl_data.map(function(d) {return d.career_av; }))
    
    xScale = d3.scaleLinear().domain([minX, maxX]).range([0, main_width]);
    yScale = d3.scaleLinear().domain([minY, maxY]).range([main_height, 0]);
    
	// Set up Color Scale - keyed array
	
	
	
	// Plot the Axes
    d3.select('.mainplot').append('g')
		.attr('class', 'y_axis')
		.call(d3.axisLeft(yScale));
    d3.select('.mainplot').append('g')
		.attr('class', '.x_axis')
		.attr('transform', 'translate(0,'+(main_height)+')')
		.call(d3.axisBottom(xScale));
		
	// Plot the Plots
	d3.select('.mainplot').append('g').attr('class','point_group')
	  .selectAll('points').data(nfl_data)
		.enter().append('circle')
		.attr('class', 'points')
		.attr('r', 3)
		.attr('cx', d => xScale(d.pick))
		.attr('cy', d => yScale(d.career_av))
		.attr('fill', d => color_array[d.position])
		.style('opacity', .5)
    
	// Plot the Text
    d3.select('.mainplot').append("text")
		.attr("transform", "rotate(-90)")
		.attr('y', -50)
		.attr('x', -main_height/2)
		.attr('dy', "1em")
		.style("text-anchor", "middle")
		.text("Career Average")
    
    d3.select('.mainplot').append('text')
		.attr('x', main_width/2)
		.attr('y', main_height+40)
		.style("text-anchor", "middle")
		.text('Pick')
    
}



























