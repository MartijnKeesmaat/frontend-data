import * as d3 from 'd3';
import { shadeColor, capitalize } from './helpers';
import { positionDonutChart, getArc, getPies, addSlicesToDonutContrainer, createDonutContainer, addDonutLabels } from './donut-functions';
import { addGridlinesToBarChart, addActiveClassToBar, addXAxisToBarChart, addXScaleBarChart, addLabelsToBarChart, addGlobalSVGBarChart } from './bar-functions';

export default function renderBarChart(categories, width, height) {
  const donutConfig = {
    width: 280,
    height: 280,
    outerRing: 0.8,
    innerRing: 0.58,
    colors: ['#98abc5', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#fba16c', '#6780a2']
  };

  // Donut setup
  const donutContainer = createDonutContainer(480, 280);
  addSlicesToDonutContrainer(donutContainer);
  const radius = Math.min(donutConfig.width, donutConfig.height) / 2;
  const pie = getPies();
  const arc = getArc(radius, donutConfig.outerRing, donutConfig.innerRing);
  positionDonutChart(donutContainer);
  addDefaultText(categories, donutConfig.width, donutConfig.height);
  d3.select('.donut-chart h2').text(capitalize(categories[0].name));

  // Add legend
  addDonutLabels(donutContainer, categories, donutConfig.colors);

  // Add Bar Chart config
  const barConfig = {
    height: 15,
    spacing: 47,
    labelWidth: 100
  };

  // Bar chart set up
  const svg = addGlobalSVGBarChart(width, height);
  const xScale = addXScaleBarChart(width, barConfig.spacing, categories);
  addLabelsToBarChart(svg, categories, barConfig.labelWidth, barConfig.spacing);
  addXAxisToBarChart(svg, height, barConfig.spacing, xScale);
  addGridlinesToBarChart(svg, width, height, xScale);

  // Render donut
  updateDonutChart(getCurrentDonutData(0, categories), donutContainer, pie, donutConfig.colors, arc, categories, xScale);
  updateDonutChart(getCurrentDonutData(0, categories), donutContainer, pie, donutConfig.colors, arc, categories, xScale);

  // also stores event for donut chart
  addBarsToBarChart(xScale, svg, categories, barConfig.height, barConfig.spacing, donutContainer, pie, donutConfig.colors, arc);
  brusherBars(categories, xScale);
}

// TODO Move to separate file
function getCurrentDonutData(index, categories) {
  return categories[index].materials.map(function(label, i) {
    return {
      label: label,
      value: categories[index].materials[i].value,
      name: categories[index].materials[i].name
    };
  });
}

// TODO Move to separate file
let index = 0;
function getSelectedBar() {
  d3.selectAll('.bar').on('mouseover', function(d, i) {
    index = i;
  });
  return index;
}

// TODO Move to separate file
// TODO Divide and concur
function handleDonutHover(d, i, categories, data, xScale) {
  // returns an arry with true or false if it contains the clicked material
  const categoriesWithClickedMaterial = categories.map(el => {
    return el.materials.some(function(subElement) {
      return subElement.name === data[i].name ? el : false;
    });
  });

  highlighCurrentLegendLabel(i);
  d3.select('.bar-chart h1').text(capitalize(data[i].name));
  d3.select('.bar-chart p').text('Welke categorieën hebben dit material?');
  d3.selectAll('.bar').attr('width', (d, j) => {
    // check if there if the value exists then get that value with filter
    const hasMaterial = categoriesWithClickedMaterial[j];
    const material = categories[j].materials.filter(el => el.name === data[i].name);
    return hasMaterial ? xScale(material[0].value) : 0;
  });
}

// TODO Move to separate file
function highlighCurrentLegendLabel(selected) {
  d3.selectAll('.legend-label').style('fill-opacity', '0.2');
  const currentLabel = d3.selectAll('.legend-label').filter((d, i) => i === selected);
  currentLabel.style('fill-opacity', '1');
}

// TODO Move to separate file
function resetCurrentLegendLabel() {
  d3.selectAll('.legend-label').style('fill-opacity', '1');
}

// TODO Move to separate file
function updateBarMetaData() {
  d3.select('.bar-chart h1').text('Hoofdcategorieën');
  d3.select('.bar-chart p').text('Ga met je muis over een categorie om te updaten');
}

// TODO Move to separate file
function handleDonutLeave(categories, xScale) {
  resetCurrentLegendLabel();
  updateBarMetaData();
  d3.selectAll('.bar').attr('width', (d, j) => {
    return xScale(categories[j].value);
  });
}

// TODO Divide and concur
function updateDonutChart(data, donutContainer, pie, color, arc, categories, xScale) {
  const slice = donutContainer
    .select('.slices')
    .selectAll('path.slice')
    .data(pie(data))

    .on('mouseover', function(d, i) {
      handleDonutHover(d, i, categories, data, xScale);
      d3.select('.donut-title').text(d.data.value);
      d3.selectAll('.bar').attr('fill', color[i]);
      d3.select(this)
        .style('cursor', 'pointer')
        .style('fill', shadeColor(color[i], -20));
    })

    .on('mouseout', function(d, i) {
      d3.selectAll('.bar').attr('fill', '#edf0f4');
      d3.select('.donut-title').text(d.data.value);
      addActiveClassToBar(getSelectedBar(), '#fba16c');
      d3.select('.donut-title').text(categories[getSelectedBar()].value);
      handleDonutLeave(categories, xScale);
      d3.select(this)
        .style('cursor', 'none')
        .style('fill', color[i]);
    })

    .each(function(d, i) {
      this._current = i;
    });

  slice
    .enter()
    .insert('path')
    .style('fill', (d, i) => color[i])
    .attr('class', 'slice');

  slice
    .transition()
    .duration(500)
    .attrTween('d', function(d) {
      this._current = this._current || d;
      var interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function(t) {
        return arc(interpolate(t));
      };
    });

  slice.exit().remove();
}

// TODO Divide and concur
const addBarsToBarChart = (xScale, svg, categories, barheight, barSpacing, donutContainer, pie, colors, arc) => {
  svg
    .append('g')
    .attr('class', 'bar-group')
    .selectAll('rect')
    .exit()
    .remove()
    .data(categories)
    .enter()
    .append('rect')
    .attr('x', (d, i) => 97)
    .attr('y', (d, i) => i * barSpacing)
    .attr('width', d => xScale(d.value))
    .attr('height', barheight)
    .attr('class', 'bar')
    .attr('fill', '#edf0f4')
    .on('mouseenter', function(d, i) {
      d3.selectAll('.bar').attr('fill', '#edf0f4');
      d3.selectAll('.d-bar').attr('fill', '#edf0f4');

      d3.select(this).attr('fill', '#fba16c');
      d3.selectAll('.d-bar')
        .filter((d, j) => j === i)
        .attr('fill', '#fba16c');

      d3.select('.donut-chart h2').text(capitalize(categories[i].name));
      d3.select('.donut-title').text(d.value);

      d3.selectAll('.legend-label').text((d, j) => capitalize(categories[i].materials[j].name));

      updateDonutChart(getCurrentDonutData(i, categories), donutContainer, pie, colors, arc, categories, xScale);
    });

  // TODO add colorname as value
  addActiveClassToBar(0, '#fba16c'); // add active class to first item
};

// TODO move to seperate file
// TODO make these variables global
function addDefaultText(categories, width, height) {
  const donutDimensions = 280;
  const containerHeight = 280;
  const xOffset = 50;
  const yOffset = 20;
  const margin = 18;

  const defaultText = d3
    .select('.pie')
    .append('g')
    .attr('class', 'default-text');

  defaultText
    .append('text')
    .attr('class', 'donut-title')
    .text(categories[0].value)
    .attr('text-anchor', 'middle')
    .attr('dx', donutDimensions + xOffset)
    .attr('dy', containerHeight / 2 + yOffset);

  defaultText
    .append('text')
    .attr('class', 'donut-sub-title')
    .text('Objecten')
    .attr('text-anchor', 'middle')
    .attr('dx', donutDimensions + xOffset)
    .attr('dy', containerHeight / 2 + margin + yOffset);
}

function brusher() {
  const brush = document.querySelector('#brusher');
  const h = 855 - 280; // height inner-container - height svg

  brush.oninput = function() {
    d3.select('g.bar-group').attr('transform', 'translate(0,' + -this.value * (h / 10) + ')');
    d3.select('.bar-text').attr('transform', 'translate(0,' + -this.value * (h / 10) + ')');
  };
}

function brusherBars(categories) {
  const svgH = 300;
  const barH = 6;
  const xScale = addXScaleBarChart(92, 15, categories);

  const container = d3
    .select('.d-bars')
    .append('svg')
    .attr('transform', 'translate(0,' + -10 + ')');
  container
    .selectAll('rect')
    .data(categories)
    .enter()
    .append('rect')
    .attr('class', 'd-bar')
    .attr('x', (d, i) => 0)
    .attr('y', (d, i) => (i * (svgH + 40)) / 19)
    .attr('width', d => xScale(d.value))
    .attr('height', d => barH)
    .attr('fill', '#edf0f4');

  d3.selectAll('.d-bar')
    .filter((d, i) => i === 0)
    .attr('fill', '#fba16c');
}

brusher();
