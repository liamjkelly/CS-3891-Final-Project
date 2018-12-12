// FIXME:
// - Brush y-axis label needs to change on stat_change()
// - Aggregate point in brush not changing in First4AV
// - Different color for 'Other'

// NOT SUPER IMPORTANT FIXME:
// - A couple names don't fit in hover box - no one will know unless he selects Dominique Rodgers-Cromartie
// - Flickering when you hover over certain points - has to do with box being located over points,
//   box also goes out of plot sometimes
// - Add different stats to hover over box?

var width = 1500, height = 750;
var x_pad = 60, y_pad = 20;
var actual_width = width-2*x_pad, actual_height = height-2*y_pad
var main_width = actual_width*(4/7), main_height = actual_height*(3/5)
var alt_width = actual_width*(3/7)-x_pad/2, alt_height = actual_height*(3/5)

var xScale, yScale
var x_alt_scale
var scheme = d3.schemeCategory10
var color_array = {All: '#999999', QB: '#0900FF', RB: scheme[2], WR_TE: scheme[1], OL: '#2CA3A8',
				   DB: '#87008F', DL_LB: scheme[3], Other: '#F662FF'}
var y_label_array = {career_av: "Career Approximate Value", first4_av: "First 4 Years Approximate Value",
					 probowls: "Pro Bowls", season: "Seasons As Starter"}	   
var option_box

var team_color_array = {ARI: '#97233F', ATL: '#A71930', BAL: '#241773', BUF: '#00338D',
		CAR: '#0085CA', CHI: '#0B162A', CIN: '#FB4F14', CLE: '#EC5614', DAL: '#041E42',
		DEN: '#002244', DET: '#0076B6', GNB: '#203731', HOU: '#03202F', IND: '#002C5F',
		JAX: '#006778', KAN: '#E31837', MIA: '#008E97', MIN: '#4F2683', NOR: '#D3BC8D',
		NWE: '#002244', NYG: '#0B2265', NYJ: '#003F2D', OAK: '#000000', PHI: '#004C54',
		PIT: '#FFB612', SDG: '#002A5E', SEA: '#002244', SFO: '#AA0000', STL: '#002244',
		TAM: '#D50A0A', TEN: '#002A5C', WAS: '#773141'}

var cached_stat = 'career_av'
var cached_brush = 'career_av'
var cached_data
var cached_pos = 'All'
var cached_round = 'All'

// This is just a way of representing everything we could show based on our x-axis
// nfl_data if no round is selected, just that round if a round is selected
var brush_data

var unviewed_color = '#C0C0C0'

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
	//d3.select('.mainview').append('g').attr('class', 'brush')
	//.attr('transform', 'translate(0,'+(main_height+20)+')');
	//	.attr('transform', 'translate(0,'+(main_height+50)+')');
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
		.attr('class', 'x_axis')
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
	brush_data = nfl_data
		
	set_up_other_plot()
		
	set_up_options()

	brushing_context()

	pick_round()

	// TODO set up interactions
	// Actives 
	d3.selectAll('.position_buttons').on('click', position_change)
	
	d3.selectAll('.stat_buttons').on('click', stat_change)
	
	d3.selectAll('.brush_buttons').on('click', brush_stat_change)

	d3.selectAll('.round_buttons').on('click', round_change)

	// hover interaction
	d3.selectAll('.points').on('mouseover', hover_over).on('mouseout', hover_out)
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
		
	// Set up line rectangle
	d3.select('.alt_plot').append('rect')
		.attr('x', 0)
		.attr('y', yScale(0))
		.attr('height', 2)
		.attr('width', alt_width)
		.attr('class', 'zero_line')
	
	visualize_alt_plot(nfl_data)
}

