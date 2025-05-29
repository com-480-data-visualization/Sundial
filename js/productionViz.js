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

    let excludedCountries = [];
    const reversedCountries = [...topCountries].reverse();

    // Calculate annual data with rest of world
    const years = Array.from(new Set(data.map(d => d.year))).sort();
    let annualData = years.map(year => {
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

    // Create scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, 200000])
        .range([height - margin.bottom, margin.top]);

    // Color scale with brand colors
    const colorScale = d3.scaleOrdinal()
        .domain([...topCountries, 'Rest of World'])
        .range([
            '#00865A', '#0171BC', '#FDCD01', '#E54E26',
            '#008BAC', '#93D500', '#BC1B8D', '#88A6CA',
            '#503795', '#3AB54B', '#DCDEE1'
        ]);

    // Stack generator
    let stack = d3.stack()
        .keys(['Rest of World', ...reversedCountries])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    // Area generator
    const area = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveMonotoneX);

    // Draw initial chart
    let stackedData = stack(annualData);
    svg.selectAll('path')
        .data(stackedData)
        .enter().append('path')
        .attr('fill', d => colorScale(d.key))
        .attr('d', area);

    // Hover interaction
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
        .on('mousemove', function(event) {
            const [x] = d3.pointer(event);
            const year = Math.round(xScale.invert(x));
            const closest = annualData.find(d => d.year === year);
            
            if (!closest) return;

            // Update hover line
            hoverLine.attr('x1', xScale(year))
                    .attr('x2', xScale(year))
                    .style('display', null);

            // Remove previous circles
            svg.selectAll('.hover-circle').remove();

            // Create new interaction circles
            let totalProduction = 0;
            const activeCountries = [...topCountries, 'Rest of World']
                .filter(c => !excludedCountries.includes(c));

            activeCountries.forEach(country => {
                const production = closest[country];
                totalProduction += production;
                
                // Find y-position based on stack height
                const stackLayer = stackedData.find(d => d.key === country);
                if (stackLayer) {
                    const stackValue = stackLayer.find(d => d.data.year === year);
                    const yPos = yScale(stackValue[1]);

                    svg.append('circle')
                        .attr('class', 'hover-circle')
                        .attr('cx', xScale(year))
                        .attr('cy', yPos)
                        .attr('r', 4)
                        .attr('fill', colorScale(country))
                        .attr('stroke', '#000')
                        .attr('stroke-width', 1);
                }
            });

            // Update tooltip
            tooltip.style('display', 'block')
                .html(`
                    <div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">
                        Marketing Year ${year}
                    </div>
                    ${activeCountries.map(country => `
                        <div style="display: flex; align-items: center; margin: 3px 0;">
                            <div style="width: 14px; height: 14px; background: ${colorScale(country)}; 
                                 border: 1px solid #000; margin-right: 8px;"></div>
                            <div style="flex: 1; margin-right: 20px;">${country}</div>
                            <div style="font-weight: 500;">${Math.round(closest[country]/1000)}M</div>
                        </div>
                    `).join('')}
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
                        Total: ${Math.round(totalProduction/1000)}M
                    </div>
                `)
                .style('left', `${x + 20}px`)
                .style('top', `${margin.top}px`);
        })
        .on('mouseout', () => {
            hoverLine.style('display', 'none');
            tooltip.style('display', 'none');
            svg.selectAll('.hover-circle').remove();
        });

    // Axes and Grid Lines
    // X-axis with black line
    svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
        .call(g => g.select('.domain')
            .attr('stroke', '#000')
            .attr('stroke-width', 1))
        .call(g => g.selectAll('.tick line').remove());

    // Y-axis with light grey line
    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale)
            .tickValues([50000, 100000, 150000])
            .tickFormat(d => `${d3.format(".0f")(d/1000)}M`)
        )
        .call(g => g.select('.domain')
            .attr('stroke', '#ddd')
            .attr('stroke-width', 1))
        .call(g => g.selectAll('.tick line').remove());

    // Horizontal grid lines
    [50000, 100000, 150000].forEach(value => {
        svg.append('line')
            .attr('x1', margin.left)
            .attr('x2', width - margin.right)
            .attr('y1', yScale(value))
            .attr('y2', yScale(value))
            .attr('stroke', '#eee')
            .attr('stroke-width', 1)
            .lower();
    });

    // Updated legend with better spacing and vertical alignment
    const legend = svg.append('g')
    .attr('transform', `translate(${margin.left},${height - margin.bottom + 40})`)
    .selectAll('g')
    .data([...topCountries, 'Rest of World'])
    .enter().append('g')
    .attr('transform', (d, i) => `translate(${i * 108}, 0)`)  // Reduced gap between tags
    .style('cursor', 'pointer')
    .on('click', function(event, d) {
        excludedCountries = excludedCountries.includes(d) 
            ? excludedCountries.filter(c => c !== d)
            : [...excludedCountries, d];
        updateChart();
        updateLegend();
    });

    // Color boxes centered vertically
    legend.append('rect')
    .attr('width', 12)
    .attr('height', 12)
    .attr('y', 0)
    .attr('fill', d => colorScale(d));

    // Country names aligned with color boxes
    const legendText = legend.append('text')
    .attr('x', 18)
    .attr('y', 6)  // Vertically centered alignment
    .attr('dy', '0.35em')  // Fine-tuned vertical positioning
    .style('font-size', '12px')
    .text(d => d);

    // Strike-through lines aligned with text
    legend.append('line')
    .attr('x1', -4)
    .attr('x2', d => d.length * 6 + 20)
    .attr('y1', 6)
    .attr('y2', 6)
    .attr('stroke', '#999')
    .attr('stroke-width', 1)
    .style('opacity', 0);

    function updateChart() {
        const activeCountries = [...topCountries, 'Rest of World'].filter(c => !excludedCountries.includes(c));
        
        // Corrected stack key handling
        const countriesWithoutRoW = activeCountries.filter(c => c !== 'Rest of World');
        const reversedActive = countriesWithoutRoW.reverse();
        
        // Only include 'Rest of World' if it's still active
        const stackKeys = activeCountries.includes('Rest of World') 
            ? ['Rest of World', ...reversedActive] 
            : [...reversedActive];
    
        stack.keys(stackKeys);
        stackedData = stack(annualData);
    
        svg.selectAll('path')
            .data(stackedData)
            .join('path')
            .attr('fill', d => colorScale(d.key))
            .transition().duration(300)
            .attr('d', area);
    }

    function updateLegend() {
        legend.selectAll('line')
            .style('opacity', d => excludedCountries.includes(d) ? 1 : 0);
        
        legendText
            .style('fill', d => excludedCountries.includes(d) ? '#999' : '#000');
    }

    // Y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height/2)
        .attr('y', margin.left - 45)
        .style('text-anchor', 'middle')
        .style('font-size', '13px')
        .text('60 KG BAGS');
}