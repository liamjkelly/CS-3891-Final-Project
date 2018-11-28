var width = 1500, height = 750;
var x_pad = 60, y_pad = 20;
var actual_width = width-2*x_pad, actual_height = height-2*y_pad
var main_width = actual_width*(4/7), main_height = actual_height*(3/5)
var alt_width = actual_width*(3/7)-x_pad/2, alt_height = actual_height*(3/5)

var xScale, yScale
var x_alt_scale
var scheme = d3.schemeCategory10
var color_array = {QB: scheme[0], RB: scheme[2], WR_TE: scheme[1], OL: scheme[8],
				   DB: scheme[4], DL_LB: scheme[3], Other: scheme[6]}
var y_label_array = {career_av: "Career Approximate Value", first4_av: "First 4 Years Approximate Value",
					 probowls: "Pro Bowls", season: "Seasons As Starter"}	   
var option_box

var cached_stat = 'career_av'
var cached_brush = 'career_av'
var cached_data

var trans = d3.transition().duration(2000)

var brushing, date1, date2, min_year, max_year, handle, handle1, handle2, x_date

function filter_data(d) {
	d.pick = +d.pick
	d.round = +d.round
	d.probowls = +d.probowls
	d.career_av = +d.career_av
	d.first4_av = +d.first4_av
	d.year = +d.year
	d.seasons = +d.seasons
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
		.attr('transform', 'translate('+(main_width+70)+','+(main_height+40)+')');

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
		.text(d => y_label_array[cached_stat])
		.attr('class', 'y_axis_label')
    
    d3.select('.mainplot').append('text')
		.attr('x', main_width/2)
		.attr('y', main_height+30)
		.style("text-anchor", "middle")
		.style('alignment-baseline', 'central')
		.attr('font-family', 'arial')
		.attr('font-size', '18px')
		.attr('font-weight', 'bold')
		.text('Overall Pick')
		.attr('class', 'x_axis_label')

	cached_data = nfl_data
		
	set_up_other_plot()
		
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
	
	d3.selectAll('.brush_buttons').on('click', brush_stat_change)

	// hover interaction
	d3.selectAll('.points').on('mouseover', hover_over)
	d3.selectAll('.points').on('mouseout', hover_out)
	
	d3.selectAll('.team_bars').on('click', d => console.log(d))
	
}


// Sets up the coordinated view
// FIXME: DeRose - get this second plot set up properly and get the aggregates working
// Basically shows some kind of bar graph to represent the selected stat for each team (brush stat)
// that is shown on the current visualization. Does 
function set_up_other_plot() {
	d3.select('.mainview').append('g').attr('class', 'alt_plot')
		.attr('transform', 'translate('+(main_width+x_pad)+',0)')
	  .append('rect')
		.attr('class', 'alt_bkgd')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', alt_width)
		.attr('height', alt_height)
		.attr('fill', '#999999')
		.attr('opacity', .4)
	
	// Set up the y-axis
	d3.select('.alt_plot').append('g')
		.attr('class', 'alt_y_axis')
		.call(d3.axisLeft(yScale))
		
	// Plot the y-label
    d3.select('.alt_plot').append("text")
		.attr("transform", "rotate(-90)")
		.attr('y', -35)
		.attr('x', -alt_height/2)
		.style("text-anchor", "middle")
		.style('font-size', '18px')
		.attr('font-weight', 'bold')
		.attr('font-family', 'sans-serif')
		.text(d => y_label_array[cached_brush])
		.attr('class', 'alt_y_axis_label')
	
	d3.select('.alt_plot').append('g')
		.attr('class', 'bar_group')
	d3.select('.alt_plot').append('g')
		.attr('class', 'text_group')
	
	visualize_alt_plot(nfl_data)
}


