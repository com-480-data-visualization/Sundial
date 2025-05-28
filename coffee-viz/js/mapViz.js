async function initializeMapViz() {
    const width = document.getElementById('map-viz').clientWidth;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
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
    await d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
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
        });

    console.log('check pt x')
    return 0
}

function createOrUpdateLegend(averageScores) {
  const svg = d3.select('#map-viz svg'); // Select the existing SVG
  const legendWidth = 200;
  const legendHeight = 20;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };

  // Calculate min and max scores
  const minScore = Math.round(d3.min(Object.values(averageScores))*10)/10; // Minimum score
  const maxScore = Math.round(d3.max(Object.values(averageScores))*10)/10; // Round up the max score

  // Create color scale from light yellow to deep brown
  const colorScale = d3.scaleSequential()
      .domain([minScore, maxScore])
      .interpolator(d3.interpolateYlOrBr); // YlOrBr is a yellow to brown color scale

  // Remove existing legend if it exists
  svg.selectAll('.legend').remove();

  // Create legend group
  const legendGroup = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Create gradient rectangle
  legendGroup.append('rect')
      .attr('x', 0)
      .attr('y', svg.attr('height')-60)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('id','map-viz legend')
      .style('fill', 'url(#gradient)');

  // Create a linear gradient
  const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

  gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colorScale(minScore))
      .attr('stop-opacity', 1);

  gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colorScale(maxScore))
      .attr('stop-opacity', 1);

  // Add min and max labels
  legendGroup.append('text')
      .attr('x', 0)
      .attr('y', svg.attr('height')-60 - 10)
      .text(`Min: ${minScore}`)
      .attr('font-size', '12px');

  legendGroup.append('text')
      .attr('x', legendWidth)
      .attr('y', svg.attr('height')-60 - 10)
      .text(`Max: ${maxScore}`)
      .attr('font-size', '12px')
      .attr('text-anchor', 'end');
}

function getColorForCountryScore(averageScores, countryScore) {
    // Calculate min and max scores from averageScores
    const minScore = (d3.min(Object.values(averageScores))); // Minimum score
    const maxScore = (d3.max(Object.values(averageScores))); // Round up the max score

    // Create color scale from light yellow to deep brown
    const colorScale = d3.scaleSequential()
        .domain([minScore, maxScore])
        .interpolator(d3.interpolateYlOrBr); // Use YlOrBr for yellow to brown

    // Return the color based on the countryScore
    return colorScale(countryScore);
}

async function updateMapWithScores(averageScores,property) {
  const svg = d3.select('#map-viz-svg-g'); // Select the existing SVG
    // Load world map data again if necessary (or cache it)
  d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
      .then(world => {
          const countries = topojson.feature(world, world.objects.countries).features;
        console.log('check pt 1')
          // Update countries' fill based on average scores
          svg.selectAll('.country')
              .data(countries)
              .attr('fill', d => {
                console.log('check pt 2')
                  const countryName = d.properties.name; // Adjust based on your GeoJSON structure
                  const avgScore = averageScores[countryName] || 0; // Get average score or default to 0
                  if(avgScore == 0){
                    return '#e0e0e0'
                  }
                  return getColorForCountryScore(averageScores, avgScore)
              })
              .on('click', function(event, d) {
                    const countryName = d.properties.name; // Get the country name
                    displayCountryScore(countryName, averageScores, property); // Call the display function
                })
          
      });
    createOrUpdateLegend(averageScores);
    displayBarChart(averageScores, property)
    displayCountryScore('Brazil', averageScores, property);
}

