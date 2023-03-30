const slider = document.getElementById('slider');

noUiSlider.create(slider, {
  start: [2012, 2016],
  connect: true,
  range: {
    min: 2012,
    max: 2016,
  },
  step: 1,
  tooltips: [
    { to: (value) => Math.round(value) },
    { to: (value) => Math.round(value) },
  ],
});
