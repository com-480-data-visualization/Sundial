async function initializeMapViz() {
    const width = document.getElementById('map-viz').clientWidth;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const svg = d3.select('#map-viz')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('id','map-viz-svg');

    const projection = d3.geoMercator()
        .scale((width - 3) / (2 * Math.PI))
        .translate([width / 2, height / 2]);

    const path = d3.geoPath()
        .projection(projection);

    const colorScale = d3.scaleSequential()
        .domain([60, 90]) 
        .interpolator(d3.interpolateYlOrRd);

    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    await d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
        .then(world => {
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
                    const countryName = d.properties.name;
                    
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    tooltip.html(countryName)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });; 
        });

    return 0
}

function createOrUpdateLegend(averageScores) {
  const svg = d3.select('#map-viz svg'); 
  const legendWidth = 200;
  const legendHeight = 20;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };

  const minScore = Math.round(d3.min(Object.values(averageScores))*10)/10; 
  const maxScore = Math.round(d3.max(Object.values(averageScores))*10)/10; 

  const colorScale = d3.scaleLinear()
        .domain([maxScore, minScore])
        .range(["#733001","#d1b19b"]); 

  svg.selectAll('.legend').remove();

  const legendGroup = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

  legendGroup.append('rect')
      .attr('x', 0)
      .attr('y', svg.attr('height')-60)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('id','map-viz legend')
      .style('fill', 'url(#gradient)');

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
    const minScore = d3.min(Object.values(averageScores));
    const maxScore = d3.max(Object.values(averageScores));

    const colorScale = d3.scaleLinear()
        .domain([maxScore, minScore])
        .range(["#733001","#d1b19b"]); 

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

    const colorScale = d3.scaleLinear()
        .domain([minScore, maxScore])
        .range(["#8c510a", "#f6e8c3"]); 

    return colorScale(countryScore);
}


async function updateMapWithScores(averageScores, property) {
  const svg = d3.select('#map-viz-svg-g'); 
  d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
      .then(world => {
          const countries = topojson.feature(world, world.objects.countries).features;
          svg.selectAll('.country')
              .data(countries)
              .attr('fill', d => {
                  const countryName = d.properties.name; 
                  const avgScore = averageScores[countryName] || 0; 
                  if(avgScore == 0){
                    return '#e0e0e0'
                  }
                  return getColorForCountryScore(averageScores, avgScore)
              })
              .on('click', function(event, d) {
                    const countryName = d.properties.name; 
                    displayCountryScore(countryName, averageScores, property); 
                })
          
      });
    createOrUpdateLegend(averageScores);
    displayBarChart(averageScores, property)
    displayCountryScore('Brazil', averageScores, property);
}

function displayCountryScore(countryName, averageScores, property) {
    const container = d3.select('#country-score');

    container.selectAll(`.country-score`).remove();

    const countryDiv = container.append('div')
        .attr('class', `country-score`)
        .style('margin', '10px');

    const score = averageScores[countryName] || 0;

    const maxScore = Math.round(d3.max(Object.values(averageScores))*10)/10;
    const minScore = Math.round(d3.min(Object.values(averageScores))*10)/10;
    
    countryDiv.append('p')
        .text(countryName)
        .attr('class','country-score-name');

    countryDiv.append('p')
        .text(`The ${property} Score`)
        .attr('class','country-score-property');
    
    const svg = countryDiv.append('svg')
        .attr('width', 200)
        .attr('height', 200);
  
    const arcGroup = svg.append('g')
        .attr('transform', 'translate(100, 100)')
        .attr('display','center'); 

    const arc = d3.arc()
        .innerRadius(30*2)
        .outerRadius(40*2)
        .startAngle(0);
    
    const finalEndAngle = ((score - minScore) / (maxScore - minScore)) * 2 * Math.PI;
    
    const path = arcGroup.append('path')
        .attr('d', arc.endAngle(0))
        .attr('fill', '#ffcc00')
        .attr('id', 'score-chart');
    
    const scoreText = arcGroup.append('text')
        .text('0.0')
        .style('font-weight', 'bold')
        .style('font-size', '50')
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr('dy', 5);
    
    path.transition()
        .duration(1500) 
        .attrTween('d', function() {
            const interpolate = d3.interpolate(0, finalEndAngle);
            return function(t) {
                return arc.endAngle(interpolate(t))();
            };
        });
    
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
    const data = Object.entries(averageScores)
        .map(([country, scores]) => ({ country, score: scores }))
        .sort((a, b) => b.score - a.score); 

    const width = 1000;
    const height = 400;
    const marginTop = 20;
    const marginRight = 0;
    const marginBottom = 30;
    const marginLeft = 40;
    const minScore = d3.min(data, d => d.score);
    const yAxisStart = minScore * 0.9;

    d3.select("#score-ranking").selectAll("*").remove();
    const svg = d3.select("#score-ranking")
        .append('svg')
        .attr('width', width)
        .attr('height', height + 100); 

    const x = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([marginLeft, width - marginRight])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([yAxisStart, d3.max(data, d => d.score)]).nice()
        .range([height - marginBottom, marginTop]);

    const xAxis = d3.axisBottom(x).tickSizeOuter(0);
    const yAxis = d3.axisLeft(y).tickFormat(d => d.toFixed(2));


    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);


    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove());

    bars_g = svg.append("g")
    bars_g.selectAll("rect")
        .data(data)
        .join("rect")
        .attr('fill',d=>barColor(averageScores, d.score))
        .attr("x", d => x(d.country))
        .attr("width", x.bandwidth())
        .attr("y", height - marginBottom) 
        .attr("height", 0) 
        .transition()
        .duration(800)
        .delay((d, i) => i * 50) 
        .attr("y", d => y(d.score))
        .attr("height", d => height - marginBottom - y(d.score))
        
    bars_g.selectAll('rect')
        .data(data)
        .on("mouseover", function(event, d) {
                tooltip.transition()
                        .duration(200)
                        .style('opacity', 0.9);
                tooltip.html(d.score)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
                
                d3.select(this).attr("fill", "#ff0000"); 
            })
        .on("mousemove", function(event) {
             tooltip.style("top", (event.pageY-10)+"px")
                .style("left",(event.pageX+10)+"px");
        })
        .on("mouseout", function(event, d) {
            tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
            
            d3.select(this).attr("fill", barColor(averageScores, d.score));
        });; 

    
            
    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis);

    xAxisGroup.selectAll("text")
    .attr("transform", "rotate(90)")
    .attr("text-anchor", "end")
    .attr("dy", "-0.5em")
    .attr("dx", "-0.5em")
    .attr("color", function(d) {
        try {
            const dataPoint = data.find(item => item.country == d);
             return "#31119c"; 
        } catch (error) {
            console.error("Error in textcolor:", error);
            return "#e0e0e0"; 
        }
    });
}