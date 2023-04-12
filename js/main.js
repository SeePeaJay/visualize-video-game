/**
 * Initialize dispatcher that is used to orchestrate events
 */
const dispatcher = d3.dispatch('onPointClick', 'onBubbleClick');

/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/Video_Games_Sales_as_at_22_Dec_2016.csv').then((_data) => {
  /* data preprocessing */
  for (let i = 0; i < _data.length; i++) {
    _data[i].id = i; // id starts at 0
    _data[i].Name += ` [${_data[i].Platform}]`;

    Object.keys(_data[i]).forEach((attr) => {
      if (attr !== 'Name' && attr !== 'Platform' && attr !== 'Genre' && attr !== 'Publisher' && attr !== 'Developer' && attr !== 'Rating') {
        _data[i][attr] = +_data[i][attr];
      }

      if (attr === 'User_Score') {
        _data[i][attr] *= 10;
      }
    });

    _data[i].Review_Score_Diff = _data[i].Critic_Score - _data[i].User_Score;
  }
  const data = _data.filter((d) => {
    const values = Object.values(d);
    return !values.some((value) => value === '' || Number.isNaN(value)) && d.Year_of_Release >= 2012 && d.Critic_Count > 0 && d.User_Count > 0;
  });

  /* reset search bar value */
  const searchBar = d3.select('#search-bar').node();
  searchBar.value = '';

  /* populate search bar options */
  const gameNames = [...new Set(data.map((d) => d.Name))].sort();
  const addOptions = (options) => {
    const dataList = document.querySelector('#games');

    options.forEach((option) => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `<option value="${option}">`;
      dataList.appendChild(wrapper.firstChild);
    });
  };
  addOptions(gameNames);

  /* initialize slider */
  const slider = document.getElementById('slider');

  /* initialize vis */
  const bubbleChart = new BubbleChart(
    { parentElement: '#bubble-vis' },
    dispatcher,
    data,
  );
  const scatterPlot1 = new ScatterPlot(
    {
      parentElement: '#scatter-vis', title: 'Correlation b/w Critic & User Score', xAxisTitle: 'User Scores', yAxisTitle: 'Critic Scores',
    },
    dispatcher,
    data,
  );
  const scatterPlot2 = new ScatterPlot(
    {
      parentElement: '#scatter-vis', title: 'Correlation b/w Diffs in Scores & Global Sales', xAxisTitle: 'Global Sales (millions)', yAxisTitle: 'Critic - User Score',
    },
    dispatcher,
    data,
  );
  const pieChart = new PieChart(
    { parentElement: '#pie-vis' },
    null,
    data[0],
  );

  /* initialize game stats */
  const updateStats = (gameId) => {
    const displayedGameData = data.find((d) => d.id === gameId);

    // update stats text
    d3.select('#stats-text')
      .style('display', 'block')
      .html(`<strong>${displayedGameData.Name}</strong><ul><li>Year of release: ${displayedGameData.Year_of_Release}</li><li>Genre: ${displayedGameData.Genre}</li><li>Rating: ${displayedGameData.Rating}</li><li>Developer: ${displayedGameData.Developer}</li><li>Publisher: ${displayedGameData.Publisher}</li><li>Critic Score: ${displayedGameData.Critic_Score}</li><li>Critic Count: ${displayedGameData.Critic_Count}</li><li>User Score: ${displayedGameData.User_Score}</li><li>User Count: ${displayedGameData.User_Count}</li></ul>`);

    // update pie chart
    pieChart.data = displayedGameData;
    pieChart.updateVis();
  };
  updateStats(data[0].id);

  /* update scatter plot */
  const updateScatterPlots = ({ idOfGameSelectedInScatter, genreSelectedInBubble }) => {
    // reset any highlighted game in scatterplot
    scatterPlot1.config.selectedGameId = '';
    scatterPlot2.config.selectedGameId = '';

    // filter data and possibly set highlighted game in scatter based on parameters
    const sliderRange = slider.noUiSlider.get().map((i) => +i);
    let filteredData = data.filter(
      (d) => d.Year_of_Release >= sliderRange[0] && d.Year_of_Release <= sliderRange[1]
      && (genreSelectedInBubble ? d.Genre === genreSelectedInBubble : true),
    );
    if (idOfGameSelectedInScatter) {
      const genreOfGameSelectedFromScatter = data.find(
        (d) => d.id === idOfGameSelectedInScatter,
      ).Genre;
      filteredData = filteredData.filter((d) => d.Genre === genreOfGameSelectedFromScatter);

      scatterPlot1.config.selectedGameId = idOfGameSelectedInScatter;
      scatterPlot2.config.selectedGameId = idOfGameSelectedInScatter;
    }

    // assign filtered data and update vis
    scatterPlot1.data = filteredData;
    scatterPlot2.data = filteredData;
    scatterPlot1.updateVis();
    scatterPlot2.updateVis();
  };

  /* handle search bar interaction */
  d3.select('#search-bar').on('input', (event) => {
    if (gameNames.includes(searchBar.value)) {
      const selectedGameData = data.find((d) => d.Name === searchBar.value);

      // update slider
      slider.noUiSlider.set([selectedGameData.Year_of_Release, selectedGameData.Year_of_Release]);

      // update bubble chart genre: search bar --> scatterplot --> bubble chart
      bubbleChart.updateFromScatter(selectedGameData.Genre);

      // update scatter plots
      updateScatterPlots({ idOfGameSelectedInScatter: selectedGameData.id });

      // update stats
      updateStats(selectedGameData.id);
    }
  });

  /* handle slider interaction */
  slider.noUiSlider.on('slide', () => {
    // bubble chart update on slider
    const sliderRange = slider.noUiSlider.get().map((i) => +i);
    bubbleChart.data = data;
    bubbleChart.updateFromSlider(sliderRange);

    // update scatterplot; any selected game in the scatterplot will be deselected
    updateScatterPlots({});
  });

  /* handler for clicking on a genre in bubble chart; should filter scatterplot points */
  dispatcher.on('onBubbleClick', (selectedGenre) => {
    updateScatterPlots({ genreSelectedInBubble: selectedGenre });
  });

  /* handler for clicking on a point in scatterplot */
  dispatcher.on('onPointClick', (selectedGameId) => {
    const selectedGame = data.find((d) => d.id === selectedGameId);

    // update search bar value
    document.getElementById('search-bar').value = selectedGame.Name; // aside: does not trigger input event

    // update slider
    slider.noUiSlider.set([selectedGame.Year_of_Release, selectedGame.Year_of_Release]);

    const sliderRange = slider.noUiSlider.get().map((i) => +i);
    bubbleChart.data = data;
    bubbleChart.updateFromSlider(sliderRange);

    // update vis & stats
    updateScatterPlots({ idOfGameSelectedInScatter: selectedGameId });
    updateStats(selectedGameId);

    // update selected bubble genre
    bubbleChart.updateFromScatter(selectedGame.Genre)
  });
});
