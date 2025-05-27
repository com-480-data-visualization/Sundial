function initializePriceViz(data) {
    // Visualization dimensions and margins
    const width = document.getElementById('price-viz').clientWidth;
    const height = 500;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3.select('#price-viz')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.price) * 1.1])
        .range([innerHeight, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeYear.every(5))
        .tickFormat(d3.timeFormat('%Y'));

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d => `$${d3.format('.2f')(d)}`);

    // Draw axes
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
        .x(d => xScale(d.date))
        .y(d => yScale(d.price));

    // Draw price line
    g.append('path')
        .datum(data)
        .attr('class', 'price-line')
        .attr('d', line)
        .style('stroke', '#2196F3')
        .style('stroke-width', 2)
        .style('fill', 'none');

    // Create area generator
    const area = d3.area()
        .x(d => xScale(d.date))
        .y0(innerHeight)
        .y1(d => yScale(d.price));

    // Draw area
    g.append('path')
        .datum(data)
        .attr('class', 'price-area')
        .attr('d', area)
        .style('fill', '#2196F3')
        .style('opacity', 0.1);

    // Tooltip setup
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip price-tooltip')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('box-shadow', '0 2px 6px rgba(0,0,0,0.2)')
        .style('pointer-events', 'none')
        .style('opacity', 0);

    // Interactive elements
    const bisect = d3.bisector(d => d.date).left;
    const hoverLine = g.append('line')
        .style('stroke', '#666')
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0);

    const hoverPoint = g.append('circle')
        .attr('r', 5)
        .style('fill', '#2196F3')
        .style('opacity', 0);

    // Mouse interaction
    svg.append('rect')
        .attr('class', 'overlay')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .style('opacity', 0)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);

    // Update the mousemove handler in priceViz.js

    function mousemove(event) {
        // Get coordinates relative to the chart's inner area
        const [xPos, yPos] = d3.pointer(event, g.node());
        
        // Find nearest data point
        const mouseDate = xScale.invert(xPos);
        const index = bisect(data, mouseDate, 1);
        const d0 = data[index - 1];
        const d1 = data[index];
        const d = d0 && d1 
            ? mouseDate - d0.date > d1.date - mouseDate ? d1 : d0 
            : data[index];

        if (d) {
            // Position elements using the precise scale conversion
            const exactX = xScale(d.date);
            const exactY = yScale(d.price);

            // Update hover line position
            hoverLine
                .attr('x1', exactX)
                .attr('x2', exactX)
                .attr('y1', 0)
                .attr('y2', innerHeight)
                .style('opacity', 1);

            // Update hover point position
            hoverPoint
                .attr('cx', exactX)
                .attr('cy', exactY)
                .style('opacity', 1);

            // Position tooltip relative to mouse
            tooltip
                .html(`
                    <div class="tooltip-date">${d3.timeFormat('%b %d, %Y')(d.date)}</div>
                    <div class="tooltip-price">$${d3.format('.2f')(d.price)}/lb</div>
                `)
                .style('left', `${event.pageX + 12}px`)  // 12px right of cursor
                .style('top', `${event.pageY - 40}px`)
                .style('opacity', 1);
        }
    }

    function mouseout() {
        hoverLine.style('opacity', 0);
        hoverPoint.style('opacity', 0);
        tooltip.style('opacity', 0);
    }

    // Add dynamic annotations
    addAnnotations(g, xScale, yScale, data);
}

function addAnnotations(g, xScale, yScale, data) {
    if (data.length === 0) return;

    const annotationGroup = g.append('g').attr('class', 'annotations');
    
    // Find key price points
    const maxPrice = d3.max(data, d => d.price);
    const minPrice = d3.min(data, d => d.price);
    const maxEntry = data.find(d => d.price === maxPrice);
    const minEntry = data.find(d => d.price === minPrice);

    [maxEntry, minEntry].forEach((entry, i) => {
        if (!entry) return;

        const annotation = annotationGroup.append('g')
            .attr('transform', `translate(${xScale(entry.date)},${yScale(entry.price)})`);

        annotation.append('circle')
            .attr('r', 5)
            .style('fill', i === 0 ? '#ff4081' : '#4CAF50');

        annotation.append('text')
            .attr('x', i === 0 ? 10 : -10)
            .attr('y', i === 0 ? -15 : 25)
            .attr('text-anchor', i === 0 ? 'start' : 'end')
            .text(`${i === 0 ? 'All-time High' : 'Record Low'}: $${d3.format('.2f')(entry.price)}`)
            .style('font-size', '12px')
            .style('fill', i === 0 ? '#ff4081' : '#4CAF50');
    });
}