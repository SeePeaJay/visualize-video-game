/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/Video_Games_Sales_as_at_22_Dec_2016.csv').then((_data) => {
  /* data preprocessing */
  for (let i = 0; i < _data.length; i++) {
    _data[i].id = i + 1;

    Object.keys(_data[i]).forEach((attr) => {
      if (attr !== 'Name' && attr !== 'Platform' && attr !== 'Genre' && attr !== 'Publisher' && attr !== 'Developer' && attr !== 'Rating') {
        _data[i][attr] = +_data[i][attr];
      }

      if (attr === 'User_Score') {
        _data[i][attr] *= 10;
      }
    });
  }
  const data = _data.filter((d) => {
    const values = Object.values(d);
    return !values.some((value) => value === '' || Number.isNaN(value)) && d.Year_of_Release >= 2012;
  });

  // populate search bar options
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

  // initialize vis
  const pieChart = new PieChart(
    { parentElement: '#pie-vis' },
    null,
    data[0],
  );

  // initialize stats text
  d3.select('#stats-text')
    .style('display', 'block')
    .html(`<strong>${data[0].Name}</strong><ul><li>Year of release: ${data[0].Year_of_Release}</li><li>Genre: ${data[0].Genre}<li>Developer: ${data[0].Developer}</li><li>Publisher: ${data[0].Publisher}</li><li>Critic Score: ${data[0].Critic_Score}</li><li>User Score: ${data[0].User_Score}</li><li>Rating: ${data[0].Rating}</li></ul>`);

  // TODO: handle input dropdown and selection
  d3.select('#search-bar').on('input', (event) => {
    const searchBarValue = d3.select('#search-bar').node().value;

    if (gameNames.includes(searchBarValue)) {
      const matchingData = data.find((d) => d.Name === searchBarValue);

      // TODO: update slider

      // TODO: update bubble chart

      // TODO: update scatter plots

      // TODO: update stats text
      d3.select('#stats-text')
        .style('display', 'block')
        .html(`<strong>${matchingData.Name}</strong><ul><li>Year of release: ${matchingData.Year_of_Release}</li><li>Genre: ${matchingData.Genre}<li>Developer: ${matchingData.Developer}</li><li>Publisher: ${matchingData.Publisher}</li><li>Critic Score: ${matchingData.Critic_Score}</li><li>User Score: ${matchingData.User_Score}</li><li>Rating: ${matchingData.Rating}</li></ul>`);

      // update pie chart
      pieChart.data = matchingData;
      pieChart.updateVis();
      // console.log(matchingData.Name, pieChart.salesData);
    }
  });
});