function visualize_alt_plot(current_points, is_stat_change) {
	// filter data if only one position is shown
	var points_viewed = current_points
	if (cached_pos != 'All') {
		points_viewed = current_points.filter(d => d.position == cached_pos)
	}
	
	// Nest the data on team
	var team_data = d3.nest()
		.key(d => d.team)
		.entries(points_viewed)
	
	// Aggregate team values
	aggregate_team_values(team_data)
	
	// Get the team names
	var team_names = []
	for(var i = 0; i < team_data.length; i++) {
		team_names.push(team_data[i].key)
	}
	team_names = team_names.sort()
	
	// Set up the x scale
	x_alt_scale = d3.scaleBand()
		.domain(team_names)
		.range([0, alt_width])
		.paddingInner([.1])
		.paddingOuter([.1])
	
	//Set up the bar graph
	var bar_selection = d3.select('.bar_group').selectAll('rect')
		.data(team_data, d => d.key)

	bar_selection.exit().remove()
	
	// Apply transition if is a stat change and change y-axis
	if(!is_stat_change) {

		bar_selection.enter().append('rect')
		  .merge(bar_selection)
			.attr('x', d => x_alt_scale(d.key))
			.attr('fill', d => team_color_array[d.key])
			.attr('width', x_alt_scale.bandwidth())
			.attr('y', function(d) {
				if(yScale(d.aggregated_stat) > yScale(0)) {
					return yScale(0)
				} else {
					return yScale(d.aggregated_stat)
				}
			})
			.attr('height', function(d) {
				if(yScale(d.aggregated_stat) < yScale(0)) {
					return yScale(0) - yScale(d.aggregated_stat)
				} else {
					return yScale(d.aggregated_stat) - yScale(0)
				}
			})
			.attr('class', 'team_bar')
	
	} else {
		
		d3.selectAll('.alt_y_axis').remove().transition(trans).attr('opacity', 0)
		
		d3.selectAll('.zero_line')
			.transition(trans)
			.attr('y', yScale(0))
		
		d3.select('.alt_plot').append('g')
			.attr('opacity', 0)
			.attr('class', 'y_axis')
		  .transition(trans)
			.attr('opacity', 1)
			.call(d3.axisLeft(yScale))
		
		bar_selection.enter().append('rect')
		  .merge(bar_selection)
			.transition(trans)
			.attr('x', d => x_alt_scale(d.key))
			.attr('y', function(d) {
				if(yScale(d.aggregated_stat) > yScale(0)) {
					return yScale(0)
				} else {
					return yScale(d.aggregated_stat)
				}
			})
			.attr('height', function(d) {
				if(yScale(d.aggregated_stat) < yScale(0)) {
					return yScale(0) - yScale(d.aggregated_stat)
				} else {
					return yScale(d.aggregated_stat) - yScale(0)
				}
			})
			.attr('width', x_alt_scale.bandwidth())
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
		.attr("transform", d => 'translate('+(x_alt_scale(d.key)+x_alt_scale.bandwidth()/2)+','+(alt_height+15)+')rotate(-45)')
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
	var option_height = actual_height - main_height - 100
	
	// Set up options data
	var positions = nfl_data.map(d => d.position).filter((v, i, a) => a.indexOf(v) === i)
	positions.unshift('All')
	var graph_plot = ['career_av', 'first4_av']
	option_box = [positions, graph_plot]
	
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
				return 'translate(0,'+((3/5)*option_height)+')'
			}
		})
		.attr('class', function(d,i) {
			var names = ['options_position', 'options_stat']
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
	var option_headers = ['Position', 'Plot - Performance Metric']
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
		.range([30, (3/5)*option_height-10])
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
		.attr('fill', function(d) {return color_array[d];})
		.attr('opacity', .5)
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
	band_x.domain([0,1])
		
	band_y.domain([0])
		.range([30, (2/5)*option_height-10])
		
	// Set up buttons
	d3.select('.options_stat').selectAll('boxes')
		.data(d => d).enter().append('g')
		.attr('class', 'stat_buttons')
		.attr('id', d => d+'_button')
		.attr('transform', (d,i) => 'translate('+band_x(i % 2)+','+(band_y(0)-5)+')')
	  .append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', band_x.bandwidth())
		.attr('height', ((2/5)*option_height)-40)
		.style('stroke', '#000000')
		.attr('fill', 'White')
		.style('stroke-width', 1.5)
		
	// Text in buttons
	button_names = ['Career Value', 'First4 Value', 'Pro Bowls', 'Start Seasons']
	d3.selectAll('.stat_buttons').append('text')
		.text((d,i) => button_names[i])
		.attr('x', band_x.bandwidth()/2)
		.attr('y', (((2/5)*option_height)-40)/2)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.attr('font-family', 'sans-serif')
	
	// Set up initial state of the buttons - button fill is dark grey
	d3.select('#All_button').select('rect').attr('fill', '#999999').attr('opacity', 1)
	d3.select('#career_av_button').select('rect').attr('fill', '#999999')
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
		//d3.selectAll('.position_buttons').selectAll('rect').attr('fill', 'white')
	//d3.select(this).select('rect').attr('fill', '#999999')
	d3.selectAll('.position_buttons').selectAll('rect').attr('fill', function(d) {return color_array[d];}).attr('opacity', .5)

	//d3.selectAll('.position_buttons').selectAll('rect').attr('fill', d => color_array[d.position])
	d3.select(this).select('rect').attr('opacity', 1)

	var id = d3.select(this).attr('id')
	var pos = id.slice(0, -7)

	cached_pos = pos
	
	d3.selectAll('.points')
		.attr('fill', fill_points)
		
	visualize_alt_plot(cached_data)
}

// Fills the points with colors based on the selected position
function fill_points(d) {
	if(cached_pos == 'All') {
		return color_array[d.position]
	} else if(d.position != cached_pos) {
		return unviewed_color
	} else {
		return color_array[d.position]
	}
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
	
	cached_brush = cached_stat
	
	visualize_alt_plot(cached_data, true)
}

// Does the interactions for the brush stat changing
function brush_stat_change(d,i) {
	
}

// Updates the brush for when there is a position or stat change
function update_brush() {
	
}

// When a point is hovered over, gives information about the player such as
// Name, Position, Pick Number, Year, Team
// inspiration found here: http://bl.ocks.org/d3noob/a22c42db65eb00d4e369
// Also: http://jarrettmeyer.com/2018/06/05/svg-multiline-text-with-tspan
function hover_over(d,i,g) {
	if(d3.select(this).attr('fill') == unviewed_color) {
		return
	}
	
	// calculate position of box origin
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

	// draw box
	d3.select('.mainplot').append('g').attr('class', 'hover_box').attr('transform', 'translate(' + (w) + ',' + (h)+ ')')
		.append('rect')
		.attr('x', -45).attr('y', -7).attr('width', 120).attr('height', 75)
		.attr('fill', '#F8F8FF')
		// .attr('opacity', 0)
		// .transition().duration(50)
		.attr('opacity', 0.8)

	// text inside rectangle
	var text = d3.select('.hover_box').append('text')
		.append('tspan')
		.attr('x', 15)
		.text(d.player)
		.attr('font-size', '12px')
		.attr('font-family', 'sans-serif')
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.append('tspan')
		.text(d.position)
		.attr('font-size', '12px')
		.attr('font-family', 'sans-serif')
		.attr('x', 15)
		.attr('dy', 15)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.append('tspan')
		.text(d.year + ', Pick ' + d.pick)
		.attr('font-size', '12px')
		.attr('font-family', 'sans-serif')
		.attr('x', 15)
		.attr('dy', 15)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.append('tspan')
		.text(cached_stat + ': ' + d[cached_stat])
		.attr('font-size', '12px')
		.attr('font-family', 'sans-serif')
		.attr('x', 15)
		.attr('dy', 15)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.append('tspan')
		.text(d.team)
		.attr('font-size', '12px')
		.attr('font-family', 'sans-serif')
		.attr('x', 15)
		.attr('dy', 15)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		// .attr('opacity', 0)
		// .transition().duration(300)
		.attr('opacity', 1)
}

// When you hover out of a point, the box disappears
function hover_out(d,i,g) {
	var box = d3.selectAll('.hover_box')
	box.select('rect').transition().duration(300).attr('opacity', 0)
	box.select('html').transition().duration(300).attr('opacity', 0)
	box.remove()
}

function brushing_context() {

	var brush_width = main_width;
	var brush_height = main_height / 5;

	//x_date = d3.scaleTime().domain([min_year, max_year]).range([0, brush_width]).clamp(true)

	x_date = d3.scaleLinear().domain([min_year, max_year]).range([0, brush_width]).clamp(true)
	

	var x_axis2 = d3.axisBottom(x_date).ticks(20).tickFormat(d3.format("d"));
	var y_axis2 = d3.axisLeft(y_scale)

	var brush = d3.brushX().extent([[0,0], [brush_width, brush_height]]).on("brush end", brushed)

	var slider = d3.select('.mainview').append('g').attr('class', 'slider')
	.attr('transform', 'translate(0,'+ (main_height+45) +')')

	//.attr('transform', 'translate('+(main_width+x_pad)+',0)')

	aggregate_year(nfl_data)

	var min_year_Avg = Math.min.apply(Math, year_data.map(function(d) {return d.career_av; }))
    var max_year_Avg = Math.max.apply(Math, year_data.map(function(d) {return d.career_av; }))
	var y_scale = d3.scaleLinear().domain([min_year_Avg, max_year_Avg]).range([brush_height, 0])

/*
	d3.select('.mainview').append('g').attr('class', 'legend')
		.attr('transform', 'translate('+(main_width+10)+',0)');

	  d3.select('.mainplot').append('g')
		.attr('class', '.x_axis')
		.attr('transform', 'translate(0,'+(main_height)+')')
*/
	var dotslider = slider.append('g').attr('class', 'year_points');
	dotslider.selectAll('points')
	.data(year_data)
	.enter().append('circle')
	.attr('class', 'dotslider')
	.attr('r', 3)
	.style('opacity', .5)
	.attr("cx", function (d) {
            return x_date(d.year);})
    .attr("cy", function (d) {
           return y_scale(d.career_av);})


    slider.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + brush_height + ")")
        .call(x_axis2)

    slider.append("text")
		.attr("transform", "rotate(-90)")
		.attr('y', -35)
		.attr('x', -(brush_height)/2)
		.style("text-anchor", "middle")
		.style('font-size', '18px')
		.attr('font-weight', 'bold')
		.attr('font-family', 'sans-serif')
		.text('Average Career')
		.attr('class', 'y_axis_label')

    slider.append('text')
        .attr('x', brush_width/2)
        .attr('y', main_height/2 - brush_height - 10)
        .style("text-anchor", "middle")
		.style('alignment-baseline', 'central')
		.attr('font-family', 'arial')
		.attr('font-size', '18px')
		.attr('font-weight', 'bold')
		.text('Year')
		.attr('class', 'x_axis_label');

    slider.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, x_date.range());

}

