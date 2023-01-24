
/* global app */

/* This Rather Ugly code simulates watching the database run in a monitoring tool */

/* global d3 */
const slideTime = 50
const nPoints = 100

function tickv () {
  if (Math.random() < 0.05) {
    app.simulator.cpu = Math.floor(app.simulator.opdesc.cpu * (0.95 + Math.random() * 0.1))
    app.simulator.disk = Math.floor(app.simulator.opdesc.iops * (0.95 + Math.random() * 0.1))
    app.simulator.ops = Math.floor(app.simulator.opdesc.performance * (0.95 + Math.random() * 0.1))
  }

  app.simulator.data.push(app.simulator.ops * (0.95 + Math.random() * 0.1))

  app.simulator.data.shift()

  d3.select(this)
    .attr('d',
      app.simulator.line)
    .attr('transform', null)

  app.simulator.graphtime--
  if (app.simulator.graphtime > 0) {
    d3.active(this)
      .attr('transform', 'translate(' + app.simulator.x(0) + ',0)')
      .transition()
      .on('start', tickv)
  } else {
    console.log(
      app.simulator.data)
  }
}

// eslint-disable-next-line no-unused-vars
function simulateOp (opdesc, resolve) {
  console.log(opdesc)
  app.simulator.opdesc = opdesc
  app.simulator.target = opdesc.target
  app.simulator.vrange = opdesc.vrange
  app.simulator.resolvefn = resolve
  app.simulator.graphtime = 400
  app.simulator.desc = opdesc.desc
  app.simulator.cpu = opdesc.cpu
  app.simulator.ram = opdesc.ram
  app.simulator.disk = opdesc.iops
  app.simulator.ops = opdesc.performance
  testSim()
}

// eslint-disable-next-line no-unused-vars
function closeSim () {
  app.simulator.graphtime = 0 /* Stop animations */
  app.showDialog = false
  app.showSimulator = false
  app.simulator.resolvefn()
}

async function testSim () {
  app.showDialog = true
  app.showSimulator = true

  // eslint-disable-next-line no-undef
  await Vue.nextTick() /* Have to wait for it to draw */

  const simChartElement = document.getElementById('simchart')
  const simChart = d3.select('#simchart')

  // eslint-disable-next-line no-undef

  app.simulator.data = d3.range(nPoints).map(() => 0)
  d3.selectAll('svg > *').remove() // Clear the chart
  // Add a graphics context in the SVG with a margin
  const margin = { top: 20, right: 10, bottom: 10, left: 10 }
  const width = +simChartElement.clientWidth - margin.left - margin.right
  const height = +simChartElement.clientHeight - margin.top - margin.bottom
  console.log(width, height)

  const g = simChart.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
  console.log(g)
  // isHorizontal=true

  app.simulator.x = d3.scaleLinear()
    .domain([1, nPoints - 2])
    .range([0, width])

  const y = d3.scaleLinear()
    .domain([0, app.simulator.vrange])
    .range([height, 0])

  app.simulator.line = d3.line()
    .curve(d3.curveBasis)
    .x(function (d, i) { return app.simulator.x(i) })
    .y(function (d, i) { return y(d) })

  // Add scales to axis
  const yAxis = d3.axisRight()
    .scale(y).ticks(4)

  g.append('defs').append('clipPath')
    .attr('id', 'clip_speedline')
    .append('rect')
    .attr('width', width)
    .attr('height', height)

  console.log(app.simulator.data)

  // Append group and insert axis
  g.append('g')
    .call(yAxis)
    .attr('class', 'yaxis')
    .style('stroke', 'white')
    .style('fill', 'white')
    .style('font-size', '2vh')
    .style('font-family', 'sans-serif').select('.domain').remove()

  g.append('line')
    .attr('class', 'meanline')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', y(app.simulator.target))
    .attr('y2', y(app.simulator.target))

    g.append('line')
    .attr('class', 'axisline')
    .style('stroke', 'white')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', y(0))
    .attr('y2', y(0))

    g.append('line')
    .attr('class', 'axisline')
    .style('stroke', 'white')
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', 0)
    .attr('y2', height)


  g.append('text')
    .text(`Target ${app.simulator.target}`)
    .style('stroke', 'white')
    .style('fill', 'white')
    .style('font-size', '2vh')
    .style('font-family', 'sans-serif')
    .attr('x', width)
    .attr('y', y(app.simulator.target) - 20)
    .attr('text-anchor', 'end')

  g.append('g')
    .attr('clip-path', 'url(#clip_speedline)')
    .append('path')
    .datum(app.simulator.data)
    .attr('class', 'line')
    .attr('id', 'speedline')
    .transition()
    .duration(slideTime)
    .ease(d3.easeLinear)
    .on('start', tickv)
}
