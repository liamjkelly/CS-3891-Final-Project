function plot_it() {

	var width = 2000, height = 800;
	var pad = 80;
	var actual_width = 2000-2*pad, actual_height = 800-2*pad;
	d3.select('body').append('svg').attr('width', width).attr('height', height);
	d3.select('svg').append('g').attr('transform', 'translate('+pad+','+pad+')').attr('class', 'mainview');

	d3.select('.mainview').append('g').attr('class', 'mainplot');
	d3.select('.mainplot').append('rect').attr('class', 'bkgd')
		.attr('width', (actual_width/3))
		.attr('height', (actual_height*(2/3)))
		.attr('opacity', 0.2);
	d3.select('.mainview').append('g').attr('class', 'legend')
		.attr('transform', 'translate('+(actual_width/3)+','+0+')');
	d3.select('.mainview').append('g').attr('class', 'brush')
		.attr('transform', 'translate(0,'+(actual_height*(2/3)+20)+')');
	d3.select('.mainview').append('g').attr('class', 'options')
		.attr('transform', 'translate('+(actual_width/3+10)+','+(actual_height*(2/7))+')');
    d3.select('.options').append('rect').attr('id', 'optionsbox')
    	.attr('width', (actual_width/7))
    	.attr('height', (actual_height*(3/8)))
    	.attr('fill', 'none')
    	.attr('stroke-width', 2)
    	.attr('stroke', '#000000');

    console.log(nfl_data);
    
    var minX = 0;
    var maxX = 257;
    var minY = Math.min.apply(Math, nfl_data.map(function(d) {return d.CareerAV; }));
    var maxY = Math.max.apply(Math, nfl_data.map(function(d) {return d.CareerAV; }));
    
    console.log(nfl_data.Pick);
    
    var xVal = function(d) {return d.Pick;};
    var yVal = function(d) {return d.CareerAV;};
    var xScale = d3.scaleLinear().domain([minX, maxX]).range([0, actual_width/3]);
    var yScale = d3.scaleLinear().domain([minY, maxY]).range([actual_height * (2/3), 0]);
    var xMap = function(d) {return xScale(xVal(d));};
    var yMap = function(d) {return yScale(yVal(d));};
    
/*
    d3.select('.mainview').append('g').attr('key', '.y_axis').attr('transform', 'translate(80,0)').call(d3.axisLeft(yScale));
    d3.select('.mainview').append('g').attr('key', '.x_axis').attr('transform', 'translate(0,' + 720  +')').call(d3.axisBottom(xScale));
    d3.select('.mainview').append('g').attr('key', 'points').selectAll('points').data(nfl_data).enter().append('circle').attr('class', 'points').attr('r', 4).attr('cx', xMap).attr('cy', yMap).attr('fill', 'green').style('opacity', .2);
    */
    d3.select('.mainplot').append('g').attr('key', '.y_axis').call(d3.axisLeft(yScale));
    d3.select('.mainplot').append('g').attr('key','.x_axis').attr('transform', 'translate(0,' + 426  +')').call(d3.axisBottom(xScale));
d3.select('.mainplot').append('g').attr('key','points').selectAll('points').data(nfl_data).enter().append('circle').attr('class', 'points').attr('r', 4).attr('cx', xMap).attr('cy', yMap).attr('fill', 'green').style('opacity', .2);
    
    d3.select('.mainplot').append("text")
    .attr("transform", "rotate(-90)")
    .attr('y', -50 )
    .attr('x', -220)
    .attr('dy', "1em")
    .style("text-anchor", "middle")
    .text("Career Average");
    
    d3.select('.mainplot').append('text').attr('x', actual_width/6).attr('y', actual_height * (5/7)).style("text-anchor", "middle").text('Pick');
    //d3.select('.x_axis').append('g').append("text").attr("transform","translate(" + (width/2) + " ," +(height - pad/2) + ")").text('Pick');
    
}
