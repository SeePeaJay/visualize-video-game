class PieChart {
  constructor(_config, _dispatcher, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 300,
      containerHeight: 200,
      margin: {
        top: 10, right: 110, bottom: 10, left: 10,
      },
      legendCategoryWidth: 80,
      legendCategoryHeight: 14,
      legendCategoryRadius: 5,
    };
    this.dispatcher = _dispatcher;
    this.data = _data;

    this.initVis();
  }

  /* Create SVG area, initialize scales and axes */
  initVis() {
    const vis = this;

    /* define inner chart dimensions */
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    vis.radius = Math.min(vis.width, vis.height) / 2;

    /* define size of SVG drawing area */
    vis.svg = d3.select('#pie-vis').append('svg')
      .attr('id', 'pie-chart')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    /* append chartArea (the group element that will contain the actual arcs)
    and position it according to the given margin config */
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.radius + vis.config.margin.left},${vis.radius + vis.config.margin.top})`);

    /* initialize legend group */
    vis.legend = vis.svg.append('g');

    /* define sales data */
    vis.salesData = {
      NA_Sales: vis.data.NA_Sales,
      EU_Sales: vis.data.EU_Sales,
      JP_Sales: vis.data.JP_Sales,
      Other_Sales: vis.data.Other_Sales,
    };

    /* set up the colors for the chart */
    vis.color = d3.scaleOrdinal()
      .domain(Object.keys(vis.salesData))
      .range(d3.schemeSet2);

    /* set up the arc generator */
    vis.arc = d3.arc()
      .outerRadius(vis.radius - 10)
      .innerRadius(0);

    /* set up the pie generator */
    vis.pie = d3.pie()
      .sort(null)
      .value((d) => d.value);

    vis.updateVis();
  }

  updateVis() {
    const vis = this;

    vis.salesData = {
      NA_Sales: vis.data.NA_Sales,
      EU_Sales: vis.data.EU_Sales,
      JP_Sales: vis.data.JP_Sales,
      Other_Sales: vis.data.Other_Sales,
    };

    /* convert sales data into a form digestable by vis.arc */
    vis.entries = Object.keys(vis.salesData).map((key) => ({ key, value: vis.salesData[key] }));

    console.log(vis.data.Name, vis.salesData);

    vis.renderVis();
    vis.renderLegend();
  }

  /* bind data to visual elements */
  renderVis() {
    const vis = this;

    /* draw the slices of the pie chart */
    vis.arcs = vis.chartArea.selectAll('.arc')
      .data(vis.pie(vis.entries))
      .join('path')
      .attr('class', 'arc')
      .attr('d', vis.arc) // must be able to access startAngle and endAngle somehow
      .attr('fill', (d) => vis.color(d.data.key)); // d.data due to pie it seems
  }

  renderLegend() {
    const vis = this;

    // the function for placing legend categories
    const getTranslate = (d, i) => {
      const tx = 200; const ty = 120;
      const x = (i % 1) * vis.config.legendCategoryWidth + tx;
      const y = i * vis.config.legendCategoryHeight + ty;

      return `translate(${x}, ${y})`;
    };

    vis.legendElements = vis.legend.selectAll('g')
      .data(Object.keys(vis.salesData))
      .join('g')
      .attr('transform', getTranslate);

    /* render the icons */
    vis.legendElements.selectAll('circle')
      .data((d) => [d])
      .join('circle')
      .attr('r', vis.config.legendCategoryRadius)
      .attr('fill', (d) => vis.color(d));

    /* render the texts */
    vis.legendElements.selectAll('text')
      .data((d) => [d])
      .join('text')
      .attr('class', 'legend-category-text')
      .attr('transform', `translate(${vis.config.legendCategoryRadius * 2}, ${vis.config.legendCategoryRadius})`)
      .text((d) => d);
  }
}
