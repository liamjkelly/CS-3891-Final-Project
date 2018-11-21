var width = 1300, height = 800;
var x_pad = 60, y_pad = 20;
var actual_width = width-2*x_pad, actual_height = height-2*y_pad
var main_width = actual_width*(3/4), main_height = actual_height*(2/3)

var xScale, yScale
var scheme = d3.schemeCategory10
var color_array = {QB: scheme[0], RB: scheme[2], WR_TE: scheme[1], OL: scheme[8],
				   DB: scheme[4], DL_LB: scheme[3], Other: scheme[6]}
var option_box
var trans = d3.transition().duration(1000)

var brushing, date1, date2, min_year, max_year, handle, handle1, handle2, x_date
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
		.attr('transform', 'translate('+(main_width+10)+',0)');
	d3.select('.mainview').append('g').attr('class', 'brush')
	//.attr('transform', 'translate(0,'+(main_height+20)+')');
		.attr('transform', 'translate(0,'+(main_height+50)+')');
	d3.select('.mainview').append('g').attr('class', 'options')
		.attr('transform', 'translate('+(main_width+10)+','+(actual_height*(1.5/7))+')');

	// Set up Scales
    var minX = d3.min(nfl_data, d => d.pick)
    var maxX = d3.max(nfl_data, d => d.pick)
    var minY = Math.min.apply(Math, nfl_data.map(function(d) {return d.career_av; }))
    var maxY = Math.max.apply(Math, nfl_data.map(function(d) {return d.career_av; }))
    min_year = d3.min(nfl_data, d => d.year)
    max_year = d3.max(nfl_data, d => d.year)

    date1 = min_year;
    date2 = max_year;
    
    
    xScale = d3.scaleLinear().domain([minX-2, maxX+2]).range([0, main_width]);
    yScale = d3.scaleLinear().domain([minY-2, maxY+2]).range([main_height, 0]);
	
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
		.selectAll('points').data(nfl_data, d => d.position)
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
		.attr('y', -35)
		.attr('x', -main_height/2)
		.style("text-anchor", "middle")
		.style('font-size', '18px')
		.attr('font-weight', 'bold')
		.attr('font-family', 'sans-serif')
		.text("Career Average")
    
    d3.select('.mainplot').append('text')
		.attr('x', main_width/2)
		.attr('y', main_height+30)
		.style("text-anchor", "middle")
		.style('alignment-baseline', 'central')
		.attr('font-family', 'arial')
		.attr('font-size', '18px')
		.attr('font-weight', 'bold')
		.text('Overall Pick')

	
	set_up_options()


	set_up_slider()


	// TODO fix interactions, brushing
	d3.selectAll('.handle1').call(d3.drag()
		.on('start.interrupt', function() {brushing.interrupt();})
		.on('start drag', function() {update1(x_date.invert(d3.event.x), date2)})
		);

	d3.selectAll('.handle2').call(d3.drag()
		.on('start.interrupt', function() {brushing.interrupt();})
		.on('start drag', function() {update2(x_date.invert(d3.event.x), date1) })
		);
	


	// TODO set up interactions
	// Actives 
	d3.selectAll('.position_buttons').on('click', position_change)
	
	d3.selectAll('.stat_buttons').on('click', stat_change)
	
}


