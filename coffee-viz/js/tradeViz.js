// Trade visualization
function initializeTradeViz(data) {
    if (!data || data.length === 0) {
        console.error('No trade data available');
        return;
    }

    // TODO: width & height should be dynamically updated!
    const width = document.getElementById('trade-viz').clientWidth;
    const height = width * 0.65;
    const map_scale_factor = (width - 3) / (2 * Math.PI)
    const map_translate_factor = [width / 2, height / 1.6]
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Create SVG
    const svg = d3.select('#trade-viz')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'trade-viz-svg');

    // Create map projection
    const projection = d3.geoMercator()
        .scale(map_scale_factor)
        .translate(map_translate_factor);

    const path = d3.geoPath()
        .projection(projection);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // Load world map data
    d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
        .then(world => {
            // Draw base map
            svg.append('g')
                .attr('id', 'trade-viz-svg-g')
                .selectAll('path')
                .data(topojson.feature(world, world.objects.countries).features)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('d', path)
                .attr('fill', '#e0e0e0'); // Default fill color for countries

            // Process trade data for the latest year
            const latestYear = d3.max(data, d => d.year);
            const tradeFlows = data.filter(d => d.year === latestYear);

            // Create trade flow lines
            const lines = svg.selectAll('path.trade-flow')
                .data(tradeFlows)
                .enter()
                .append('path')
                .attr('class', 'trade-flow')
                .attr('d', d => {
                    const source = getCountryCoordinates(d.exporter);
                    const target = getCountryCoordinates(d.importer);
                    if (!source || !target) return null;

                    const sourcePos = projection(source);
                    const targetPos = projection(target);

                    // Create curved path
                    const dx = targetPos[0] - sourcePos[0];
                    const dy = targetPos[1] - sourcePos[1];
                    const dr = Math.sqrt(dx * dx + dy * dy);

                    return `M${sourcePos[0]},${sourcePos[1]}A${dr},${dr} 0 0,1 ${targetPos[0]},${targetPos[1]}`;
                })
                .style('stroke', d => getTradeValueColor(d.value))
                .style('stroke-width', d => getTradeValueWidth(d.value));

            // Add interactions
            lines.on('mouseover', function(event, d) {
                d3.select(this)
                    .style('stroke-opacity', 1)
                    .style('stroke-width', d => getTradeValueWidth(d.value) * 1.5);

                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);

                tooltip.html(`
                    <strong>Trade Flow</strong><br/>
                    From: ${d.exporter}<br/>
                    To: ${d.importer}<br/>
                    Value: $${formatValue(d.value)}<br/>
                    Weight: ${formatWeight(d.weight)} tons
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('stroke-opacity', 0.6)
                    .style('stroke-width', d => getTradeValueWidth(d.value));

                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

            // Add legend
            addTradeLegend(svg, width);
        });
}

// Helper functions
function getCountryCoordinates(countryName) {
    // Normalize country name
    const normalizedName = countryName.trim()
        .replace(/\s+/g, ' ')
        .replace(/^The\s+/i, '')
        .replace(/\s*\([^)]*\)/g, '');

    const coordinates = {
        // Major Coffee Producers
        'Brazil': [-51.9253, -14.2350],
        'Vietnam': [108.2772, 14.0583],
        'Colombia': [-74.2973, 4.5709],
        'Indonesia': [113.9213, -0.7893],
        'Ethiopia': [40.4897, 9.1450],
        'Honduras': [-86.2419, 15.1994],
        'India': [78.9629, 20.5937],
        'Uganda': [32.2903, 1.3733],
        'Mexico': [-102.5528, 23.6345],
        'Guatemala': [-90.2308, 15.7835],
        'Peru': [-75.0152, -9.1900],
        'Nicaragua': [-85.2072, 12.8654],
        'Costa Rica': [-84.0739, 9.7489],
        'Kenya': [37.9062, -0.0236],
        'Tanzania': [34.8888, -6.3690],
        'Papua New Guinea': [143.9555, -6.3149],
        'El Salvador': [-88.8965, 13.7942],
        'Ecuador': [-78.1834, -1.8312],
        'Laos': [102.4955, 19.8563],
        'Thailand': [100.9925, 15.8700],
        
        // Major Importers
        'United States': [-95.7129, 37.0902],
        'Germany': [10.4515, 51.1657],
        'Italy': [12.5674, 41.8719],
        'Japan': [138.2529, 36.2048],
        'Belgium': [4.4699, 50.5039],
        'Spain': [-3.7492, 40.4637],
        'France': [2.2137, 46.2276],
        'Netherlands': [5.2913, 52.1326],
        'United Kingdom': [-3.4359, 55.3781],
        'Switzerland': [8.2275, 46.8182],
        'Canada': [-106.3468, 56.1304],
        'Russia': [105.3188, 61.5240],
        'South Korea': [127.7669, 35.9078],
        'Poland': [19.1451, 51.9194],
        'Austria': [14.5501, 47.5162],
        'Sweden': [18.6435, 60.1282],
        'Australia': [133.7751, -25.2744],
        'Denmark': [9.5018, 56.2639],
        'Portugal': [-8.2245, 39.3999],
        'Finland': [25.7482, 61.9241],
        'Greece': [21.8243, 39.0742],
        'Ireland': [-8.2439, 53.4129],
        'Romania': [24.9668, 45.9432],
        'Czech Republic': [15.4730, 49.8175],
        'Slovakia': [19.6990, 48.6690],
        'Norway': [8.4689, 60.4720],
        'China': [104.1954, 35.8617],
        'Malaysia': [101.9758, 4.2105],
        'Singapore': [103.8198, 1.3521],
        'Taiwan': [120.9605, 23.6978],
        'Hong Kong': [114.1095, 22.3964],
        'New Zealand': [174.8860, -40.9006],
        'Israel': [34.8516, 31.0461],
        'South Africa': [22.9375, -30.5595],
        'Morocco': [-7.0926, 31.7917],
        'Algeria': [1.6596, 28.0339],
        'Egypt': [30.8025, 26.8206],
        'Saudi Arabia': [45.0792, 23.8859],
        'UAE': [53.8478, 23.4241],
        'Turkey': [35.2433, 38.9637],
        'Ukraine': [31.1656, 48.3794],
        'Argentina': [-63.6167, -38.4161],
        'Chile': [-71.5430, -35.6751],
        'Uruguay': [-55.7658, -32.5228],
        'Philippines': [121.7740, 12.8797],
        'Cambodia': [104.9910, 12.5657],
        'Myanmar': [95.9560, 21.9162],
        'Bangladesh': [90.3563, 23.6850],
        'Sri Lanka': [80.7718, 7.8731],
        'Nepal': [84.1240, 28.3949],
        'Yemen': [48.5164, 15.5527],
        'Ivory Coast': [-5.5471, 7.5400],
        'Ghana': [-1.0232, 7.9465],
        'Nigeria': [8.6753, 9.0820],
        'Cameroon': [12.3547, 7.3697],
        'Rwanda': [29.8739, -1.9403],
        'Burundi': [29.9189, -3.3731],
        'Congo': [15.8277, -0.2280],
        'Angola': [17.8739, -11.2027]
    };
    
    // Try exact match first
    if (coordinates[normalizedName]) {
        return coordinates[normalizedName];
    }
    
    // Try case-insensitive match
    const lowercaseName = normalizedName.toLowerCase();
    const match = Object.keys(coordinates).find(key => 
        key.toLowerCase() === lowercaseName
    );
    
    return match ? coordinates[match] : null;
}

function getTradeValueColor(value) {
    const colorScale = d3.scaleSequential()
        .domain([0, 1e9])
        .interpolator(d3.interpolateBlues);
    return colorScale(value);
}

function getTradeValueWidth(value) {
    return d3.scaleLinear()
        .domain([0, 1e9])
        .range([1, 10])(value);
}

function formatValue(value) {
    return d3.format(',.0f')(value);
}

function formatWeight(weight) {
    return d3.format(',.0f')(weight);
}

function addTradeLegend(svg, width) {
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 150}, 20)`);

    const valueRanges = [1e8, 5e8, 1e9];
    
    legend.selectAll('line')
        .data(valueRanges)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', (d, i) => i * 25)
        .attr('y2', (d, i) => i * 25)
        .style('stroke', d => getTradeValueColor(d))
        .style('stroke-width', d => getTradeValueWidth(d));

    legend.selectAll('text')
        .data(valueRanges)
        .enter()
        .append('text')
        .attr('x', 25)
        .attr('y', (d, i) => i * 25 + 4)
        .text(d => `$${d3.format('.0s')(d)}`);
} 



