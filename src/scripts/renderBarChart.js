import * as d3 from 'd3';
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

  // Add legend
  addDonutLabels(donutContainer, categories);

  // Render donut
  updateDonutChart(getCurrentDonutData(0, categories), donutContainer, pie, donutConfig.colors, arc, categories);
  updateDonutChart(getCurrentDonutData(0, categories), donutContainer, pie, donutConfig.colors, arc, categories);

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

function updateDonutChart(data, donutContainer, pie, color, arc, categories) {
  const slice = donutContainer
    .select('.slices')
    .selectAll('path.slice')
    .data(pie(data))
    .on('click', function(d, i) {
      // console.log(data[i]);
      // console.log(i);
      // console.log(categories);

      console.log(data[i].name);

      // https://stackoverflow.com/a/48928273
      const categoriesWithClickMaterial = categories.filter(function(element) {
        return element.materials.some(function(subElement) {
          return subElement.name === data[i].name;
        });
      });

      // const a = categories.filter(j => {
      //   return j.materials.name == data[i].name;
      // });

      console.log(categoriesWithClickMaterial);

      console.log();

      d3.selectAll('.bar')
        // .exit()
        // .remove()
        // .data(categoriesWithClickMaterial)
        // .enter()
        .attr('width', d => 50);

      // updateBar(categoriesWithClickMaterial);
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

const addBarsToBarChart = (xScale, svg, categories, barheight, barSpacing, donutContainer, pie, key, color, arc) => {
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
    .on('mouseenter', function(d, i) {
      d3.selectAll('.bar').classed('active', false);
      d3.select(this).classed('active', true);
      updateDonutChart(getCurrentDonutData(i, categories), donutContainer, pie, key, color, arc, categories);
    });

  addActiveClassToBar(0); // add active class to first item
};
