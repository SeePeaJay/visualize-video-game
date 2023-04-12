class BubbleChart {
  constructor(_config, _dispatcher, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 300,
      containerHeight: 350,
      margin: {
        top: 10, right: 10, bottom: 10, left: 10,
      },
    };
    this.dispatcher = _dispatcher;
    this.data = _data;

    this.initVis();
  }

  /* Create SVG area, initialize scales and axes */
  initVis() {
    let vis = this;

    /* define inner chart dimensions */
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // radius scale
    vis.radiusScale = d3.scaleSqrt()
        .range([1,4]);

    // colour scale
    vis.colourScale = d3.scaleOrdinal(d3.schemeSet3);

    /* define size of SVG drawing area */
    vis.svg = d3.select('#bubble-vis').append('svg')
        .attr('id', 'bubble-chart')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // append chartArea
    vis.chartArea = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // initialize force simulation
    function charge(d) {
      return Math.pow(d.radius, 2.0) * 0.01
    }
    vis.simulation = d3.forceSimulation()
        .velocityDecay(0.6)
        .force('charge', d3.forceManyBody().strength(charge))
        .force('center', d3.forceCenter(vis.width / 2, vis.height / 2))
        .force('collision', d3.forceCollide().radius(d => vis.radiusScale(d.count) + 4))
        .alphaTarget(0.8).alphaMin(0.7); // prevents the simulation from stopping
    vis.updateVis();
  }

  updateVis() {
    let vis = this;
    vis.chartArea.selectAll('.genre-circle').remove();
    vis.chartArea.selectAll('.genre-label').remove();

    //prepare data
    let aggregatedData = d3.rollup(vis.data, v => v.length, d => d.Genre);
    vis.aggregatedData = Array.from(aggregatedData, ([key, count]) => ({ key, count }));
    // accessors
    vis.xValue = d => d.key;
    vis.yValue = d => d.count;
    vis.radiusScale(d3.min(vis.aggregatedData, vis.yValue), d3.max(vis.aggregatedData, vis.yValue));
    vis.colourScale.domain(vis.aggregatedData.map(vis.xValue));
    vis.simulation.nodes(vis.aggregatedData);
    vis.renderVis();
  }

  /* bind data to visual elements */
  renderVis() {
    let vis = this;
    let activeGenre = "";

    let nodes = vis.chartArea.selectAll('.circle')
        .data(vis.aggregatedData, d => d.key)
        .join('circle')
        .attr('class', d => 'genre-circle ' + d.key)
        .attr('r', d => vis.radiusScale(d.count))
        .attr('fill', d => vis.colourScale(d.key))
        .on('mouseover.style', function(event, d){
          d3.select(this).classed('bubblehover', true);
        })
        .on('mouseleave.style', function(event, d){
          d3.select(this).classed('bubblehover', false);
        })
        .on('click.bubble', function(event, d){
          if (d3.select(this).node().classList.contains('bubbleactive') === false){
            d3.selectAll(".bubbleactive").classed('bubbleactive', false);
            d3.select(this).classed('bubbleactive', !d3.select(this).node().classList.contains('bubbleactive'));
            activeGenre = d3.select(this).node().classList[1]; // sets activeGenre to the selected Genre name; ex// "Action"
          }
          else {
            d3.select(this).classed('bubbleactive', !d3.select(this).node().classList.contains('bubbleactive'));
            activeGenre = ""; // no genres selected, set activeGenre to ""
          }
        });
    let labels = vis.chartArea.selectAll('.label')
        .data(vis.aggregatedData, d => d.key)
        .join('text')
        .attr('class', 'genre-label')
        .attr('text-anchor', 'middle')
        .text(d => d.key);

    vis.simulation.on('tick', () => {
      nodes
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);

      labels
          .attr('x', d => d.x)
          .attr('y', d => d.y+4);
    });
  }
  updateFromSlider(sliderRange) {
    let vis = this;
    let filteredData = vis.data.filter(d => d.Year_of_Release >= sliderRange[0]);
    filteredData = filteredData.filter(d => d.Year_of_Release <= sliderRange[1]);
    vis.data = filteredData;
    console.log(filteredData);
    console.log(sliderRange);
    vis.updateVis();
  }
}
