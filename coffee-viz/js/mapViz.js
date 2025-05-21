// Map visualization
function initializeMapViz(data) {
    const width = document.getElementById('map-viz').clientWidth;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Create SVG
    const svg = d3.select('#map-viz')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Create map projection
    const projection = d3.geoMercator()
        .scale((width - 3) / (2 * Math.PI))
        .translate([width / 2, height / 2]);

    const path = d3.geoPath()
        .projection(projection);

    // Create color scale
    const colorScale = d3.scaleSequential()
        .domain([60, 90])
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
                .selectAll('path')
                .data(topojson.feature(world, world.objects.countries).features)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('d', path)
                .attr('fill', d => {
                    const countryData = data.filter(c => c.country_of_origin === d.properties.name);
                    if (countryData.length > 0) {
                        const avgScore = d3.mean(countryData, c => +c.total_cup_points);
                        return colorScale(avgScore);
                    }
                    return '#e0e0e0'; // Default color for countries without data
                });

            // Add coffee production locations
            const circles = svg.selectAll('circle')
                .data(data)
                .enter()
                .append('circle')
                .attr('cx', d => {
                    const coords = projection([d.longitude, d.latitude]);
                    return coords ? coords[0] : null;
                })
                .attr('cy', d => {
                    const coords = projection([d.longitude, d.latitude]);
                    return coords ? coords[1] : null;
                })
                .attr('r', 4)
                .attr('fill', d => colorScale(+d.total_cup_points))
                .attr('opacity', 0.7)
                .attr('class', 'interactive-element');

            // Add interactions
            circles.on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 6);

                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);

                tooltip.html(`
                    <strong>${d.country_of_origin}</strong><br/>
                    Altitude: ${d.altitude_mean_meters}m<br/>
                    Total Score: ${d.total_cup_points}<br/>
                    Aroma: ${d.aroma}<br/>
                    Flavor: ${d.flavor}<br/>
                    Acidity: ${d.acidity}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 4);

                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

            // Add legend
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

// Add controls for filtering
function addMapControls() {
    const controls = d3.select('#map-viz')
        .append('div')
        .attr('class', 'controls');

    // Add quality score filter
    controls.append('label')
        .attr('class', 'control-label')
        .text('Minimum Quality Score:');

    controls.append('input')
        .attr('type', 'range')
        .attr('min', 60)
        .attr('max', 90)
        .attr('value', 60)
        .on('input', function() {
            filterPoints(this.value);
        });
} 