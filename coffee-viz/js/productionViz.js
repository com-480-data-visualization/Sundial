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

    // Create reversed copy for stack order
    const reversedCountries = [...topCountries].reverse();

    // Calculate annual data with rest of world
    const years = Array.from(new Set(data.map(d => d.year))).sort();
    const annualData = years.map(year => {
        const yearData = { year };
        let total = 0;
        
        topCountries.forEach(country => {
            const prod = data.find(d => d.year === year && d.country === country)?.production || 0;
            yearData[country] = prod;
            total += prod;
        });
        
        const worldTotal = d3.sum(data.filter(d => d.year === year), d => d.production);
        yearData['Rest of World'] = worldTotal - total;
        return yearData;
    });

    // Setup dimensions
    const container = document.getElementById('production-viz');
    const width = container.clientWidth;
    const height = 500;
    const margin = { top: 40, right: 30, bottom: 100, left: 60 };

    // Create SVG
    const svg = d3.select(container)
        .html('')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Create tooltip
    const tooltip = d3.select(container)
        .append('div')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('padding', '15px')
        .style('border', '2px solid #eee')
        .style('border-radius', '5px')
        .style('font', '12px sans-serif')
        .style('pointer-events', 'none')
        .style('display', 'none');

// Create scales with extended y-domain
    const xScale = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, 200000]) // Extended to 200M
        .range([height - margin.bottom, margin.top]);

    // Updated color scheme
    const colorScale = d3.scaleOrdinal()
        .domain([...topCountries, 'Rest of World'])
        .range([
            '#00865A', // Brazil
            '#0171BC', // Vietnam
            '#FDCD01', // Colombia
            '#E54E26', // Indonesia
            '#008BAC', // Ethiopia
            '#93D500', // Honduras
            '#BC1B8D', // India
            '#88A6CA', // Uganda
            '#503795', // Peru
            '#3AB54B', // Mexico
            '#DCDEE1'  // Rest of World
        ]);

    // Create stack generator with reversed order
    const stack = d3.stack()
        .keys(['Rest of World', ...reversedCountries])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const stackedData = stack(annualData);

    // Create area generator
    const area = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveMonotoneX);

    // Draw areas
    svg.selectAll('path')
        .data(stackedData)
        .enter().append('path')
        .attr('fill', d => colorScale(d.key))
        .attr('d', area);
    
    // Update y-axis with original tick values
    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale)
            .tickValues([50000, 100000, 150000]) // Maintain original ticks
            .tickFormat(d => `${d3.format(".0f")(d/1000)}M`)
        )
        .call(g => g.select('.domain').remove());

    // Add hover interaction
    const hoverLine = svg.append('line')
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom)
        .style('display', 'none');

    svg.append('rect')
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .attr('width', width)
        .attr('height', height)
        .on('mousemove', (event) => {
            const [x] = d3.pointer(event);
            const year = Math.round(xScale.invert(x));
            const closest = annualData.find(d => d.year === year);
            
            if (!closest) return;

            hoverLine.attr('x1', xScale(year)).attr('x2', xScale(year)).style('display', null);
            
            tooltip.style('display', 'block')
                .html(`
                    <div style="margin-bottom: 8px; font-weight: bold">Marketing Year ${year}</div>
                    ${[...topCountries, 'Rest of World'].map(country => `
                        <div style="display: flex; align-items: center; margin: 2px 0">
                            <div style="width: 12px; height: 12px; background: ${colorScale(country)}; margin-right: 8px"></div>
                            <div style="flex: 1">${country}</div>
                            <div>${Math.round(closest[country]/1000)}M</div>
                        </div>
                    `).join('')}
                `)
                .style('left', `${x + 20}px`)
                .style('top', `${margin.top}px`);
        })
        .on('mouseout', () => {
            hoverLine.style('display', 'none');
            tooltip.style('display', 'none');
        });

    // Add x-axis with year labels
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('d'))
        .tickSizeOuter(0);

    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(xAxis)
        .call(g => g.select('.domain').remove());

    // Add color legend below x-axis
    const legend = svg.append('g')
        .attr('transform', `translate(${margin.left},${height - margin.bottom + 40})`)
        .selectAll('g')
        .data([...topCountries, 'Rest of World'])
        .enter().append('g')
        .attr('transform', (d, i) => `translate(${i * 120}, 0)`);

    legend.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d => colorScale(d));

    legend.append('text')
        .attr('x', 18)
        .attr('y', 9)
        .attr('dy', '0.32em')
        .style('font-size', '13px')
        .text(d => d);

    // Add y-axis
    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale)
            .tickValues([50000, 100000, 150000])
            .tickFormat(d => `${d3.format(".0f")(d/1000)}M`)
        )
        .call(g => g.select('.domain').remove());

    // Add y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height/2)
        .attr('y', margin.left - 45)
        .style('text-anchor', 'middle')
        .style('font-size', '13px')
        .text('60 KG BAGS');
}