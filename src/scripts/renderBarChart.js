import * as d3 from "d3";
import { wrap, capitalize } from "./helpers";

export default function renderBarChart(categories, width, height) {
  const donutConfig = {
    width: 500,
    height: 400,
    outerRing: 0.8,
    innerRing: 0.6,
    colors: ["#98abc5", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]
  }

  // Donut setup
  const donutContainer = createDonutContainer(donutConfig.width, donutConfig.height);
  addSlicesToDonutContrainer(donutContainer);
  const radius = Math.min(donutConfig.width, donutConfig.height) / 2
  const pie = getPies()
  const arc = getArc(radius, donutConfig.outerRing, donutConfig.innerRing);
  positionDonutChart(donutContainer);

  // Add legend 
  addDonutLabels(donutContainer, categories)

  // Render donut
  updateDonutChart(getCurrentDonutData(0, categories), donutContainer, pie, donutConfig.colors, arc);
  updateDonutChart(getCurrentDonutData(0, categories), donutContainer, pie, donutConfig.colors, arc);


  // Add Bar Chart config
  const barConfig = {
    height: 15,
    spacing: 50,
    labelWidth: 100
  }

  // Bar chart set up
  const svg = addGlobalSVGBarChart(width, height);
  const xScale = addXScaleBarChart(width, barConfig.spacing, categories);
  addLabelsToBarChart(svg, categories, barConfig.labelWidth, barConfig.spacing);
  addXAxisToBarChart(svg, height, barConfig.spacing, xScale);
  addGridlinesToBarChart(svg, width, height, xScale)

  // also stores event for donut chart
  addBarsToBarChart(xScale, svg, categories, barConfig.height, barConfig.spacing, donutContainer, pie, donutConfig.colors, arc);
}


function getCurrentDonutData(index, categories) {
  return categories[index].materials.map(function (label, i) {
    return {
      label: label,
      value: categories[index].materials[i].value,
      name: categories[index].materials[i].name
    }
  });
}

function updateDonutChart(data, donutContainer, pie, color, arc) {

  const slice = donutContainer.select(".slices")
    .selectAll("path.slice")
    .data(pie(data));

  slice.enter()
    .insert("path")
    .style("fill", (d, i) => color[i])
    .attr("class", "slice");

  slice
    .transition().duration(500)
    .attrTween("d", function (d) {
      this._current = this._current || d;
      var interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function (t) {
        return arc(interpolate(t));
      };
    })

  slice.exit()
    .remove();
};


const addGlobalSVGBarChart = (width, height) => {
  return d3
    .select(".bar-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
}

const addBarsToBarChart = (xScale, svg, categories, barheight, barSpacing, donutContainer, pie, key, color, arc) => {

  svg
    .selectAll("rect")
    .data(categories)
    .enter()
    .append("rect")
    .attr("x", (d, i) => 100)
    .attr("y", (d, i) => i * barSpacing)
    .attr("width", d => xScale(d.value))
    .attr("height", barheight)
    .attr("class", "bar")
    .on('mouseenter', function (d, i) {
      d3.selectAll('.bar').classed("active", false);
      d3.select(this).classed("active", true);
      updateDonutChart(getCurrentDonutData(i, categories), donutContainer, pie, key, color, arc);
    });

  addActiveClassToBar(0); // add active class to first item
}

const addLabelsToBarChart = (svg, categories, labelWidth, barSpacing) => {
  svg
    .selectAll("text")
    .data(categories)
    .enter()
    .append("text")
    .text(d => capitalize(d.name))
    .attr("x", (d, i) => 0)
    .attr("y", (d, i) => (i * barSpacing) + 10)
    .attr("class", "label")
    .attr("dy", 0)
    .attr("text-anchor", "end")
    .attr("transform", "translate(90," + 0 + ")")
    .call(wrap, labelWidth);
}

const addXScaleBarChart = (width, barSpacing, categories) => {
  return d3
    .scaleLinear()
    .domain([0, d3.max(categories, d => d.value)])
    .range([barSpacing, width - barSpacing]);
}

const addXAxisToBarChart = (svg, height, barSpacing, xScale) => {
  const xAxis = d3.axisBottom(xScale).ticks(4);
  svg.append("g")
    .attr("transform", "translate(50," + (height - barSpacing) + ")")
    .attr("color", '#9AA1A9')
    .attr("class", "x-axis")
    .call(xAxis)
    .call(g => g.select(".domain").remove())
}

const addGridlinesToBarChart = (svg, width, height, xScale) => {
  const x = xScale;

  svg.append("g")
    .attr("class", "grid")
    .attr("transform", "translate(50," + (height - 45) + ")")
    .attr("stroke", "#E9EBF1")
    .call(makeXGridlines(x)
      .tickSize(-height)
      .tickFormat("")
    )
}

// https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
const makeXGridlines = x => d3.axisBottom(x).ticks(4)


function addDonutLabels(donutContainer, categories) {
  const labels = donutContainer.append("g")
    .attr("class", "labels");

  labels
    .selectAll("text")
    .data(categories[1].materials)
    .enter()
    .append("text")
    .text(d => d.name)
    .attr("x", (d, i) => 0)
    .attr("y", (d, i) => i * 20)
    .attr("class", "legend-label")
}

function createDonutContainer(width, height) {
  return d3.select(".donut-chart")
    .append("svg")
    .attr('width', width)
    .attr('height', height)
    .append("g")
}

// TODO move these donut function to the external file
function addSlicesToDonutContrainer(donutContainer) {
  donutContainer.append("g")
    .attr("class", "slices");
}

function getPies() {
  return d3.pie()
    .sort(null)
    .value(function (d) {
      return d.value;
    });
}

function getArc(radius, outerRing, innerRing) {
  return d3.arc()
    .outerRadius(radius * outerRing)
    .innerRadius(radius * innerRing);
}

// TODO this number should equal donut width + border
function positionDonutChart(donutContainer) {
  donutContainer.attr("transform", "translate(" + 200 + "," + 200 + ")");
}

// stackoverflow.com/questions/28390754/get-one-element-from-d3js-selection-by-index
function addActiveClassToBar(index) {
  d3.selectAll('.bar').filter((d, i) => i === index).classed('active', true);
}