// allow you to change round that is plotted on the x-axis
function pick_round() {
	var round_width = main_width
	var round_height = main_height / 15
	var button_height = main_height+45+main_height/5+60

	// set up rounds
	var rounds = nfl_data.map(d => d.round).filter((v, i, a) => a.indexOf(v) === i)
	rounds.unshift('All')

	// scale for rounds
	var band_x = d3.scaleBand().domain([0,1,2,3,4,5,6,7])
		.range([0, round_width])
		.paddingInner([.1])
		.paddingOuter([.1])

	d3.select('.mainview').append('g').attr('class', 'rounds')
		.attr('transform', 'translate('+0+','+button_height+')')

	// Set up buttons
	d3.select('.rounds').selectAll('boxes')
		.data(rounds).enter().append('g')
		.attr('class', 'round_buttons')
		.attr('id', d => d+'_round')
		.attr('transform', (d,i) => 'translate('+band_x(i % 8)+','+0+')')
	  .append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', band_x.bandwidth())
		.attr('height', round_height)
		.style('stroke', '#000000')
		.attr('fill', 'White')
		.style('stroke-width', 1.5)

	// Text in buttons
	var button_names = ['All', '1', '2', '3', '4', '5', '6', '7']
	d3.selectAll('.round_buttons').append('text')
		.text((d,i) => button_names[i])
		.attr('x', band_x.bandwidth()/2)
		.attr('y', (round_height/2))
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.attr('font-family', 'sans-serif')	

	d3.select('.rounds').append("text")
		.attr('y', ((round_height)/2+5))
		.attr('x', -((round_height)/2+8))
		.style("text-anchor", "middle")
		.style('font-size', '16px')
		.attr('font-weight', 'bold')
		.attr('font-family', 'sans-serif')
		.text('Round')
		
	// initial state of button
	d3.select('#All_round').select('rect').attr('fill', '#999999')
}