// Sets up all of the svg related things to the options box
function set_up_options() {
	var option_width = actual_width - main_width
	var option_height = main_height - actual_height*(1.5/7)
	
	// Set up options data
	var positions = nfl_data.map(d => d.position).filter((v, i, a) => a.indexOf(v) === i)
	positions.unshift('All')
	var graph_stat = ['career_av', 'first4_av', 'probowls', 'seasons']
	var graph_style = ['scatter_plot', 'bar_graph']
	option_box = [positions, graph_stat, graph_style]
	
	// Append box to the outside
	d3.select('.options').append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', option_width)
		.attr('height', option_height)
		.style('stroke', '#000000')
		.attr('fill', '#999999')
		.attr('fill-opacity', .3)
		.style('stroke-width', 2)
	
	// Append interior groups, add stroke rectangle
	d3.select('.options').selectAll('g')
		.data(option_box)
		.enter().append('g')
		.attr('transform', function(d,i) {
			if(i == 0) {
				return 'translate(0,0)'
			} else if(i == 1) {
				return 'translate(0,'+((3/8)*option_height)+')'
			} else {
				return 'translate(0,'+ ((3/4)*option_height) +')'
			}
		})
		.attr('class', function(d,i) {
			var names = ['options_position', 'options_stat', 'options_style']
			return names[i]
		})
	  .append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', option_width)
		.attr('height', .001)
		.style('stroke', '#000000')
		.attr('fill', '#999999')
		.attr('fill-opacity', .3)
		.style('stroke-width', 1.5)
	
	// Add text to the options
	var option_headers = ['Position', 'Performance Metric', 'Graph Style']
	d3.select('.options').selectAll('g').append('text')
		.text((d,i) => option_headers[i])
		.attr('x', 12)
		.attr('y', 20)
		.attr('font-size', '18px')
		.attr('font-family', 'sans-serif')
		.style('font-weight', 'bold')
	
	
	// APPEND THE BUTTONS TO EACH GROUP
	
	// POSITION BUTTONS
	
	// Adjust scales
	var band_x = d3.scaleBand().domain([0,1,2,3])
		.range([0, option_width])
		.paddingInner([.1])
		.paddingOuter([.1])
	var band_y = d3.scaleBand().domain([0,1])
		.range([30, (3/8)*option_height-10])
		.paddingInner([.2])
		.paddingOuter([0])
		
	// Set up buttons
	d3.select('.options_position').selectAll('boxes')
		.data(d => d).enter().append('g')
		.attr('class', 'position_buttons')
		.attr('id', d => d+'_button')
		.attr('transform', (d,i) => 'translate('+band_x(i % 4)+','+band_y(Math.floor(i/4))+')')
	  .append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', band_x.bandwidth())
		.attr('height', band_y.bandwidth())
		.style('stroke', '#000000')
		.attr('fill', 'White')
		.style('stroke-width', 1.5)

	// Text in buttons
	var button_names = ['All', 'QB', 'DL/LB', 'WR/TE', 'OL', 'RB', 'DB', 'Other']
	d3.selectAll('.position_buttons').append('text')
		.text((d,i) => button_names[i])
		.attr('x', band_x.bandwidth()/2)
		.attr('y', band_y.bandwidth()/2)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.attr('font-family', 'sans-serif')	
	
	// PERFORMANCE METRIC BUTTONS
	
	// Adjust scales
	band_x = d3.scaleBand().domain([0,1])
		.range([0, option_width])
		.paddingInner([.1])
		.paddingOuter([.1])
		
	// Set up buttons
	d3.select('.options_stat').selectAll('boxes')
		.data(d => d).enter().append('g')
		.attr('class', 'stat_buttons')
		.attr('id', d => d+'_button')
		.attr('transform', (d,i) => 'translate('+band_x(i % 2)+','+band_y(Math.floor(i/2))+')')
	  .append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', band_x.bandwidth())
		.attr('height', band_y.bandwidth())
		.style('stroke', '#000000')
		.attr('fill', 'White')
		.style('stroke-width', 1.5)
		
	// Text in buttons
	button_names = ['Career Value', 'First4 Value', 'Pro Bowls', 'Start Seasons']
	d3.selectAll('.stat_buttons').append('text')
		.text((d,i) => button_names[i])
		.attr('x', band_x.bandwidth()/2)
		.attr('y', band_y.bandwidth()/2)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.attr('font-family', 'sans-serif')
	
	// GRAPH STYLE BUTTONS
	
	// Adjust scales
	band_x = d3.scaleBand().domain(graph_style)
		.range([0,option_width])
		.paddingInner([.1])
		.paddingOuter([.1])
	
	// Set up buttons
	d3.select('.options_style').selectAll('boxes')
		.data(d => d).enter().append('g')
		.attr('class', 'style_buttons')
		.attr('id', d => d+'_button')
		.attr('transform', d => 'translate('+band_x(d)+',30)')
	  .append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', band_x.bandwidth())
		.attr('height', ((1/4)*option_height)-40)
		.style('stroke', '#000000')
		.attr('fill', 'White')
		.style('stroke-width', 1.5)
	
	// Text in buttons
	button_names = ['Scatter Plot', 'Bar Graph']
	d3.selectAll('.style_buttons').append('text')
		.text((d,i) => button_names[i])
		.attr('x', band_x.bandwidth()/2)
		.attr('y', (((1/4)*option_height)-40)/2)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.attr('font-family', 'sans-serif')
	
	// Set up initial state of the buttons - button fill is dark grey
	d3.select('#All_button').select('rect').attr('fill', '#999999')
	d3.select('#career_av_button').select('rect').attr('fill', '#999999')
	d3.select('#scatter_plot_button').select('rect').attr('fill', '#999999')
}


