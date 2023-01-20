let x, y, line, data, target
let cpu, disk, ram
let ops, graphtime, vrange
let resolvefn

/* This Rather Ugly code simulates watching the database run in a monitoring tool */

/* global d3 */
const slideTime = 50

function tickv () {
  console.log('Tickv')

  if (graphtime % 50 === 0) {
    setLabel('cpu', Math.round(cpu + (Math.random() * 2) - 1))
    setLabel('ram', ram)
    setLabel('disk', Math.floor(disk + (Math.random() * 1) - 0.5))
    setLabel('ops', Math.floor(ops * (0.98 + Math.random() * 0.02)))
    setLabel('target', target)
  }

  data.push(ops * (0.95 + Math.random() * 0.1))

  data.shift()

  d3.select(this)
    .attr('d', line)
    .attr('transform', null)

  graphtime--
  if (graphtime > 0) {
    d3.active(this)
      .attr('transform', 'translate(' + x(0) + ',0)')
      .transition()
      .on('start', tickv)
  } else {
    console.log(data)
  }
}

function setLabel (label, value) {
  document.getElementById(label).innerText = value
}
// eslint-disable-next-line no-unused-vars
function simulateOp (opdesc, resolve) {
  console.log(opdesc)
  target = opdesc.target
  cpu = opdesc.cpu
  ram = opdesc.ram
  disk = opdesc.iops
  vrange = opdesc.vrange
  resolvefn = resolve
  graphtime = 400
  ops = opdesc.performance
  console.log(`Ops per second at ${opdesc.performance} ticks per op is is ${ops}`)

  testSim()
}

// eslint-disable-next-line no-unused-vars
function closeSim () {
  graphtime = 0 /* Stop animations */
  data = []
  document.getElementById('dialogbackground').style.display = 'none'
  const simElement = document.getElementById('simulator')
  simElement.style.display = 'none'
  resolvefn()
}

function testSim () {
  document.getElementById('dialogbackground').style.display = 'inline'
  const simElement = document.getElementById('simulator')
  simElement.style.display = 'inline'
  const n = 100
  const simChartElement = document.getElementById('simchart')
  const simChart = d3.select('#simchart')

  // eslint-disable-next-line no-undef
  data = d3.range(n).map(() => 0)
  d3.selectAll('svg > *').remove() // Clear the chart
  // Add a graphics context in the SVG with a margin
  const margin = { top: 20, right: 10, bottom: 10, left: 10 }
  const width = +simChartElement.clientWidth - margin.left - margin.right
  const height = +simChartElement.clientHeight - margin.top - margin.bottom
  console.log(width, height)

  const g = simChart.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
  console.log(g)
  // isHorizontal=true

  x = d3.scaleLinear()
    .domain([1, n - 2])
    .range([0, width])

  y = d3.scaleLinear()
    .domain([0, vrange])
    .range([height, 0])

  line = d3.line()
    .curve(d3.curveBasis)
    .x(function (d, i) { return x(i) })
    .y(function (d, i) { return y(d) })

  // Add scales to axis
  const yAxis = d3.axisRight()
    .scale(y).ticks(4)

  g.append('defs').append('clipPath')
    .attr('id', 'clip_speedline')
    .append('rect')
    .attr('width', width)
    .attr('height', height)

  console.log(data)

  // Append group and insert axis
  g.append('g')
    .call(yAxis)
    .attr('class', 'yaxis')
    .style('stroke', 'white')
    .style('fill', 'white')
    .style('font-size', '3vw')
    .style('font-family', 'sans-serif').select('.domain').remove()

  g.append('line')
    .attr('class', 'mean-line')
    .style('stroke', 'white')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', y(target))
    .attr('y2', y(target))

  g.append('text')
    .text(`Target ${target}`)
    .style('stroke', 'white')
    .style('fill', 'white')
    .style('font-size', '3vw')
    .style('font-family', 'sans-serif')
    .attr('x', width - 100)
    .attr('y', y(target))

  g.append('g')
    .attr('clip-path', 'url(#clip_speedline)')
    .append('path')
    .datum(data)
    .attr('class', 'line')
    .attr('id', 'speedline')
    .transition()
    .duration(slideTime)
    .ease(d3.easeLinear)
    .on('start', tickv)
}
