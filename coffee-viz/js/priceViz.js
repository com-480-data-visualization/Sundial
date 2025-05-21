// Price visualization
function initializePriceViz(data) {
    const width = document.getElementById('price-viz').clientWidth;
    const height = 500;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#price-viz')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data
    const yearExtent = d3.extent(data, d => d.year);
    const priceExtent = d3.extent(data, d => d.price);

    // Create scales
    const xScale = d3.scaleLinear()
        .domain(yearExtent)
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, priceExtent[1] * 1.1]) // Add 10% padding
        .range([innerHeight, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('d'));
    
    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d => `$${d3.format('.2f')(d)}`);

    // Add axes
    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', innerWidth / 2)
        .attr('y', 40)
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
        .text('Price per Pound (USD)');

    // Create line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.price));

    // Add price line
    g.append('path')
        .datum(data)
        .attr('class', 'line')
        .attr('d', line)
        .style('stroke', '#2196F3')
        .style('stroke-width', 2)
        .style('fill', 'none');

    // Add area under the curve
    const area = d3.area()
        .x(d => xScale(d.year))
        .y0(innerHeight)
        .y1(d => yScale(d.price));

    g.append('path')
        .datum(data)
        .attr('class', 'area')
        .attr('d', area)
        .style('fill', '#2196F3')
        .style('opacity', 0.1);

    // Add tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // Add hover effects
    const hoverLine = g.append('line')
        .attr('class', 'hover-line')
        .style('opacity', 0);

    const hoverPoint = g.append('circle')
        .attr('class', 'hover-point')
        .attr('r', 4)
        .style('opacity', 0);

    // Add overlay for mouse events
    svg.append('rect')
        .attr('class', 'overlay')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .style('opacity', 0)
        .on('mousemove', onMouseMove)
        .on('mouseout', onMouseOut);

    // Add annotations for significant events
    addPriceAnnotations(g, xScale, yScale, data);

    function onMouseMove(event) {
        const [mouseX] = d3.pointer(event);
        const x0 = xScale.invert(mouseX - margin.left);
        const year = Math.round(x0);
        
        if (year >= yearExtent[0] && year <= yearExtent[1]) {
            const yearData = data.find(d => d.year === year);
            
            if (yearData) {
                hoverLine
                    .attr('x1', xScale(year))
                    .attr('x2', xScale(year))
                    .attr('y1', 0)
                    .attr('y2', innerHeight)
                    .style('stroke', '#999')
                    .style('stroke-dasharray', '3,3')
                    .style('opacity', 1);

                hoverPoint
                    .attr('cx', xScale(year))
                    .attr('cy', yScale(yearData.price))
                    .style('fill', '#2196F3')
                    .style('opacity', 1);

                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);

                tooltip.html(`
                    <strong>Year: ${year}</strong><br/>
                    Price: $${d3.format('.2f')(yearData.price)}/lb<br/>
                    ${yearData.event ? `Event: ${yearData.event}` : ''}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            }
        }
    }

    function onMouseOut() {
        hoverLine.style('opacity', 0);
        hoverPoint.style('opacity', 0);
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }
}

// Add annotations for significant price events
function addPriceAnnotations(g, xScale, yScale, data) {
    const annotations = [
        {
            year: 2011,
            price: 2.53,
            text: '2011 Price Peak'
        },
        {
            year: 2019,
            price: 0.93,
            text: '2019 Price Crisis'
        }
    ];

    const annotationGroup = g.append('g')
        .attr('class', 'annotations');

    annotations.forEach(ann => {
        const annotation = annotationGroup.append('g')
            .attr('transform', `translate(${xScale(ann.year)},${yScale(ann.price)})`);

        // Add dot
        annotation.append('circle')
            .attr('r', 4)
            .style('fill', '#ff4081');

        // Add text
        annotation.append('text')
            .attr('x', 10)
            .attr('y', -10)
            .text(ann.text)
            .style('font-size', '12px')
            .style('fill', '#666');
    });
} 