// Does the changing of position data and revisualizing
// Possibly new data (merge), same coordinates/scale
// Some kind of fade out/in transition
// Might help to make a helper function that visualizes everything
// and then call that function with new data to visualize
// Key quickly on position
// Highlight new pressed button, unhighlight old button
function position_change(d,i,g) {
	d3.selectAll('.position_buttons').selectAll('rect').attr('fill', 'white')
	
	d3.select(this).select('rect').attr('fill', '#999999')

	var i = 0
	var id = d3.select(this).attr('id')
	var pos = id.slice(0, -7)
	if (pos === "All") {
		new_data = nfl_data
	}
	else {
		function position_filter(elem) {
			if (elem.position === pos) {
				return elem
			}
		}
		new_data = nfl_data.filter(position_filter)
	}
	console.log('new data ' + new_data)
	visualize(new_data)	
}

// visualize new data set
function visualize(new_data) {
	var points = d3.select('.mainplot').select('.point_group')
		.selectAll('circle').data(new_data, d => d.position)

	points.exit().transition(trans).style('opacity', 0).remove()
	points.enter().append('circle')
		.attr('class', 'points')
		.attr('r', 3)
		.attr('cx', d => xScale(d.pick))
		.attr('cy', d => yScale(d.career_av))
		.attr('fill', d => color_array[d.position])
		.transition(trans)
		.style('opacity', .5)
}

// Changes the y statistic and axis scale
// Same points different y coordinate, y axis, y axis-label
// Some kind of cool transition
// Highlight new pressed button, unhighlight old button
function stat_change(d,i,g) {
	d3.selectAll('.stat_buttons').selectAll('rect').attr('fill', 'white')
	
	d3.select(this).select('rect').attr('fill', '#999999')
}



