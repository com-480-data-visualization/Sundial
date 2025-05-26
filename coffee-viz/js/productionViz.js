function initializeProductionViz(data) {
    // Filter top 10 producing countries
    const countryProduction = d3.rollup(data,
        v => d3.sum(v, d => d.production),
        d => d.country
    );
    
    const topCountries = Array.from(countryProduction)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(d => d[0]);

    // Setup dimensions
    const container = document.getElementById('production-viz');
    const width = container.clientWidth;
    const height = 500;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };

    // Create SVG
    const svg = d3.select(container)
        .html('')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Create scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.production)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Create color scale
    const colorScale = d3.scaleOrdinal()
        .domain(topCountries)
        .range(d3.schemeCategory10);

    // Create line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.production))
        .curve(d3.curveMonotoneX);

    // Draw lines
    topCountries.forEach(country => {
        const countryData = data.filter(d => 
            d.country === country && d.production > 0
        ).sort((a, b) => a.year - b.year);

        svg.append('path')
            .datum(countryData)
            .attr('fill', 'none')
            .attr('stroke', colorScale(country))
            .attr('stroke-width', 2)
            .attr('d', line);
    });

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(15).tickFormat(d3.format('d')));
    
    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    // Add labels
    svg.append('text')
        .attr('x', width/2)
        .attr('y', height - 10)
        .style('text-anchor', 'middle')
        .text('Year');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height/2)
        .attr('y', 20)
        .style('text-anchor', 'middle')
        .text('Production (1000 60kg bags)');

    // Add legend
    const legend = svg.append('g')
        .attr('font-size', 10)
        .attr('text-anchor', 'start')
        .selectAll('g')
        .data(topCountries)
        .enter().append('g')
        .attr('transform', (d, i) => `translate(${width - 140},${i * 20 + 20})`);

    legend.append('rect')
        .attr('x', 0)
        .attr('width', 19)
        .attr('height', 10)
        .attr('fill', d => colorScale(d));

    legend.append('text')
        .attr('x', 24)
        .attr('y', 9)
        .text(d => d);
}