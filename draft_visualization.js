var width = 1200, height = 800;
var x_pad = 50, y_pad = 20;
var actual_width = width-2*x_pad, actual_height = height-2*y_pad
var main_width = actual_width*(3/4), main_height = actual_height*(2/3)

var xScale, yScale
var scheme = d3.schemeCategory10
var color_array = {QB: scheme[0], RB: scheme[2], WR_TE: scheme[1], OL: scheme[8],
				   DB: scheme[4], DL_LB: scheme[3], Other: scheme[6]}
var option_box

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
		.attr('transform', 'translate(0,'+(main_height+20)+')');
	d3.select('.mainview').append('g').attr('class', 'options')
		.attr('transform', 'translate('+(main_width+10)+','+(actual_height*(2/7))+')');
	
	// Set up Scales
    var minX = d3.min(nfl_data, d => d.pick)
    var maxX = d3.max(nfl_data, d => d.pick)
    var minY = Math.min.apply(Math, nfl_data.map(function(d) {return d.career_av; }))
    var maxY = Math.max.apply(Math, nfl_data.map(function(d) {return d.career_av; }))
    
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
	
	set_up_options()
}

// Sets up all of the svg related things to the options box
function set_up_options() {
	var option_width = actual_width - main_width
	var option_height = main_height - actual_height*(2/7)
	
	// Set up options data
	var positions = nfl_data.map(d => d.position).filter((v, i, a) => a.indexOf(v) === i)
	var graph_stat = ['career_av', 'first4_av', 'probowls', 'seasons']
	var graph_style = ['Scatter Plot', 'Bar Graph']
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
	var band_x = d3.scaleBand().domain(positions.slice(0,4))
		.range([0, option_width])
		.paddingInner([.1])
		.paddingOuter([.1])
	var band_y = d3.scaleBand().domain([0,1])
		.range([30, (3/8)*option_height-10])
		.paddingInner([.2])
		.paddingOuter([0])
		
	// Set up buttons
	d3.select('.options_position').selectAll('boxes')
		.data(d => d.slice(0,4)).enter().append('g')
		.attr('class', 'position_buttons')
		.attr('transform', (d) => 'translate('+band_x(d)+','+band_y(0)+')')
	
	band_x.domain(positions.slice(4,7))
		.paddingOuter([.6])
	
	d3.select('.options_position').selectAll('boxes')
		.data(d => d.slice(4,7)).enter().append('g')
		.attr('class', 'position_buttons')
		.attr('transform', (d) => 'translate('+band_x(d)+','+band_y(1)+')')
	 
	// Set up buttons
	d3.selectAll('.position_buttons').append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', band_x.bandwidth())
		.attr('height', band_y.bandwidth())
		.style('stroke', '#000000')
		.attr('fill', 'White')
		.style('stroke-width', 1.5)

	// Text in buttons
	var button_names = ['QB', 'DL/LB', 'WR/TE', 'OL', 'RB', 'DB', 'Other']
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
	var button_names = ['Career Value', 'First4 Value', 'Pro Bowls', 'Start Seasons']
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
	d3.selectAll('.style_buttons').append('text')
		.text(d => d)
		.attr('x', band_x.bandwidth()/2)
		.attr('y', (((1/4)*option_height)-40)/2)
		.style('text-anchor', 'middle')
		.style('alignment-baseline', 'central')
		.attr('font-family', 'sans-serif')
}




















