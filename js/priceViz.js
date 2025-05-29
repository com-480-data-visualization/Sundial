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
        .style('stroke', '#0072FF')
        .style('stroke-width', 1.5)
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
        .style('fill', '#0072FF')
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
        .attr('r', 4)
        .style('fill', '#0D0D0D')
        .style('opacity', 0);

    // Mouse interaction overlay (fixed positioning)
    g.append('rect')
        .attr('class', 'overlay')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .style('opacity', 0)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);

    function mousemove(event) {
        const [xPos, yPos] = d3.pointer(event, g.node());
        const mouseDate = xScale.invert(xPos);
        const index = bisect(data, mouseDate, 1);
        const d0 = data[index - 1];
        const d1 = data[index];
        const d = d0 && d1 ? mouseDate - d0.date > d1.date - mouseDate ? d1 : d0 : data[index];

        if (d) {
            const exactX = xScale(d.date);
            const exactY = yScale(d.price);

            hoverLine.attr('x1', exactX)
                    .attr('x2', exactX)
                    .attr('y1', 0)
                    .attr('y2', innerHeight)
                    .style('opacity', 1);

            hoverPoint.attr('cx', exactX)
                     .attr('cy', exactY)
                     .style('opacity', 1);

            tooltip.html(`
                <div class="tooltip-date">${d3.timeFormat('%b %d, %Y')(d.date)}</div>
                <div class="tooltip-price">$${d3.format('.2f')(d.price)}/lb</div>
            `).style('left', `${event.pageX + 12}px`)
               .style('top', `${event.pageY - 40}px`)
               .style('opacity', 1);
        }
    }

    function mouseout() {
        hoverLine.style('opacity', 0);
        hoverPoint.style('opacity', 0);
        tooltip.style('opacity', 0);
    }

    // Add annotations and event markers
    addAnnotations(g, xScale, yScale, data);
    addEventMarkers(g, xScale, yScale, data, tooltip, hoverLine, hoverPoint);
}

function addAnnotations(g, xScale, yScale, data) {
    if (data.length === 0) return;

    const annotationGroup = g.append('g').attr('class', 'annotations');
    const innerWidth = xScale.range()[1];

    const maxPrice = d3.max(data, d => d.price);
    const minPrice = d3.min(data, d => d.price);
    const maxEntry = data.find(d => d.price === maxPrice);
    const minEntry = data.find(d => d.price === minPrice);

    [maxEntry, minEntry].forEach((entry, i) => {
        if (!entry) return;

        const xPos = xScale(entry.date);
        const yPos = yScale(entry.price);
        const isRightEdge = xPos > innerWidth * 0.9;

        const annotation = annotationGroup.append('g')
            .attr('transform', `translate(${xPos},${yPos})`);

        annotation.append('circle')
            .attr('r', 4)
            .style('fill', i === 0 ? '#FB313C' : '#1FA764');

        annotation.append('text')
            .attr('x', isRightEdge ? -10 : 10)
            .attr('y', i === 0 ? -15 : 25)
            .attr('text-anchor', isRightEdge ? 'end' : 'start')
            .text(`${i === 0 ? 'All-time High' : 'Record Low'}: $${d3.format('.2f')(entry.price)}`)
            .style('font-size', '12px')
            .style('fill', i === 0 ? '#FB313C' : '#1FA764')
            .style('font-weight', '500');
    });
}

