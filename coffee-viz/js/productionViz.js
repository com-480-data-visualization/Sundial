// Production visualization
function initializeProductionViz(data) {
    if (!data || data.length === 0) {
        console.error('No production data available');
        return;
    }

    const width = document.getElementById('production-viz').clientWidth;
    const height = 500;
    const margin = { top: 40, right: 100, bottom: 60, left: 60 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#production-viz')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data
    const topProducers = getTopProducers(data);
    const yearExtent = d3.extent(data, d => d.year);

    // Create scales
    const xScale = d3.scaleLinear()
        .domain(yearExtent)
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d.production) * 1.1]) // Add 10% padding and ensure numeric
        .range([innerHeight, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(topProducers)
        .range(d3.schemeCategory10);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('d'));
    
    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d => d3.format('.2s')(d));

    // Add axes
    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', innerWidth / 2)
        .attr('y', 40)
        .attr('fill', 'black')
        .text('Year');

    g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('x', -innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'black')
        .text('Production (60kg bags)');

    // Create line generator
    const line = d3.line()
        .defined(d => !isNaN(d.production) && d.production !== null)
        .x(d => xScale(d.year))
        .y(d => yScale(+d.production)); // Ensure numeric conversion

    // Add lines for each country
    topProducers.forEach(country => {
        const countryData = data
            .filter(d => d.country === country)
            .sort((a, b) => a.year - b.year)
            .map(d => ({
                ...d,
                production: +d.production // Ensure numeric conversion
            }));

        if (countryData.length > 0) {
            // Add the line
            g.append('path')
                .datum(countryData)
                .attr('class', 'line')
                .attr('d', line)
                .style('stroke', colorScale(country))
                .style('fill', 'none')
                .style('stroke-width', 2);

            // Add points
            g.selectAll(`.point-${country.replace(/\s+/g, '-')}`)
                .data(countryData)
                .enter()
                .append('circle')
                .attr('class', `point-${country.replace(/\s+/g, '-')}`)
                .attr('cx', d => xScale(d.year))
                .attr('cy', d => yScale(d.production))
                .attr('r', 4)
                .style('fill', colorScale(country))
                .style('stroke', '#fff')
                .style('stroke-width', 1);
        }
    });

    // Add legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - margin.right + 10},${margin.top})`);

    legend.selectAll('rect')
        .data(topProducers)
        .enter()
        .append('rect')
        .attr('y', (d, i) => i * 20)
        .attr('width', 10)
        .attr('height', 10)
        .style('fill', d => colorScale(d));

    legend.selectAll('text')
        .data(topProducers)
        .enter()
        .append('text')
        .attr('x', 15)
        .attr('y', (d, i) => i * 20 + 9)
        .text(d => d);

    // Add tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // Add hover effects
    const hoverLine = g.append('line')
        .attr('class', 'hover-line')
        .style('opacity', 0)
        .style('stroke', '#999')
        .style('stroke-dasharray', '3,3');

    const hoverPoints = g.selectAll('.hover-point')
        .data(topProducers)
        .enter()
        .append('circle')
        .attr('class', 'hover-point')
        .attr('r', 4)
        .style('opacity', 0);

    // Add overlay for mouse interaction
    svg.append('rect')
        .attr('class', 'overlay')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .style('opacity', 0)
        .on('mousemove', onMouseMove)
        .on('mouseout', onMouseOut);

    function onMouseMove(event) {
        const [mouseX] = d3.pointer(event);
        const x0 = xScale.invert(mouseX - margin.left);
        const year = Math.round(x0);
        
        if (year >= yearExtent[0] && year <= yearExtent[1]) {
            const yearData = data.filter(d => d.year === year);
            
            if (yearData.length > 0) {
                hoverLine
                    .attr('x1', xScale(year))
                    .attr('x2', xScale(year))
                    .attr('y1', 0)
                    .attr('y2', innerHeight)
                    .style('opacity', 1);

                hoverPoints
                    .attr('cx', xScale(year))
                    .attr('cy', d => {
                        const countryData = yearData.find(item => item.country === d);
                        return countryData ? yScale(countryData.production) : 0;
                    })
                    .style('opacity', d => yearData.some(item => item.country === d) ? 1 : 0)
                    .style('fill', d => colorScale(d));

                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);

                tooltip.html(`
                    <strong>Year: ${year}</strong><br/>
                    ${yearData
                        .filter(d => topProducers.includes(d.country))
                        .sort((a, b) => b.production - a.production)
                        .map(d => `${d.country}: ${d3.format(',.0f')(d.production)} bags`)
                        .join('<br/>')}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            }
        }
    }

    function onMouseOut() {
        hoverLine.style('opacity', 0);
        hoverPoints.style('opacity', 0);
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }
}

// Helper function to get top producers
function getTopProducers(data) {
    const productionByCountry = d3.rollup(data,
        v => d3.mean(v, d => d.production),
        d => d.country
    );

    return Array.from(productionByCountry)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(d => d[0]);
} 