function displayCountryScore(countryName, averageScores, property) {
    // Select the div where we want to append the sector
    const container = d3.select('#country-score');

    // Clear previous content for the country
    container.selectAll(`.country-score`).remove();

    // Create a new div for this country's score
    const countryDiv = container.append('div')
        .attr('class', `country-score`)
        .style('margin', '10px');

    // Get the score for the specified property
    const score = averageScores[countryName] || 0;

    // Calculate max score among averageScores for the arc
    const maxScore = Math.round(d3.max(Object.values(averageScores))*10)/10;
    const minScore = Math.round(d3.min(Object.values(averageScores))*10)/10
    // Create an SVG for the arc
    countryDiv.append('p')
    .text(countryName)
    .attr('class','country-score-name')

    countryDiv.append('p')
      .text(`The ${property} Score`)
      .attr('class','country-score-property')
    
    const svg = countryDiv.append('svg')
        .attr('width', 200)
        .attr('height', 200);
  
    // Create a group for the arc
    const arcGroup = svg.append('g')
        .attr('transform', 'translate(100, 100)')
        .attr('display','center'); // Move to the center

    // Define the arc
    const arc = d3.arc()
        .innerRadius(30*2) // Inner radius for the arc
        .outerRadius(40*2) // Outer radius for the arc
        .startAngle(0) // Starting angle
        .endAngle(((score - minScore)/ (maxScore - minScore)) * 2 * Math.PI); // End angle based on score

    // Append the arc
    p = arcGroup.append('path')
        .attr('d', arc)
        .attr('fill', '#ffcc00') // Color of the arc
        .attr('id', 'score-chart')
        .attr("text-anchor", "middle") // Horizontally centers text
        .attr("dominant-baseline", "middle");
    
    arcGroup.append('text')
        .text((Math.round(score*10)/10))
        .style('font-weight', 'bold')
        .style('font-size', '50')
        .attr("text-anchor", "middle") // Horizontally centers text
        .attr("dominant-baseline", "middle")
        .attr('dy',5);
}

function displayBarChart(averageScores, property) {
    // Convert averageScores JSON to an array of objects
    const data = Object.entries(averageScores)
        .map(([country, scores]) => ({ country, score: scores }))
        .sort((a, b) => b.score - a.score); // Sort by score descending

    // Specify the chart’s dimensions.
    const width = 1000;
    const height = 400;
    const marginTop = 20;
    const marginRight = 0;
    const marginBottom = 30;
    const marginLeft = 40;

    // Create the SVG container.
    d3.select("#score-ranking").selectAll("*").remove();
    const svg = d3.select("#score-ranking")
    .append('svg')
    .attr('width', 1000)
    .attr('height', 500); // Assuming there's a div with id="bar-chart"
     // Declare the x (horizontal position) scale and the corresponding axis generator.
    const x = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([marginLeft, width - marginRight])
        .padding(0.1);

    const xAxis = d3.axisBottom(x).tickSizeOuter(0);

    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.score)]).nice()
        .range([height - marginBottom, marginTop]);

    // Append the SVG container
    svg.attr("viewBox", [0, 0, width, height])
        .attr("style", `max-width: ${width}px; height: auto; font: 10px sans-serif; overflow: visible;`);

    // Create a bar for each country.
    const bar = svg.append("g")
        .attr("fill", "steelblue")
        .selectAll("rect")
        .data(data)
        .join("rect")
            .style("mix-blend-mode", "multiply") // Darker color when bars overlap during the transition.
            .attr("x", d => x(d.country))
            .attr("y", d => y(d.score))
            .attr("height", d => y(0) - y(d.score))
            .attr("width", x.bandwidth())
            .transition() // Animate the bars
            .duration(750)
            .delay((d, i) => i * 20);

    // Create the axes.
    const gx = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis);

    const gy = svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).tickFormat(d => d.toFixed(2))) // Format y-axis ticks
        .call(g => g.select(".domain").remove());
    
        gx.selectAll("text")
        .attr("transform", "rotate(90)")
        .attr("text-anchor", "end")
        .attr("dy", "-0.5em")
        .attr("dx", "-0.5em")
        .attr('fill','#e0e0e0'); // Adjust the position of the text
}