function addEventMarkers(g, xScale, yScale, data, tooltip, hoverLine, hoverPoint) {
    const events = [
        {
            title: "Brazilian Frost",
            description: "Severe frost in Brazil destroyed coffee crops, causing global supply shortages and price spikes.",
            startYear: 1977,
            endYear: 1978,
            type: "max"
        },
        // New event 1
        {
            title: "1979-1980 Brazilian Frost & Central American Turmoil",
            description: "1979 frost in Brazil damaged crops while political instability (e.g., Nicaragua's Sandinista Revolution) disrupted exports. Prices surged due to tightened supply.",
            startYear: 1979,
            endYear: 1980,
            type: "max"
        },
        // Existing 1980s event
        {
            title: "Market Instability",
            description: "Price volatility from Central American droughts, African political conflicts, and dissolution of global coffee quotas (1989).",
            startYear: 1980,
            endYear: 1992,
            type: "max"
        },
        // New event 2
        {
            title: "1985-1986 Droughts and Economic Shifts",
            description: "Severe droughts in Brazil (1985) reduced yields. Currency devaluations in African nations incentivized rapid exports, creating price swings.",
            startYear: 1985,
            endYear: 1986,
            type: "max"
        },
        // New event 3
        {
            title: "1994-1995 Brazilian Real Plan Devaluation",
            description: "Brazil's 1994 'Plano Real' devaluation made coffee cheaper globally. Increased exports from Brazil/Colombia pressured prices downward.",
            startYear: 1994,
            endYear: 1995,
            type: "max"
        },
        // New event 4
        {
            title: "1997 Asian Financial Crisis",
            description: "Currency collapse in key robusta consumers (Indonesia/Thailand) slashed demand. Vietnam's rising output intensified oversupply.",
            startYear: 1997,
            endYear: 1997,
            type: "max"
        },
        // Existing 2002 event
        {
            title: "Vietnam’s Coffee Boom",
            description: "Vietnam’s rapid robusta production surge flooded markets, driving prices to a historic low ($0.42).",
            startYear: 2000,
            endYear: 2003,
            type: "min"
        },
        // New event 5
        {
            title: "2022 Post-Pandemic Surge & Climate Shocks",
            description: "Global reopening spiked demand while Brazilian droughts (2021-2022) and Russia-Ukraine war fertilizer shortages strained supply.",
            startYear: 2022,
            endYear: 2022,
            type: "max"
        },
        {
            title: "Brazilian Frost",
            description: "Severe frost in Brazil destroyed coffee crops, causing global supply shortages and price spikes.",
            startYear: 1977,
            endYear: 1978,
            type: "max"
        },
        {
            title: "Market Instability",
            description: "Price volatility from Central American droughts, African political conflicts, and dissolution of global coffee quotas (1989).",
            startYear: 1980,
            endYear: 1992,
            type: "min"
        },
        {
            title: "Vietnam’s Coffee Boom",
            description: "Vietnam’s rapid robusta production surge flooded markets, driving prices to a historic low ($0.42).",
            startYear: 2002,
            endYear: 2002,
            type: "min"
        },
        {
            title: "Colombian Crop Failure & Demand Surge",
            description: "Heavy rains and disease slashed Colombia’s output; rising demand from China/India and post-2008 commodity speculation fueled highs.",
            startYear: 2010,
            endYear: 2011,
            type: "max"
        },
        {
            title: "Central American Leaf Rust Crisis",
            description: "Coffee leaf rust fungus decimated 50% of Central America’s crops, crippling exports and quality.",
            startYear: 2014,
            endYear: 2015,
            type: "max"
        },
        {
            title: "Brazilian Drought Recovery",
            description: "Post-drought production delays in Brazil and booming global café culture reversed price declines.",
            startYear: 2016,
            endYear: 2017,
            type: "max"
        },
        {
            title: "Climate-Pandemic-Demand Triple Shock",
            description: "Droughts/hurricanes disrupted Brazilian/Central American harvests; post-COVID demand spikes, supply-chain bottlenecks, and eco-certification costs pushed prices to $4.34.",
            startYear: 2020,
            endYear: 2025,
            type: "max"
        }
    ];

    events.forEach(event => {
        const startDate = new Date(event.startYear, 0, 1);
        const endDate = new Date(event.endYear, 11, 31);
        const eventData = data.filter(d => d.date >= startDate && d.date <= endDate);
        if (eventData.length === 0) return;

        let extremeData;
        if (event.type === 'max') {
            const maxPrice = d3.max(eventData, d => d.price);
            extremeData = eventData.find(d => d.price === maxPrice);
        } else {
            const minPrice = d3.min(eventData, d => d.price);
            extremeData = eventData.find(d => d.price === minPrice);
        }

        if (!extremeData) return;

        g.append('circle')
            .attr('cx', xScale(extremeData.date))
            .attr('cy', yScale(extremeData.price))
            .attr('r', 4)
            .style('fill', event.type === 'max' ? '#FB313C' : '#1FA764')
            .style('opacity', 0.8)
            .datum(event)
            .on('mouseover', function(event, d) {
                hoverLine.style('opacity', 0);
                hoverPoint.style('opacity', 0);
                d3.select(this).style('opacity', 1);
                tooltip.html(`
                    <div style="font-weight: bold; margin-bottom: 4px;">${d.title}</div>
                    <div style="font-size: 0.9em;">${d.description}</div>
                `).style('left', `${event.pageX + 12}px`)
                   .style('top', `${event.pageY - 40}px`)
                   .style('opacity', 1);
            })
            .on('mousemove', function(event) {
                tooltip.style('left', `${event.pageX + 12}px`)
                      .style('top', `${event.pageY - 40}px`);
            })
            .on('mouseout', function() {
                d3.select(this).style('opacity', 0.8);
                tooltip.style('opacity', 0);
            });
    });
}