function visualize_alt_plot(current_points, is_stat_change) {
	// Nest the data on team
	var team_data = d3.nest()
		.key(d => d.team)
		.entries(current_points)
		
	// Aggregate team values
	aggregate_team_values(team_data)
	
	// Get the team names
	var team_names = []
	for(var i = 0; i < team_data.length; i++) {
		team_names.push(team_data[i].key)
		console.log(team_data[i].aggregated_stat)
	}
	team_names = team_names.sort()
	
	console.log(team_names)
	
	// Set up the x scale
	x_alt_scale = d3.scaleBand()
		.domain(team_names)
		.range([0, alt_width])
		.paddingInner([.1])
		.paddingOuter([.1])
	
	// Set up the team color array
	
	//Set up the bar graph
	var bar_selection = d3.select('.bar_group').selectAll('.team_bar')
		.data(team_data, d => d.key)
		
	bar_selection.exit().remove()
	
	// Apply transition if is a stat change and change y-axis
	if(!is_stat_change) {
		
		bar_selection.enter().append('rect')
		  .merge(bar_selection)
			.attr('x', d => x_alt_scale(d.key))
			.attr('y', d => yScale(d.aggregated_stat))
			.attr('width', x_alt_scale.bandwidth())
			.attr('height', d => alt_height - yScale(d.aggregated_stat))
			.attr('class', 'team_bar')
	
	} else {
		d3.selectAll('.alt_y_axis').remove().transition(trans).attr('opacity', 0)
		
		d3.select('.alt_plot').append('g')
			.attr('opacity', 0)
			.attr('class', 'y_axis')
		  .transition(trans)
			.attr('opacity', 1)
			.call(d3.axisLeft(yScale))
		
		console.log(3)
		
		bar_selection.enter().append('rect')
		  .merge(bar_selection)
			.transition(trans)
			.attr('x', d => x_alt_scale(d.key))
			.attr('y', d => yScale(d.aggregated_stat))
			.attr('width', x_alt_scale.bandwidth())
			.attr('height', d => alt_height - yScale(d.aggregated_stat))
			.attr('class', 'team_bar')
		
		d3.selectAll('.alt_y_axis_label').remove().transition(trans).attr('opacity', 0)
		
		d3.select('.alt_plot').append('text')
			.attr('opacity', 0)
			.attr('class', 'alt_y_axis_label')
			.text(y_label_array[cached_stat])
			.attr("transform", "rotate(-90)")
			.attr('y', -35)
			.attr('x', -main_height/2)
			.style("text-anchor", "middle")
			.style('font-size', '18px')
			.attr('font-weight', 'bold')
			.attr('font-family', 'sans-serif')
		  .transition(trans)
			.attr('opacity', 1)
	}
		
		
	// Set up text under bars
	var text_selection = d3.select('.text_group').selectAll('.team_text')
		.data(team_data, d => d.key)
		
	text_selection.exit().remove()
	
	text_selection.enter().append('text')
	  .merge(text_selection)
		.attr("transform", d => 'translate('+(x_alt_scale(d.key)+5)+','+(alt_height+15)+')rotate(-45)')
		.text(d => d.key)
		.attr('x', 0)
		.attr('y', 0)
		.attr('class', 'team_text')
		.style("text-anchor", "middle")
		.style('font-size', '11px')
		.attr('font-family', 'sans-serif')
		
}


// Aggregates the given nested data for the team values present in the data
function aggregate_team_values(nested_data) {
	for(var i = 0; i < nested_data.length; i++) {
		var sum = 0
		
		for(var j = 0; j < nested_data[i].values.length; j++) {
			sum += nested_data[i].values[j][cached_brush]
		}
		
		nested_data[i].aggregated_stat = sum / nested_data[i].values.length
	}
}


