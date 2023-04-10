/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/Video_Games_Sales_as_at_22_Dec_2016.csv').then((_data) => {
  /* data preprocessing */
  for (let i = 0; i < _data.length; i++) {
    _data[i].id = i + 1;
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
    null,
    data,
  );
  const scatterPlot2 = new ScatterPlot(
    {
      parentElement: '#scatter-vis', title: 'Correlation b/w Diffs in Scores & Global Sales', xAxisTitle: 'Global Sales (millions)', yAxisTitle: 'Critic - User Score',
    },
    null,
    data,
  );
  const pieChart = new PieChart(
    { parentElement: '#pie-vis' },
    null,
    data[0],
  );

  /* initialize stats text */
  d3.select('#stats-text')
    .style('display', 'block')
    .html(`<strong>${data[0].Name}</strong><ul><li>Year of release: ${data[0].Year_of_Release}</li><li>Genre: ${data[0].Genre}</li><li>Rating: ${data[0].Rating}</li><li>Developer: ${data[0].Developer}</li><li>Publisher: ${data[0].Publisher}</li><li>Critic Score: ${data[0].Critic_Score}</li><li>Critic Count: ${data[0].Critic_Count}</li><li>User Score: ${data[0].User_Score}</li><li>User Count: ${data[0].User_Count}</li></ul>`);

  const updateScatterPlots = () => {
    const sliderRange = slider.noUiSlider.get().map((i) => +i);

    scatterPlot1.data = data.filter(
      (d) => d.Year_of_Release >= sliderRange[0] && d.Year_of_Release <= sliderRange[1],
    );
    scatterPlot2.data = data.filter(
      (d) => d.Year_of_Release >= sliderRange[0] && d.Year_of_Release <= sliderRange[1],
    );
    scatterPlot1.updateVis();
    scatterPlot2.updateVis();
  };

  /* handle search bar interaction */
  d3.select('#search-bar').on('input', (event) => {
    const searchBarValue = d3.select('#search-bar').node().value;

    if (gameNames.includes(searchBarValue)) {
      const selectedGameData = data.find((d) => d.Name === searchBarValue);
      const selectedGameYear = selectedGameData.Year_of_Release;

      // update slider
      slider.noUiSlider.set([selectedGameYear, selectedGameYear]);

      // TODO: update bubble chart

      // TODO: update scatter plots (need to filter by genre too)
      updateScatterPlots();

      // update stats text
      d3.select('#stats-text')
        .style('display', 'block')
        .html(`<strong>${selectedGameData.Name}</strong><ul><li>Year of release: ${selectedGameYear}</li><li>Genre: ${selectedGameData.Genre}</li><li>Rating: ${selectedGameData.Rating}</li><li>Developer: ${selectedGameData.Developer}</li><li>Publisher: ${selectedGameData.Publisher}</li><li>Critic Score: ${selectedGameData.Critic_Score}</li><li>Critic Count: ${selectedGameData.Critic_Count}</li><li>User Score: ${selectedGameData.User_Score}</li><li>User Count: ${selectedGameData.User_Count}</li></ul>`);

      // update pie chart
      pieChart.data = selectedGameData;
      pieChart.updateVis();
    }
  });

  /* handle slider interaction */
  slider.noUiSlider.on('slide', () => {
    updateScatterPlots();
  });
});
