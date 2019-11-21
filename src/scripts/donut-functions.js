import * as d3 from 'd3';

// TODO this number should equal donut width + border
export function positionDonutChart(donutContainer) {
  donutContainer.attr('transform', 'translate(' + 200 + ',' + 200 + ')');
}

export function getArc(radius, outerRing, innerRing) {
  return d3
    .arc()
    .outerRadius(radius * outerRing)
    .innerRadius(radius * innerRing);
}

export function getPies() {
  return d3
    .pie()
    .sort(null)
    .value(function(d) {
      return d.value;
    });
}

// TODO move these donut function to the external file
export function addSlicesToDonutContrainer(donutContainer) {
  donutContainer.append('g').attr('class', 'slices');
}

export function createDonutContainer(width, height) {
  return d3
    .select('.donut-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g');
}

export function addDonutLabels(donutContainer, categories) {
  const labels = donutContainer.append('g').attr('class', 'labels');

  labels
    .selectAll('text')
    .data(categories[1].materials)
    .enter()
    .append('text')
    .text(d => d.name)
    .attr('x', (d, i) => 0)
    .attr('y', (d, i) => i * 20)
    .attr('class', 'legend-label');
}