function round_change() {
	// Highlight the new button
	d3.selectAll('.round_buttons').selectAll('rect').attr('fill', 'white')
	d3.select(this).select('rect').attr('fill', '#999999')
	
	var id = d3.select(this).attr('id')
	var round = id.slice(0, -6)
	var new_data
	
	// filter data by round
	if (round != 'All') {
		new_data = nfl_data.filter(function(elem) { 
			if (elem.round == round)
				return elem;
		})
		
		brush_data = nfl_data.filter(d => d.round == round)
	} else {
		new_data = nfl_data
		brush_data = nfl_data
	}
	
	new_data = new_data.filter(slider_filter)

	// change axis and visualize data
	update_x_axis(brush_data)
	visualize_new(new_data)
}

function update_x_axis(new_data) {
	// Set up Scales
    var minX = d3.min(new_data, d => d.pick)
    var maxX = d3.max(new_data, d => d.pick)
	
	xScale = d3.scaleLinear().domain([minX-2, maxX+2]).range([0, main_width])

	d3.selectAll('.x_axis').remove().transition(trans).attr('opacity', 0)
		
	d3.select('.mainplot').append('g')
		.attr('transform', 'translate(0,'+(main_height)+')')
		.attr('opacity', 0)
		.attr('class', 'x_axis')
	  .transition(trans)
		.attr('opacity', 1)
		.call(d3.axisBottom(xScale))
}

