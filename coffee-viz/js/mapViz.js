function Legend({
  color,
  title,
  tickSize = 6,
  width = 320,
  height = 44 + tickSize,
  marginTop = 18,
  marginRight = 0,
  marginBottom = 16 + tickSize,
  marginLeft = 0,
  ticks = width / 64,
  tickFormat,
  tickValues
} = {},svg) {
  

  let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
  let x;

  // Continuous
  if (color.interpolate) {
    const n = Math.min(color.domain().length, color.range().length);

    x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));

    svg.append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
  }

  // Sequential
  else if (color.interpolator) {
    x = Object.assign(color.copy()
      .interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
        range() {
          return [marginLeft, width - marginRight];
        }
      });

    svg.append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp(color.interpolator()).toDataURL());

    // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
    if (!x.ticks) {
      if (tickValues === undefined) {
        const n = Math.round(ticks + 1);
        tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
      }
      if (typeof tickFormat !== "function") {
        tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
      }
    }
  }

  // Threshold
  else if (color.invertExtent) {
    const thresholds = color.thresholds ? color.thresholds() // scaleQuantize
      :
      color.quantiles ? color.quantiles() // scaleQuantile
      :
      color.domain(); // scaleThreshold

    const thresholdFormat = tickFormat === undefined ? d => d :
      typeof tickFormat === "string" ? d3.format(tickFormat) :
      tickFormat;

    x = d3.scaleLinear()
      .domain([-1, color.range().length - 1])
      .rangeRound([marginLeft, width - marginRight]);

    svg.append("g")
      .selectAll("rect")
      .data(color.range())
      .join("rect")
      .attr("x", (d, i) => x(i - 1))
      .attr("y", marginTop)
      .attr("width", (d, i) => x(i) - x(i - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", d => d);

    tickValues = d3.range(thresholds.length);
    tickFormat = i => thresholdFormat(thresholds[i], i);
  }

  // Ordinal
  else {
    x = d3.scaleBand()
      .domain(color.domain())
      .rangeRound([marginLeft, width - marginRight]);

    svg.append("g")
      .selectAll("rect")
      .data(color.domain())
      .join("rect")
      .attr("x", x)
      .attr("y", marginTop)
      .attr("width", Math.max(0, x.bandwidth() - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", color);

    tickAdjust = () => {};
  }

  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x)
      .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
      .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
      .tickSize(tickSize)
      .tickValues(tickValues))
    .call(tickAdjust)
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", marginLeft)
      .attr("y", marginTop + marginBottom - height - 6)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text(title));

  return svg.node();
}

function ramp(color, n = 256) {
  var canvas = document.createElement('canvas');
  canvas.width = n;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  for (let i = 0; i < n; ++i) {
    context.fillStyle = color(i / (n - 1));
    context.fillRect(i, 0, 1, 1);
  }
  return canvas;
}



function initializeMapViz() {
    const width = document.getElementById('map-viz').clientWidth;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const color = d3.scaleQuantize([1, 10], d3.schemeBlues[9]);

    // Create SVG
    const svg = d3.select('#map-viz')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('id','map-viz-svg');


    // Create map projection
    const projection = d3.geoMercator()
        .scale((width - 3) / (2 * Math.PI))
        .translate([width / 2, height / 2]);

    const path = d3.geoPath()
        .projection(projection);

    // Create color scale
    const colorScale = d3.scaleSequential()
        .domain([60, 90]) // Adjust based on your data range
        .interpolator(d3.interpolateYlOrRd);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // Load world map data
    d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
        .then(world => {
            // Draw base map
            svg.append('g')
                .attr('id','map-viz-svg-g')
                .selectAll('path')
                .data(topojson.feature(world, world.objects.countries).features)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('d', path)
                .attr('fill', '#e0e0e0'); // Default fill color for countries

            // Add legend
            Legend({color, title: "Total Score", width: 260},svg);


            const legendData = [60, 70, 80, 90];
            const legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${width - 120}, 20)`);

            legend.selectAll('circle')
                .data(legendData)
                .enter()
                .append('circle')
                .attr('cy', (d, i) => i * 25)
                .attr('r', 4)
                .attr('fill', d => colorScale(d));

            legend.selectAll('text')
                .data(legendData)
                .enter()
                .append('text')
                .attr('x', 10)
                .attr('y', (d, i) => i * 25 + 4)
                .text(d => `Score: ${d}`);
        });
}

function getColor(score) {
        return score > 90 ? '#005700' :
               score > 85 ? '#007500' :
               score > 80 ? '#009500' :
                             '#00b500';
    }

function updateMapWithScores(averageScores) {
    const svg = d3.select('#map-viz-svg-g'); // Select the existing SVG
    
    const colorScale = d3.scaleSequential()
        .domain([60, 70]) // Adjust based on your data range
        .interpolator(d3.interpolateYlOrRd);

    // Load world map data again if necessary (or cache it)
    d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
        .then(world => {
            const countries = topojson.feature(world, world.objects.countries).features;
            console.log(countries)
            const colorScale = d3.scaleSequential()
                                .domain([60, 90]) // Adjust based on your data range
                                .interpolator(d3.interpolateYlOrRd);

            // Update countries' fill based on average scores
            d3.selectAll('.country')
                .data(countries)
                .attr('fill', d => {
                    const countryName = d.properties.name; // Adjust based on your GeoJSON structure
                    const avgScore = averageScores[countryName] || 0; // Get average score or default to 0
                    return colorScale(avgScore);
                });
        });
}
