import * as d3 from "d3";
import { truncator, shadeColor, capitalize } from './helpers';

export default function renderDonutChart(categories, size, thickness) {

  // Setup
  const width = size, height = size;
  const radius = Math.min(width, height) / 2;
  const colorPalette = addColorPalette();

  // Create donut
  const svg = addGlobalSvg(width + 180, height + 30)
  const arc = addArc(thickness, radius);
  const g = rotateArc(svg, width, height);
  const pie = addPieRadius();
  let path = createArcPaths(g, pie, categories);
  addLegend(categories, colorPalette);

  // Interactions
  showCategoryText(path);
  resetDonutText(path, categories);
  path = addFillToDonut(path, arc, colorPalette);
  addArcHover(path, colorPalette);
  addDefaultText(categories, width, height);
}


// CREATE DONUT
const addColorPalette = () => {
  const colorArr = ['#B83B5E', '#995A3A', '#F08A5D', '#F9D769', '#6A2C70'];
  return d3.scaleOrdinal(colorArr);
}

const addGlobalSvg = (width, height) => {
  return d3.select(".donut-chart")
    .append('svg')
    .attr('class', 'pie')
    .attr('width', width)
    .attr('height', height)
}

const addArc = (thickness, radius) => {
  return d3.arc()
    .innerRadius(radius - thickness)
    .outerRadius(radius);
}

const rotateArc = (svg, width, height) => {
  return svg.append('g')
    .attr('transform', 'translate(' + ((width / 2) + 180) + ',' + ((height / 2)) + ')');
}

const addPieRadius = () => {
  // transform the value of each group to a radius that will be displayed on the chart.
  return d3.pie()
    .value(function (d) { return d.value; })
    .sort(null);
}

const createArcPaths = (g, pie, categories) => {
  return g.selectAll('path')
    .data(pie(categories[1].materials))
    .enter()
    .append("g")
}

function addDefaultText(categories, width, height) {
  const defaultText = d3
    .select('.pie')
    .append("g")
    .attr('class', 'default-text');

  defaultText.append("text")
    .attr("class", "donut-title")
    .text(truncator(categories[1].name, 1))
    .attr('text-anchor', 'middle')
    .attr('dx', width / 2 + 180)
    .attr('dy', height / 2)

  defaultText.append("text")
    .attr("class", "donut-sub-title")
    .text('Categorie')
    .attr('text-anchor', 'middle')
    .attr('dx', width / 2 + 180)
    .attr('dy', height / 2 + 20)
}

const addLegend = (categories, colorPalette) => {
  const legend = d3
    .select('.pie')
    .append("g")
    .attr('class', 'legend');

  legend
    .selectAll("text")
    .data(categories[1].materials)
    .enter()
    .append("text")
    .text(d => capitalize(d.name))
    .attr("x", (d, i) => 14)
    .attr("y", (d, i) => 140 + (50 * (i / 1.7)))
    .attr("class", "legend-label")

  legend
    .selectAll("circle")
    .data(categories[1].materials)
    .enter()
    .append("circle")
    .attr("r", 4)
    .attr("cx", (d, i) => 4)
    .attr("cy", (d, i) => 140 + (50 * (i / 1.7)) - 4)
    .attr("class", "legend-color")
    .attr('fill', (d, i) => colorPalette(i))
}

// INTERACTIONS
const showCategoryText = el => {
  el.on("mouseover", function (d) {
    d3.select('.donut-title').text(truncator(d.data.name, 1));
    d3.select('.donut-sub-title').text(`${d.data.value} objecten`);
  })
}

const resetDonutText = (el, categories) => {
  el.on("mouseout", function () {
    d3.select('.donut-title').text(truncator(categories[1].name, 1));
    d3.select('.donut-sub-title').text('Categorie');
  })
}

const addFillToDonut = (path, arc, colorPalette) => {
  return path.append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => colorPalette(i))
}

const addArcHover = (path, colorPalette) => {
  path
    .on("mouseover", function (d) {
      d3.select(this)
        .style("cursor", "pointer")
        .style("fill", shadeColor(colorPalette(this._current), -20));
    })

  path
    .on("mouseout", function (d) {
      d3.select(this)
        .style("cursor", "none")
        .style("fill", colorPalette(this._current));
    })
    .each(function (d, i) { this._current = i; });
}
