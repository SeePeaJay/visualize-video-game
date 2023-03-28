/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/Video_Games_Sales_as_at_22_Dec_2016.csv').then((_data) => {
  /* Convert columns to numerical values */
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
    return !values.some((value) => value === '') && d.Year_of_Release >= 2012;
  });

  console.log(data);
});
