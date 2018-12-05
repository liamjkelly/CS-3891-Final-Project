// FIXME:
// - NEED TO FIX THE BAR GRAPHS on the alt plot (going off top, 0 is not bottom - ADD SOME SORT OF LINE FOR 0)
// - Brush y-axis label needs to change on stat_change()
// - Aggregate point in brush not changing in First4AV
// - Different color for 'Other'
// - Labels for the round selector

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
var color_array = {QB: '#0900FF', RB: scheme[2], WR_TE: scheme[1], OL: '#2CA3A8',
				   DB: '#87008F', DL_LB: scheme[3], Other: '#F662FF'}H
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
		.attr('x', -((round_height)/2+5))
		.style("text-anchor", "middle")
		.style('font-size', '16px')
		.attr('font-weight', 'bold')
		.attr('font-family', 'sans-serif')
		.text('Round')
		.attr('class', 'y_axis_label')
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
	update_x_axis(new_data)
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



















