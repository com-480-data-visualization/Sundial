function initializeMapViz() {
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
        });
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

function updateMapWithScores(averageScores) {
  const svg = d3.select('#map-viz-svg-g'); // Select the existing SVG
    // Load world map data again if necessary (or cache it)
  d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
      .then(world => {
          const countries = topojson.feature(world, world.objects.countries).features;
          console.log(countries)
          const colorScale = d3.scaleThreshold()
                              .domain([0, 100])
                              .range(d3.schemeBlues[7]);

          // Update countries' fill based on average scores
          svg.selectAll('.country')
              .data(countries)
              .attr('fill', d => {
                  const countryName = d.properties.name; // Adjust based on your GeoJSON structure
                  const avgScore = averageScores[countryName] || 0; // Get average score or default to 0
                  if(avgScore == 0){
                    return '#e0e0e0'
                  }
                  return getColorForCountryScore(averageScores, avgScore)
              });
          
      });
    createOrUpdateLegend(averageScores);
}
