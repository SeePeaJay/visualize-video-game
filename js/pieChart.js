class PieChart {
  constructor(_config, _dispatcher, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 300,
      containerHeight: 200,
      margin: {
        top: 10, right: 110, bottom: 10, left: 10,
      },
    };
    this.dispatcher = _dispatcher;
    this.data = _data;

    this.initVis();
  }

  /* Create SVG area, initialize scales and axes */
  initVis() {
    const vis = this;

    /* Define inner chart dimensions */
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    vis.radius = Math.min(vis.width, vis.height) / 2;

    /* Define size of SVG drawing area */
    vis.svg = d3.select('#pie-vis').append('svg')
      .attr('id', 'pie-chart')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    /* Append chartArea (the group element that will contain the actual arcs)
    and position it according to the given margin config */
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.radius + vis.config.margin.left},${vis.radius + vis.config.margin.top})`);

    /* Set up the colors for the chart */
    vis.color = d3.scaleOrdinal()
      .domain(Object.keys(vis.data))
      .range(d3.schemeSet2);

    /* Set up the arc generator */
    vis.arc = d3.arc()
      .outerRadius(vis.radius - 10)
      .innerRadius(0);

    /* Set up the pie generator */
    vis.pie = d3.pie()
      .sort(null)
      .value((d) => d.value);

    vis.updateVis();
  }

  updateVis() {
    const vis = this;

    vis.entries = Object.keys(vis.data).map((key) => ({ key, value: vis.data[key] }));

    vis.renderVis();
    // vis.renderLegend();
  }

  /* Bind data to visual elements */
  renderVis() {
    const vis = this;

    /* Draw the slices of the pie chart */
    vis.arcs = vis.chartArea.selectAll('.arc')
      .data(vis.pie(vis.entries))
      .enter() // enter should be fine ...
      .append('g')
      .attr('class', 'arc');

    // Draw each slice of the pie chart
    vis.arcs.append('path')
      .attr('d', vis.arc) // must be able to access startAngle and endAngle somehow
      .attr('fill', (d) => vis.color(d.data.key)); // d.data due to pie it seems

    // Add labels to the slices
    vis.arcs.append('text')
      .attr('transform', (d) => `translate(${vis.arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .text((d) => d.data.key);
  }

  // renderLegend() {
  // }
}
