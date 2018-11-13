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
		.attr('transform', 'translate('+(actual_width/3)+','+(actual_height*(2/7))+')');
}