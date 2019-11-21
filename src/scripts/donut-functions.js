import * as d3 from 'd3';
import { capitalize } from './helpers';

// TODO this number should equal donut width + border
export function positionDonutChart(donutContainer) {
  donutContainer.attr('transform', 'translate(' + 300 + ',' + 200 + ')');
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
    .attr('class', 'pie')
    .append('g');
}

export function addDonutLabels(donutContainer, categories, colors) {
  const legend = d3
    .select('.pie')
    .append('g')
    .attr('class', 'legend');

  legend
    .selectAll('text')
    .data(categories[1].materials)
    .enter()
    .append('text')
    .text(d => capitalize(d.name))
    .attr('x', (d, i) => 14)
    .attr('y', (d, i) => 140 + 50 * (i / 1.7))
    .attr('class', 'legend-label');

  legend
    .selectAll('circle')
    .data(categories[1].materials)
    .enter()
    .append('circle')
    .attr('r', 4)
    .attr('cx', (d, i) => 4)
    .attr('cy', (d, i) => 140 + 50 * (i / 1.7) - 4)
    .attr('class', 'legend-color')
    .attr('fill', (d, i) => colors[i]);

  // const labels = donutContainer.append('g').attr('class', 'labels');

  // labels
  //   .selectAll('text')
  //   .data(categories[0].materials)
  //   .enter()
  //   .append('text')
  //   .text(d => d.name)
  //   .attr('x', (d, i) => 170)
  //   .attr('y', (d, i) => i * 20 + 50)
  //   .attr('class', 'legend-label');
}
