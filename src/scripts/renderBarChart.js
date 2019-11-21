import * as d3 from 'd3';
import { truncator, shadeColor, capitalize } from './helpers';
import { positionDonutChart, getArc, getPies, addSlicesToDonutContrainer, createDonutContainer, addDonutLabels } from './donut-functions';
import { addGridlinesToBarChart, addActiveClassToBar, addXAxisToBarChart, addXScaleBarChart, addLabelsToBarChart, addGlobalSVGBarChart } from './bar-functions';

export default function renderBarChart(categories, width, height) {
  const donutConfig = {
    width: 500,
    height: 400,
    outerRing: 0.8,
    innerRing: 0.6,
    colors: ['#98abc5', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00', '#6780a2']
  };

  // Donut setup
  const donutContainer = createDonutContainer(donutConfig.width, donutConfig.height);
  addSlicesToDonutContrainer(donutContainer);
  const radius = Math.min(donutConfig.width, donutConfig.height) / 2;
  const pie = getPies();
  const arc = getArc(radius, donutConfig.outerRing, donutConfig.innerRing);
  positionDonutChart(donutContainer);
  addDefaultText(categories, donutConfig.width, donutConfig.height);

  // Add legend
  addDonutLabels(donutContainer, categories, donutConfig.colors);

  // Add Bar Chart config
  const barConfig = {
    height: 15,
    spacing: 50,
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
}

function getCurrentDonutData(index, categories) {
  return categories[index].materials.map(function(label, i) {
    return {
      label: label,
      value: categories[index].materials[i].value,
      name: categories[index].materials[i].name
    };
  });
}

function handleDonutClick(d, i, categories, data, xScale) {
  // returns an arry with true or false if it contains the clicked material
  const categoriesWithClickedMaterial = categories.map(el => {
    return el.materials.some(function(subElement) {
      return subElement.name === data[i].name ? el : false;
    });
  });

  d3.select('.bar-chart h1').text(data[i].name);
  d3.selectAll('.bar').attr('width', (d, j) => {
    return categoriesWithClickedMaterial[j] ? xScale(data[i].value) : 0;
  });
}

function handleDonutLeave(categories, xScale) {
  d3.select('.bar-chart h1').text('Alle objecten');
  d3.selectAll('.bar').attr('width', (d, j) => {
    return xScale(categories[j].value);
  });
}

function updateDonutChart(data, donutContainer, pie, color, arc, categories, xScale) {
  const slice = donutContainer
    .select('.slices')
    .selectAll('path.slice')
    .data(pie(data))
    .on('mouseover', function(d, i) {
      handleDonutClick(d, i, categories, data, xScale);
      d3.select('.donut-title').text(truncator(d.data.name, 1));
      d3.select('.donut-sub-title').text(d.data.value, 1);
      d3.select(this)
        .style('cursor', 'pointer')
        .style('fill', shadeColor(color[i], -20));
    })
    .on('mouseout', function(d, i) {
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

const addBarsToBarChart = (xScale, svg, categories, barheight, barSpacing, donutContainer, pie, colors, arc) => {
  svg
    .selectAll('rect')
    .exit()
    .remove()
    .data(categories)
    .enter()
    .append('rect')
    .attr('x', (d, i) => 100)
    .attr('y', (d, i) => i * barSpacing)
    .attr('width', d => xScale(d.value))
    .attr('height', barheight)
    .attr('class', 'bar')
    .attr('fill', '#edf0f4')
    .on('mouseenter', function(d, i) {
      d3.selectAll('.bar').attr('fill', '#edf0f4');
      d3.select(this).attr('fill', '#6a2c70');
      d3.select('.donut-chart h1').text(capitalize(categories[i].name));
      updateDonutChart(getCurrentDonutData(i, categories), donutContainer, pie, colors, arc, categories, xScale);
    });

  addActiveClassToBar(0); // add active class to first item
};

// https://stackoverflow.com/a/48928273
const getCategoriesWithClickMaterial = (categories, data, i) =>
  categories.filter(function(element) {
    return element.materials.some(function(subElement) {
      return subElement.name === data[i].name;
    });
  });

function addDefaultText(categories, width, height) {
  const defaultText = d3
    .select('.pie')
    .append('g')
    .attr('class', 'default-text');

  defaultText
    .append('text')
    .attr('class', 'donut-title')
    .text(truncator(categories[1].name, 1))
    .attr('text-anchor', 'middle')
    .attr('dx', width / 2 + 50)
    .attr('dy', height / 2);

  defaultText
    .append('text')
    .attr('class', 'donut-sub-title')
    .text('Categorie')
    .attr('text-anchor', 'middle')
    .attr('dx', width / 2 + 50)
    .attr('dy', height / 2 + 20);
}
