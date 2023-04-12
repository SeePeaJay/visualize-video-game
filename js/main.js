/**
 * Initialize dispatcher that is used to orchestrate events
 */
const dispatcher = d3.dispatch('onPointClick');

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

  console.log(data);

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
    null,
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

  const updateScatterPlots = (selectedGameId) => {
    const sliderRange = slider.noUiSlider.get().map((i) => +i);

    scatterPlot1.data = data.filter(
      (d) => d.Year_of_Release >= sliderRange[0] && d.Year_of_Release <= sliderRange[1],
    );
    scatterPlot2.data = data.filter(
      (d) => d.Year_of_Release >= sliderRange[0] && d.Year_of_Release <= sliderRange[1],
    );

    if (selectedGameId) {
      scatterPlot1.config.selectedGameId = selectedGameId >= 0 ? selectedGameId : '';
      scatterPlot2.config.selectedGameId = selectedGameId >= 0 ? selectedGameId : '';
    }

    scatterPlot1.updateVis();
    scatterPlot2.updateVis();
  };

  /* handle search bar interaction */
  d3.select('#search-bar').on('input', (event) => {
    if (gameNames.includes(searchBar.value)) {
      const selectedGameData = data.find((d) => d.Name === searchBar.value);

      // update slider
      slider.noUiSlider.set([selectedGameData.Year_of_Release, selectedGameData.Year_of_Release]);

      // TODO: update bubble chart

      // TODO: update scatter plots (need to filter by genre too)
      updateScatterPlots(selectedGameData.id);

      // update stats
      updateStats(selectedGameData.id);
    }
  });

  /* handle slider interaction */
  slider.noUiSlider.on('slide', () => {
    // if there is a game selected/highlighted in the scatterplot, and the new slider range does not
    // include the year of the selected game, reset components
    const selectedGame = data.find(
      (d) => d.id === scatterPlot1.config.selectedGameId,
    );
    if (selectedGame) {
      const selectedGameYear = selectedGame.Year_of_Release;
      const sliderRange = slider.noUiSlider.get().map((i) => +i);

      if (selectedGameYear < sliderRange[0] || selectedGameYear > sliderRange[1]) {
        searchBar.value = '';
        updateScatterPlots(-1);
        updateStats(data[0].id);
      } else {
        updateScatterPlots();
      }
    } else {
      updateScatterPlots();
    }
  });

  dispatcher.on('onPointClick', (selectedGameId) => {
    const selectedGame = data.find((d) => d.id === selectedGameId);

    // update search bar value
    document.getElementById('search-bar').value = selectedGame.Name; // does not trigger input event

    // update slider
    slider.noUiSlider.set([selectedGame.Year_of_Release, selectedGame.Year_of_Release]);

    // TODO: update bubblechart

    // update vis & stats
    updateScatterPlots(selectedGameId); // slide instead of update to function call w/ arg
    updateStats(selectedGameId);
  });
});