// this function sets up the original slider
function set_up_slider() {

	console.log('slider!!!')

	var brush_width = main_width,
		brush_height = main_height/5;

    // var min_year = d3.min(nfl_data, d => d.year)
    // var max_year = d3.max(nfl_data, d => d.year)

	var brusher = d3.select('.brush')
	.attr('width', brush_width)
	.attr('height', brush_height)


	console.log('min year ' + min_year)
	console.log('max year ' + max_year)

	// set up axis
	x_date = d3.scaleTime().domain([min_year,max_year]).range([0, brush_width]).clamp(true)

	var brushing = brusher.append('g').attr('class', 'brushing');



	brushing.append('line')
	.attr('class', 'track')
	.attr('stroke-linecap', 'round')
	.attr("x1", x_date.range()[0])
    .attr("x2", x_date.range()[1])
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .attr('stroke-linecap', 'round')
    .attr('stroke', '#dcdcdc')
    .attr('stroke-width', '8px')
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .attr('pointer-events', 'stroke')
    .attr('stroke-width', '50px')
    .attr('stroke', 'transparent')
    .attr('cursor', 'crosshair')

 	/*
    .call(d3.drag()
        .on("start.interrupt", function() { brushing.interrupt(); })
        .on("start drag", function() { update(x_date.invert(d3.event.x)); }));

	*/

brushing.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr('stroke-linecap', 'round')
   .attr("transform", "translate(0," + 38 + ")")
  .selectAll("text")
    .data(x_date.ticks(10))
    .enter()
    .append("text")
    .attr("x", x_date)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .text(function(d) { return d.year; });

/*
var handle = brushing.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr('fill', '#fff')
    .attr('stroke', '#000')
    .attr('stroke-opacity', '0.5')
    .attr('stroke-width', '1.25px')
    .attr("r", 9)
*/

var handle1 = brushing.insert("circle", ".track-overlay")
    .attr("class", "handle1")
    .attr('id', 'handle1')
    .attr('fill', '#fff')
    .attr('stroke', '#000')
    .attr('stroke-opacity', '0.5')
    .attr('stroke-width', '1.25px')
    .attr("r", 9)
    .call(d3.drag()
        .on("start.interrupt", function() { brushing.interrupt(); })
       .on("start drag", function() { update(x_date.invert(d3.event.x)); }));

var handle2 = brushing.insert("circle", ".track-overlay")
    .attr("class", "handle2")
    .attr('id', 'handle2')
    .attr('cx', brush_width)
    .attr('fill', '#fff')
    .attr('stroke', '#000')
    .attr('stroke-opacity', '0.5')
    .attr('stroke-width', '1.25px')
    .attr("r", 9)
    .call(d3.drag()
       .on("start.interrupt", function() { brushing.interrupt(); })
        .on("start drag", function() { update(x_date.invert(d3.event.x)); }));


var label1 = brushing.append("text")  
    .attr("class", "label")
    .attr('id', 'label1')
    .attr("text-anchor", "middle")
    .text(min_year)
    .attr("transform", "translate(0," + (25) + ")")

var label2 = brushing.append("text") 
	.attr('x', brush_width) 
    .attr("class", "label")
    .attr('id', 'label2')
    .attr("text-anchor", "middle")
    .text(max_year)
    .attr("transform", "translate(0," + (25) + ")")

}



function update1(h, d2) {

	console.log('update1')

	// update position and text of the label according to the two sliders

	date1 = x_date(h)

	handle1.attr('cx', x_date(h))

	label1.attr('x', x_date(h))
	.text(h);

	var new_data = data.filter(function(d) 
						{return (d.date > h) && (d.date < d2);})

	draw_plot(new_data)


}


function update2(h, d1) {

	console.log('update2')
	// update position and text of the label according to the two sliders

	date2 = x_date(h)

	handle2.attr('cx', x_date(h))

	label2.attr('x', x_date(h))
	.text(h);

	var new_data = data.filter(function(d) 
		{return (d.date < h) && (d.date > d1);})

	draw_plot(new_data)


}

function update(h) {

	console.log('update')
	// update position and text of the label according to the two sliders

	console.log('handle ' + handle)

	console.log('x_date(h) ' + x_date(h))
	handle.attr('cx', x_date(h))

	label.attr('x', x_date(h))
	.text(h);

	var new_data = data.filter(function(d) 
		{return d.date < h;})

	draw_plot(new_data)


}

function draw_plot(data) {

	console.log('draw update')

	var circles = d3.select('.mainplot').selectAll('points').data(data).enter()
	.append('circle')
	.attr('class', 'points')
	.attr('r', 3)		
	.attr('cx', d => xScale(d.pick))
	.attr('cy', d => yScale(d.career_av))
	.attr('fill', d => color_array[d.position])
	.style('opacity', .5)

	circles.exit().remove();

}























