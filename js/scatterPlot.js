class ScatterPlot {
  constructor(_config, _dispatcher, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 450,
      containerHeight: 450,
      margin: {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      },
      title: _config.title,
      xAxisTitle: _config.xAxisTitle,
      yAxisTitle: _config.yAxisTitle,
    };
    this.dispatcher = _dispatcher;
    this.data = _data;

    this.initVis();
  }

  /* create SVG area, initialize scales and axes */
  initVis() {
    const vis = this;

    /* define inner chart size */
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    /* define size of SVG drawing area */
    vis.svg = d3.select(vis.config.parentElement).append('svg')
      .attr('id', 'scatter-plot')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    /* append chartArea (the group element that will contain the actual chart)
    and position it according to the given margin config */
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    /* append axis groups */
    vis.xAxisGroup = vis.chartArea.append('g')
      .attr('class', 'scater-axis scatter-axis--x')
      .attr('transform', `translate(0, ${vis.height})`); // move entire axis group to the bottom
    vis.yAxisGroup = vis.chartArea.append('g')
      .attr('class', 'scatter-axis scatter-axis--y');

    /* append vis title */
    vis.title = vis.yAxisGroup.append('text')
      .attr('id', 'scatterplot-title')
      .text(vis.config.title)
      .attr('transform', 'translate(-36, -24)');

    /* append axis titles */
    vis.xAxisTitle = vis.yAxisGroup.append('text')
      .attr('class', 'scatterplot-axis__label')
      .attr('transform', `translate(${vis.width}, ${vis.height + 24})`)
      .text(vis.config.xAxisTitle);
    vis.yAxisTitle = vis.yAxisGroup.append('text')
      .attr('class', 'scatterplot-axis__label')
      .attr('transform', 'translate(-24, 0)rotate(-90)') // rotate entire axis
      .text(vis.config.yAxisTitle);

    /* initialize scales and axes */
    vis.xScale = d3.scaleLinear()
      .domain(vis.config.xAxisTitle === 'User Scores' ? [0, 100] : [0, d3.max(vis.data, (d) => d.Global_Sales)])
      .range([0, vis.width]);
    vis.yScale = d3.scaleLinear()
      .domain(vis.config.yAxisTitle === 'Critic Scores' ? [100, 0] : [d3.max(vis.data, (d) => d.Review_Score_Diff), d3.min(vis.data, (d) => d.Review_Score_Diff)])
      .range([0, vis.height]);
    vis.xAxis = d3.axisBottom().scale(vis.xScale)
      .ticks(6)
      .tickSize(-vis.height);
    vis.yAxis = d3.axisLeft().scale(vis.yScale)
      .ticks(6)
      .tickSize(-vis.width);

    /* append actual chart */
    vis.chart = vis.chartArea.append('g');

    vis.updateVis();
  }

  /* prepare data and scales */
  updateVis() {
    const vis = this;

    // vis.scatterData = vis.data.filter((d) => d.pcgdp);
    // TODO: need to conver this into a hexbin? or somehow limit # of items?

    vis.renderVis();
  }

  /* bind data to visual elements, update axes */
  renderVis() {
    const vis = this;

    /* call axes drawing functions */
    vis.xAxisGroup.call(vis.xAxis);
    vis.yAxisGroup.call(vis.yAxis);

    /* draw the points */
    vis.points = vis.chart.selectAll('.point')
      .data(vis.data)
      .join('circle')
      .attr('class', 'point')
      .attr('diff', (d) => d.Review_Score_Diff)
      .attr('cx', (d) => (vis.config.xAxisTitle === 'User Scores' ? vis.xScale(d.User_Score) : vis.xScale(d.Global_Sales)))
      .attr('cy', (d) => (vis.config.yAxisTitle === 'Critic Scores' ? vis.yScale(d.Critic_Score) : vis.yScale(d.Review_Score_Diff)))
      .attr('r', 4);
  }
}
