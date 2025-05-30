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
                .attr('fill', '#e0e0e0')
                .on('mouseover', function(event, d) {
                    // Get country name (use the index to match with countryNames array)
                    const countryName = d.properties.name;
                    
                    // Show tooltip
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    tooltip.html(countryName)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', function() {
                    // Hide tooltip
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });; // Default fill color for countries
        });

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
  const colorScale = d3.scaleLinear()
        .domain([maxScore, minScore])
        .range(["#733001","#d1b19b"]); // YlOrBr is a yellow to brown color scale

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
    const minScore = d3.min(Object.values(averageScores));
    const maxScore = d3.max(Object.values(averageScores));

    // Custom brown to yellow colors
    const colorScale = d3.scaleLinear()
        .domain([maxScore, minScore])
        .range(["#733001","#d1b19b"]); // Dark brown to light yellow

    return colorScale(countryScore);
}
function barColor(averageScores, countryScore){
    const minScore = d3.min(Object.values(averageScores));
    const maxScore = d3.max(Object.values(averageScores));
    const colorScale = d3.scaleSequential()
        .domain([minScore, maxScore+(maxScore-minScore)*0.4])
        .interpolator(d3.interpolateYlOrBr);
    return colorScale(countryScore);
}
function bar_textcolor(averageScores, countryScore) {
    const minScore = d3.min(Object.values(averageScores));
    const maxScore = d3.max(Object.values(averageScores));

    // Custom brown to yellow colors
    const colorScale = d3.scaleLinear()
        .domain([minScore, maxScore])
        .range(["#8c510a", "#f6e8c3"]); // Dark brown to light yellow

    return colorScale(countryScore);
}


async function updateMapWithScores(averageScores, property) {
  const svg = d3.select('#map-viz-svg-g'); // Select the existing SVG
    // Load world map data again if necessary (or cache it)
  d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
      .then(world => {
          const countries = topojson.feature(world, world.objects.countries).features;
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
    const minScore = Math.round(d3.min(Object.values(averageScores))*10)/10;
    
    // Create text elements
    countryDiv.append('p')
        .text(countryName)
        .attr('class','country-score-name');

    countryDiv.append('p')
        .text(`The ${property} Score`)
        .attr('class','country-score-property');
    
    const svg = countryDiv.append('svg')
        .attr('width', 200)
        .attr('height', 200);
  
    // Create a group for the arc
    const arcGroup = svg.append('g')
        .attr('transform', 'translate(100, 100)')
        .attr('display','center'); // Move to the center

    // Define the arc generator
    const arc = d3.arc()
        .innerRadius(30*2)
        .outerRadius(40*2)
        .startAngle(0);
    
    // Calculate the final end angle
    const finalEndAngle = ((score - minScore) / (maxScore - minScore)) * 2 * Math.PI;
    
    // Create the arc path with initial end angle of 0
    const path = arcGroup.append('path')
        .attr('d', arc.endAngle(0))
        .attr('fill', '#ffcc00')
        .attr('id', 'score-chart');
    
    // Add the text element (initially showing 0)
    const scoreText = arcGroup.append('text')
        .text('0.0')
        .style('font-weight', 'bold')
        .style('font-size', '50')
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr('dy', 5);
    
    // Animate the arc and the text
    path.transition()
        .duration(1500) // Animation duration in milliseconds
        .attrTween('d', function() {
            const interpolate = d3.interpolate(0, finalEndAngle);
            return function(t) {
                return arc.endAngle(interpolate(t))();
            };
        });
    
    // Animate the text to count up
    scoreText.transition()
        .duration(1500)
        .tween("text", function() {
            const interpolate = d3.interpolate(0, Math.round(score*10)/10);
            return function(t) {
                this.textContent = interpolate(t).toFixed(1);
            };
        });
}

function displayBarChart(averageScores, property) {
    // Convert averageScores JSON to an array of objects
    const data = Object.entries(averageScores)
        .map(([country, scores]) => ({ country, score: scores }))
        .sort((a, b) => b.score - a.score); // Sort by score descending

    // Specify the chart's dimensions
    const width = 1000;
    const height = 400;
    const marginTop = 20;
    const marginRight = 0;
    const marginBottom = 30;
    const marginLeft = 40;
    const minScore = d3.min(data, d => d.score);
    const yAxisStart = minScore * 0.9;

    // Create the SVG container
    d3.select("#score-ranking").selectAll("*").remove();
    const svg = d3.select("#score-ranking")
        .append('svg')
        .attr('width', width)
        .attr('height', height + 100); // Extra space for labels

    // Declare the scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([marginLeft, width - marginRight])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([yAxisStart, d3.max(data, d => d.score)]).nice()
        .range([height - marginBottom, marginTop]);

    // Create axes
    const xAxis = d3.axisBottom(x).tickSizeOuter(0);
    const yAxis = d3.axisLeft(y).tickFormat(d => d.toFixed(2));

    // Append axes to SVG

    // Apply custom color to country labels

    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);


    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove());

    // Create bars with animation
    bars_g = svg.append("g")
    bars_g.selectAll("rect")
        .data(data)
        .join("rect")
        .attr('fill',d=>barColor(averageScores, d.score))
        .attr("x", d => x(d.country))
        .attr("width", x.bandwidth())
        .attr("y", height - marginBottom) // Start from bottom
        .attr("height", 0) // Start with zero height
        .transition()
        .duration(800)
        .delay((d, i) => i * 50) // Staggered animation
        .attr("y", d => y(d.score))
        .attr("height", d => height - marginBottom - y(d.score))
        
    bars_g.selectAll('rect')
        .data(data)
        .on("mouseover", function(event, d) {
                // Show tooltip
                tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                tooltip.html(d.score)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
                
                // Highlight bar
                d3.select(this).attr("fill", "#ff0000"); // Change color on hover
            })
        .on("mousemove", function(event) {
            // Move tooltip with mouse
            tooltip.style("top", (event.pageY-10)+"px")
                .style("left",(event.pageX+10)+"px");
        })
        .on("mouseout", function(event, d) {
            // Hide tooltip
            tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
            // Restore original color
            d3.select(this).attr("fill", barColor(averageScores, d.score));
        });; // Default fill color for countries

    
            
    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis);

    xAxisGroup.selectAll("text")
    .attr("transform", "rotate(90)")
    .attr("text-anchor", "end")
    .attr("dy", "-0.5em")
    .attr("dx", "-0.5em")
    // .attr("stroke", "#000000")
    // .attr("stroke-width", 0.1)
    .attr("color", function(d) {
        try {
            const dataPoint = data.find(item => item.country == d);
            // return bar_textcolor(averageScores, dataPoint.score);
             return "#31119c"; // Default text color
        } catch (error) {
            console.error("Error in textcolor:", error);
            return "#e0e0e0"; // fallback color
        }
    });
}