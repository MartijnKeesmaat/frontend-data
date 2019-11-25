import * as d3 from 'd3';
import { wrap, capitalize } from './helpers';

export const addLabelsToBarChart = (svg, categories, labelWidth, barSpacing) => {
  svg
    .selectAll('text')
    .data(categories)
    .enter()
    .append('text')
    .text(d => capitalize(d.name))
    .attr('x', (d, i) => 0)
    .attr('y', (d, i) => i * barSpacing + 10)
    .attr('class', 'label')
    .attr('dy', 0)
    .attr('text-anchor', 'end')
    .attr('transform', 'translate(90,' + 0 + ')')
    .call(wrap, labelWidth);
};

export const addXScaleBarChart = (width, barSpacing, categories) => {
  return d3
    .scaleLinear()
    .domain([0, d3.max(categories, d => d.value)])
    .range([barSpacing, width - barSpacing]);
};

export const addXAxisToBarChart = (svg, height, barSpacing, xScale) => {
  const xAxis = d3.axisBottom(xScale).ticks(4);
  svg
    .append('g')
    .attr('transform', 'translate(50,' + 260 + ')')
    .attr('color', '#9AA1A9')
    .attr('class', 'x-axis')
    .call(xAxis)
    .call(g => g.select('.domain').remove());
};

export const addGridlinesToBarChart = (svg, width, height, xScale) => {
  const x = xScale;

  svg
    .append('g')
    .attr('class', 'grid')
    .attr('transform', 'translate(50,' + (height - 20) + ')')
    .attr('stroke', '#E9EBF1')
    .call(
      makeXGridlines(x)
        .tickSize(-height)
        .tickFormat('')
    );
};

// https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
const makeXGridlines = x => d3.axisBottom(x).ticks(4);

export const addGlobalSVGBarChart = (width, height) => {
  return d3
    .select('.bar-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
};

// stackoverflow.com/questions/28390754/get-one-element-from-d3js-selection-by-index
export function addActiveClassToBar(index) {
  d3.selectAll('.bar')
    .filter((d, i) => i === index)
    .attr('fill', '#6a2c70');
}