// Sets up all of the svg related things to the options box
function set_up_options() {
	var option_width = actual_width - main_width - 100
	var option_height = actual_height - main_height - 40
	
	// Set up options data
	var positions = nfl_data.map(d => d.position).filter((v, i, a) => a.indexOf(v) === i)
	positions.unshift('All')
	var graph_plot = ['career_av', 'first4_av']
	var graph_brush = ['career_av', 'first4_av', 'probowls', 'seasons']
	option_box = [positions, graph_plot, graph_brush]
	
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
				return 'translate(0,'+ ((5/8)*option_height) +')'
			}
		})
		.attr('class', function(d,i) {
			var names = ['options_position', 'options_stat', 'options_brush']
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
	var option_headers = ['Position', 'Plot - Performance Metric', 'Brush - Performance Metric']
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
		.attr('height', ((1/4)*option_height)-40)
		.style('stroke', '#000000')
		.attr('fill', 'White')
		.style('stroke-width', 1.5)
		
	// Text in buttons
	button_names = ['Career Value', 'First4 Value', 'Pro Bowls', 'Start Seasons']
	d3.selectAll('.stat_buttons').append('text')
		.text((d,i) => button_names[i])
		.attr('x', band_x.bandwidth()/2)
		.attr('y', (((1/4)*option_height)-40)/2)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.attr('font-family', 'sans-serif')
	
	// GRAPH STYLE BUTTONS
	
	// Adjust scales
	// band_x = d3.scaleBand().domain(graph_style)
		// .range([0,option_width])
		// .paddingInner([.1])
		// .paddingOuter([.1])
	
	// Set up buttons
	d3.select('.options_brush').selectAll('boxes')
		.data(d => d).enter().append('g')
		.attr('class', 'brush_buttons')
		.attr('id', d => d+'_brush_button')
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
	d3.selectAll('.brush_buttons').append('text')
		.text((d,i) => button_names[i])
		.attr('x', band_x.bandwidth()/2)
		.attr('y', band_y.bandwidth()/2)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.attr('font-family', 'sans-serif')
	
	// Set up initial state of the buttons - button fill is dark grey
	d3.select('#All_button').select('rect').attr('fill', '#999999')
	d3.select('#career_av_button').select('rect').attr('fill', '#999999')
	d3.select('#career_av_brush_button').select('rect').attr('fill', '#999999')
}


// Does the changing of position data and revisualizing
// Possibly new data (merge), same coordinates/scale
// Some kind of fade out/in transition
// Might help to make a helper function that visualizes everything
// and then call that function with new data to visualize
// Key quickly on position
// Highlight new pressed button, unhighlight old button
function position_change(d,i,g) {
	// Highlight the new button
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
		.attr('cy', d => yScale(d[cached_stat]))
		.attr('fill', d => color_array[d.position])
	  .transition(trans)
		.style('opacity', .5)
	
	cached_data = new_data
	
	visualize_alt_plot(cached_data, false)
}

// Changes the y statistic and axis scale
// Same points different y coordinate, y axis, y axis-label
// Some kind of cool transition
// Highlight new pressed button, unhighlight old button
function stat_change(d,i,g) {
	// Highlight the new button
	d3.selectAll('.stat_buttons').selectAll('rect').attr('fill', 'white')
	d3.select(this).select('rect').attr('fill', '#999999')
	
	var id = d3.select(this).attr('id')
	var stat = id.slice(0, -7)
	
	if(stat != cached_stat) {
		cached_stat = stat
		// update scale and axis
		var min_stat = d3.min(nfl_data, d => d[stat])
		var max_stat = d3.max(nfl_data, d => d[stat])
		
		yScale.domain([min_stat-2, max_stat+2])
		
		d3.selectAll('.y_axis').remove().transition(trans).attr('opacity', 0)
		
		d3.select('.mainplot').append('g')
			.attr('opacity', 0)
			.attr('class', 'y_axis')
		  .transition(trans)
			.attr('opacity', 1)
			.call(d3.axisLeft(yScale))
		
		d3.selectAll('.y_axis_label').remove().transition(trans).attr('opacity', 0)
		
		d3.select('.mainplot').append('text')
			.attr('opacity', 0)
			.attr('class', 'y_axis_label')
			.text(y_label_array[stat])
			.attr("transform", "rotate(-90)")
			.attr('y', -35)
			.attr('x', -main_height/2)
			.style("text-anchor", "middle")
			.style('font-size', '18px')
			.attr('font-weight', 'bold')
			.attr('font-family', 'sans-serif')
		  .transition(trans)
			.attr('opacity', 1)
		
		// update points y position
		d3.selectAll('.points')
		  .transition(trans)
			.attr('cy', d => yScale(d[stat]))
	}
	
	visualize_alt_plot(cached_data, true)
}

// Does the interactions for the brush stat changing
function brush_stat_change(d,i) {
	
}

// When a point is hovered over, gives information about the player such as
// Name, Position, Pick Number, Year, Team
// inspiration found here: http://bl.ocks.org/d3noob/a22c42db65eb00d4e369
// Also: http://jarrettmeyer.com/2018/06/05/svg-multiline-text-with-tspan
function hover_over(d,i,g) {
	console.log('hover in')
	if (d3.event.pageX+90 > main_width && d3.event.pageY+60 > main_height) {
		var w = (d3.event.pageX - (main_width-d3.event.pageX+90))
		var h = (d3.event.pageY - (main_height-d3.event.pageY+60))
	} else if (d3.event.pageX+90 > main_width) {
		var w = (d3.event.pageX - (main_width-d3.event.pageX+90))
		var h = d3.event.pageY
	} else if (d3.event.pageY+60 > main_height) {
		var w = d3.event.pageX
		var h = (d3.event.pageY - (main_height-d3.event.pageY+60))
	} else {
		var w = d3.event.pageX
		var h = d3.event.pageY
	}
	d3.select('.mainplot').append('g').attr('class', 'hover_box').attr('transform', 'translate(' + (w) + ',' + (h)+ ')')
		.append('rect')
		.attr('x', -45).attr('y', -7).attr('width', 90).attr('height', 60)
		.attr('fill', '#F8F8FF')
		.attr('opacity', 0)
		.transition().duration(50)
		.attr('opacity', 0.8)

	var text = d3.select('.hover_box').append('text')
		.append('tspan')
		.text(d.player)
		.attr('font-size', '12px')
		.attr('font-family', 'sans-serif')
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.append('tspan')
		.text(d.position)
		.attr('font-size', '12px')
		.attr('font-family', 'sans-serif')
		.attr('x', 0)
		.attr('dy', 15)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.append('tspan')
		.text('Pick ' + d.pick)
		.attr('font-size', '12px')
		.attr('font-family', 'sans-serif')
		.attr('x', 0)
		.attr('dy', 15)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.append('tspan')
		.text(d.year)
		.attr('font-size', '12px')
		.attr('font-family', 'sans-serif')
		.attr('x', 0)
		.attr('dy', 15)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.text(d.team)
		.attr('font-size', '12px')
		.attr('font-family', 'sans-serif')
		.attr('x', 0)
		.attr('dy', 15)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.attr('opacity', 0)
		.transition().duration(300)
		.attr('opacity', 1)

	//div_hover.transition().duration(200)
	//	.text(d.player +'\n' + d.position + '\n' + 'Pick ' + d.pick + '\n' + d.year)
	//	.attr('font-size', '12px')
	//	.attr('font-family', 'sans-serif')
	//	.attr('opacity', 1)
	//	.style('left', d3.event.pageX)
	//	.style('top', (d3.event.pageY - 60))
}

function hover_out(d,i,g) {
	console.log('hover out')
	var box = d3.selectAll('.hover_box')
	box.select('rect').transition().duration(300).attr('opacity', 0)
	box.select('html').transition().duration(300).attr('opacity', 0)
	box.remove()
}

// this function sets up the original slider

// adapted from https://bl.ocks.org/officeofjane/9b9e606e9876e34385cc4aeab188ed73
// also useful ? https://bl.ocks.org/ezzaouia/ece919dd2281b8629d46ef62c8c52535
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