function aggregate_year(data) {
	
	year_data = d3.nest()
		.key(function(d) { return d.year; })
		.rollup(function(v) { return d3.sum(v, function(d) {return d.career_av; }); })
		.entries(data);

	year_data.forEach(function(d) {
		d.year = d.key;
		d.career_av = d.value;
	});
}

// visualize new data set
function visualize_new(new_data) {
	
	var points = d3.select('.mainplot').select('.point_group')
		.selectAll('circle').data(new_data, d => d.position)

	points.exit().remove()

	points.enter().append('circle')
	  .merge(points)
		.attr('class', 'points')
		.attr('r', 3)
		.attr('cx', d => xScale(d.pick))
		.attr('cy', d => yScale(d[cached_stat]))
		.attr('fill', fill_points)
		.style('opacity', .5)
		.attr('id', 'viewed')
		
	d3.selectAll('.points').on('mouseover', hover_over).on('mouseout', hover_out)
	
	cached_data = new_data
	
	visualize_alt_plot(cached_data, false)
}

function brushed() {
    var selection = d3.event.selection;
	if (selection !== null) {
		var e = d3.event.selection.map(x_date.invert, x_date);
		
		date1 = e[0]
		date2 = e[1]
		
		/*
		// for the slider portion
		// return element if it is between the two points
		// is this necessary?
		var test = slider.selectAll(".dotslider");
		test.classed("selected", function (d) {
			return e[0] <= d.date && d.date <= e[1];
		})


		var test2 = d3.select('.mainplot').selectAll(".points");
		test2.classed("selected", function (d) {
			return e[0] <= d.date && d.date <= e[1];
		})
		*/
		var new_data = brush_data.filter(slider_filter)
		/*
		d3.select('.mainplot').selectAll(".lineplot")
			.attr("d", plotline(
				data.filter(function (d) {
					return e[0] <= d.date && e[1] >= d.date;
				})
			));
			*/
		
		visualize_new(new_data)
	}
}

function slider_filter(elem) {
	if(date1 <= elem.year && elem.year <= date2)
		return elem;
}



















