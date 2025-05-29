var showExporters = false;
var hoveredCountry = null;
var hoveredArrowCountries = [null, null];
var hoverlessShowCount = 2;
var hoveredShowCount = 10;

// Trade visualization
function initializeTradeViz(data, year) {
    if (!data || data.length === 0) {
        console.error('No trade data available');
        return;
    }

    // Check import / export mode
    const button = document.querySelector('#import_export_buttons .selected');
    if (!button) {
        console.error('No button selected');
        return;
    }

    switch (button.id) {
        case "display_import":
            showExporters = false;
            console.log("Display Importers Selected");
            break;
        case "display_export":
            showExporters = true;
            console.log("Display Exporters Selected");
            break;
        default:
            console.error("Unknown button selected:", button.id);
            return;
    }

    // Reset hoveredCountry & hoveredArrowCountries
    hoveredCountry = null;
    hoveredArrowCountries = [null, null];

    // TODO: width & height should be dynamically updated!
    const width = document.getElementById('trade-viz').clientWidth;
    const height = width * 0.65;
    const map_scale_factor = (width - 3) / (2 * Math.PI)
    const map_translate_factor = [width / 2, height / 1.6]
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Select existing SVG or create a new one
    var svg = d3.select('#trade-viz-svg');
    if (svg.empty()) {
        svg = d3.select('#trade-viz')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('id', 'trade-viz-svg');
    }

    // Create map projection
    const projection = d3.geoMercator()
        .scale(map_scale_factor)
        .translate(map_translate_factor);

    const path = d3.geoPath()
        .projection(projection);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .attr('id', 'trade-tooltip')
        .style('opacity', 0);

    // Load world map data
    d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
        .then(world => {
            const tradeFlows = data.filter(d => d.year === year);
            console.log('Trade data for Year:', year, tradeFlows);
            // console.log('Trade Flows for Year:', year, tradeFlows);

            let result = drawMap(world, projection, path, tradeFlows);
            // console.log('Map Draw Result:', result);

            const topTrades = getTrades(hoveredCountry, tradeFlows, showExporters, hoverlessShowCount);
            // console.log('Top Trades:', topTrades);

            const maxTradeValue = d3.max(topTrades, d => d3.max(d.destinations, e => e[1]));
            // console.log('Max Trade Value:', maxTradeValue);

            const allFlows = getFlows(topTrades, showExporters);
            // console.log('All Flows:', allFlows);

            getTradeArrows(allFlows, tradeFlows, maxTradeValue, projection, showExporters)

            // Add legend
            addTradeLegend(svg, width);
        });
}


function drawMap(world, projection, contours, tradeFlows) {
    // tooltip = d3.select(.tooltip#trade-tooltip);
    const svg = d3.select('#trade-viz-svg');
    svg.append('g')
        .attr('id', 'trade-viz-svg-g')
        .selectAll('path')
        .data(topojson.feature(world, world.objects.countries).features)
        .enter()
        .append('path')
        .attr('class', 'country')   
        .attr('d', contours)
        .attr('stroke', '#ffffff') // Default fill color for countries
        .attr('stroke-width', 0.5)
        .attr('stroke-opacity', 0.5)
        .attr('fill', '#e0e0e0') // Default fill color for countries
        .on('mouseover', function(event, d) {
            d3.select(this)
                .style('fill', "c0c0c0");
            hoveredCountry = d.properties.name;
            hoveredArrowCountries = [null, null];
            console.log("Hovered Country:", hoveredCountry);
            console.log("Hovered Arrow Countries:", hoveredArrowCountries);

            const topTrades = getTrades(hoveredCountry, tradeFlows, showExporters, hoveredShowCount);
            const maxTradeValue = d3.max(topTrades, d => d3.max(d.destinations, e => e[1]));
            const allFlows = getFlows(topTrades, showExporters);
            getTradeArrows(allFlows, tradeFlows, maxTradeValue, projection, showExporters)

            
            // Update tooltip with country name
            // tooltip = d3.select(.tooltip#trade-tooltip);
            // tooltip.transition()
            //     .duration(200)
            //     .style('opacity', .9);
            // getTradeArrows(allFlows, tradeFlows, maxTradeValue, projection, showExporters)
            // tooltip.html(`
            //     <strong>Trade Flow</strong><br/>
            //     From: ${showExporters ? d.exporter : d.importer}<br/>
            //     To: ${showExporters ? d.importer : d.exporter}<br/>
            //     Value: $${formatValue(d.value)}<br/>
            // `)
            // .style('left', (event.pageX + 10) + 'px')
            // .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            // d3.select(this)
            //     .style('stroke-opacity', 0.6);
            
            if (!hoveredCountry in hoveredArrowCountries) {
                console.log("Hovered Country Reset:", hoveredCountry);
                hoveredCountry = null;
            }

            const topTrades = getTrades(hoveredCountry, tradeFlows, showExporters, hoveredShowCount);
            const maxTradeValue = d3.max(topTrades, d => d3.max(d.destinations, e => e[1]));
            const allFlows = getFlows(topTrades, showExporters);
            getTradeArrows(allFlows, tradeFlows, maxTradeValue, projection, showExporters)

            // tooltip.transition()
            // .duration(500)
            // .style('opacity', 0);
        });
    return tradeFlows == null ? "error" : "success";
}


function getTrades(hoveredCountry, tradeFlows, showExporters, showCount = 5) {
    const exporters = d3.rollups(
        tradeFlows, t => d3.sum(t, d => d.value), d => d.exporter, d => d.importer
    ).map(d => ({
        country: d[0], 
        destinations: showCount == "all"
            ? d[1].sort(
                (a, b) => d3.descending(a[1], b[1]) || d3.ascending(a[0], b[0])
            )
            : d[1].sort(
                (a, b) => d3.descending(a[1], b[1]) || d3.ascending(a[0], b[0])
            ).slice(0, showCount)
    })).filter((d, i) => (hoveredCountry == null || hoveredCountry == d.country))

    const importers = d3.rollups(
        tradeFlows, t => d3.sum(t, d => d.value), d => d.importer, d => d.exporter
    ).map(d => ({
        country: d[0],
        destinations: showCount == "all"
            ? d[1].sort(
                (a, b) => d3.descending(a[1], b[1]) || d3.ascending(a[0], b[0])
            )
            : d[1].sort(
                (a, b) => d3.descending(a[1], b[1]) || d3.ascending(a[0], b[0])
            ).slice(0, showCount)
    })).filter((d, i) => (hoveredCountry == null || hoveredCountry == d.country));

    console.log('Exporters:', exporters);
    console.log('Importers:', importers);
    console.log('Show Exporters:', showExporters);
    return showExporters ? exporters : importers;
}

function getFlows(topTrades, showExporters) {
    const allFlows = [];
    topTrades.forEach(trader => {
        const source = getCountryCoordinates(trader.country);
        if (!source) return;
        trader.destinations.forEach(t => {
            const d = t[0];
            const value = t[1];
            const target = getCountryCoordinates(d);
            if (!target) return;
            allFlows.push({
                source: (showExporters && [source[1], source[0]] || [target[1], target[0]]),
                target: (showExporters && [target[1], target[0]] || [source[1], source[0]]),
                value: value,
                exporter: (showExporters && trader.country || d),
                importer: (showExporters && d || trader.country)
            });
        });
    });
    return allFlows;
}


function getTradeArrows(allFlows, tradeFlows, maxTradeValue, projection, showExporters) {
    const svg = d3.select('#trade-viz-svg')
    // Clear arrows
    svg.selectAll('.trade-flow-group').remove();

    // Rebuild arrows
    allFlows.forEach(d => {
        const groupSvg = svg.append('svg')
            .attr('class', 'trade-flow-group')
            .attr('overflow', 'visible');

        // Add marker definition for each group
        const defs = groupSvg.append('defs');
        defs.append('marker')
            .attr('id', `triangle-${d.exporter.replace(/\s/g, '')}-${d.importer.replace(/\s/g, '')}`)
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 5)
            .attr('refY', 5)
            .attr('markerUnits', "strokeWidth")
            .attr('markerWidth', 2)
            .attr('markerHeight', 2)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M 0 0 L 10 5 L 0 10 z')
            .style('fill', getTradeValueColor(d.value, maxTradeValue))
            .style('fill-opacity', 1);

        // Draw the trade flow path
        const sourcePos = projection(d.source);
        const targetPos = projection(d.target);
        const dx = targetPos[0] - sourcePos[0];
        const dy = targetPos[1] - sourcePos[1];
        const dr = Math.sqrt(dx * dx + dy * dy);

        groupSvg.append('path')
            .attr('class', 'trade-flow')
            .attr('d', `M${sourcePos[0]},${sourcePos[1]}A${dr},${dr} 0 0,1 ${targetPos[0]},${targetPos[1]}`)
            .style('stroke', getTradeValueColor(d.value, maxTradeValue))
            .style('stroke-width', getTradeValueWidth(d.value, maxTradeValue))
            .style('stroke-linecap', 'round')
            .style('stroke-opacity', 0.6)
            .style('marker-end', `url(#triangle-${d.exporter.replace(/\s/g, '')}-${d.importer.replace(/\s/g, '')})`)
            .style('fill', 'none')
            .on('mouseover', function(event) {
                hoveredArrowCountries = [d.exporter, d.importer];
                console.log("Hovered Arrow Countries:", hoveredArrowCountries);

                d3.select(this)
                    .style('stroke-opacity', 1);

                tooltip = d3.selectAll(".tooltip#trade-tooltip")
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);

                tooltip.html(`
                    <strong>Trade Flow</strong><br/>
                    From: ${showExporters ? d.exporter : d.importer}<br/>
                    To: ${showExporters ? d.importer : d.exporter}<br/>
                    Value: ${formatValue(d.value)} USD<br/>
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                hoveredArrowCountries = [null, null];
                console.log("Hovered Arrow Countries Reset:", hoveredArrowCountries);
                
                // const topTrades = getTrades(hoveredCountry, tradeFlows, showExporters, hoverlessShowCount);
                // const maxTradeValue = d3.max(topTrades, d => d3.max(d.destinations, e => e[1]));
                // const allFlows = getFlows(topTrades, showExporters);
                // getTradeArrows(allFlows, tradeFlows, maxTradeValue, projection, showExporters)

                d3.select(this)
                    .style('stroke-opacity', 0.6);

                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    });
}

// Helper functions
function getCountryCoordinates(countryName) {
    const coordinates = getCoordinates();
    if (coordinates[countryName]) return coordinates[countryName]

    // Normalize country name
    const normalizedName = countryName.trim()
        .replace(/\s+/g, ' ')
        .replace(/^The\s+/i, '')
        .replace(/\s*\([^)]*\)/g, '');
        
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

function getTradeValueColor(value, maxValue = 1e8, minValue = 1) {
    // const colorScale = d3.scaleSequential()
    //     .domain([0, maxValue])
    //     .interpolator(d3.interpolateBlues);
    // return colorScale(value);

    // Weighted average for better color distribution
    const v = 0.5 * d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, 1])(value) + 
        0.5 * (
            value < 1 ? 0 : 
            d3.scaleLog()
            .domain([minValue, maxValue])
            .range([0, 1])(value)
        );
    return d3.interpolateBlues(v);
}

function getTradeValueWidth(value, maxValue = 1e8, minValue = 1) {
    // return d3.scaleSequential()
    //     .domain([1, maxValue])
    //     .range([2, 10])(value);

    // Weighted average for better width distribution
    return (0.8 * d3.scaleLinear()
        .domain([0, maxValue])
        .range([1, 10])(value) +
        0.2 * (
            value < 1 ? 0 : 
            d3.scaleLog()
            .domain([minValue, maxValue])
            .range([1, 10])(value)
        ));
}

function formatValue(value) {
    return value > 1000 ? 
        d3.format(',.2f')(value/1000) + 'M' : 
        value > 1 ? 
        d3.format('.2f')(value) + 'K' : 
        d3.format('.1f')(value * 1000);
}

function formatWeight(weight) {
    return d3.format(',.0f')(weight);
}

function addTradeLegend(svg, width, maxValue = 1e8) {
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 150}, 20)`);

    const valueRanges = [maxValue * 0.01, maxValue * 0.1, maxValue];
    
    legend.selectAll('line')
        .data(valueRanges)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', (d, i) => i * 25)
        .attr('y2', (d, i) => i * 25)
        .style('stroke', d => getTradeValueColor(d, maxValue))
        .style('stroke-width', d => getTradeValueWidth(d, maxValue));

    legend.selectAll('text')
        .data(valueRanges)
        .enter()
        .append('text')
        .attr('x', 25)
        .attr('y', (d, i) => i * 25 + 4)
        .text(d => `$${d3.format('.0s')(d)}`);
} 



function refresh() {
    const width = document.getElementById('trade-viz').clientWidth;
    const height = width * 0.65;
    const map_scale_factor = (width - 3) / (2 * Math.PI)
    const map_translate_factor = [width / 2, height / 1.6]

    const svg = d3.select('#trade-viz-svg')
        .attr('width', width)
        .attr('height', height)

    const projection = d3.geoMercator()
        .scale(map_scale_factor)
        .translate(map_translate_factor);

    const path = d3.geoPath()
        .projection(projection);
}


function getCoordinates() {
  return {
  "Afghanistan": [
    33.93911,
    67.709953
  ],
  "Albania": [
    41.153332,
    20.168331
  ],
  "Algeria": [
    28.033886,
    1.659626
  ],
  "American Samoa": [
    -14.270972,
    -170.132217
  ],
  "Andorra": [
    42.546245,
    1.601554
  ],
  "Angola": [
    -11.202692,
    17.873887
  ],
  "Anguilla": [
    18.220554,
    -63.068615
  ],
  "Antarctica": [
    -82.862751,
    135.0
  ],
  "Antigua and Barbuda": [
    17.060816,
    -61.796428
  ],
//   "Areas, nes": [
//     0.0,
//     0.0
//   ],
  "Argentina": [
    -38.416097,
    -63.616672
  ],
  "Armenia": [
    40.069099,
    45.038189
  ],
  "Aruba": [
    12.52111,
    -69.968338
  ],
  "Australia": [
    -25.274398,
    133.775136
  ],
  "Austria": [
    47.516231,
    14.550072
  ],
  "Azerbaijan": [
    40.143105,
    47.576927
  ],
  "Bahamas": [
    25.03428,
    -77.39628
  ],
  "Bahrain": [
    25.930414,
    50.637772
  ],
  "Bangladesh": [
    23.685,
    90.356331
  ],
  "Barbados": [
    13.193887,
    -59.543198
  ],
  "Belarus": [
    53.709807,
    27.953389
  ],
  "Belgium": [
    50.503887,
    4.469936
  ],
  "Belize": [
    17.189877,
    -88.49765
  ],
  "Benin": [
    9.30769,
    2.315834
  ],
  "Bermuda": [
    32.321384,
    -64.75737
  ],
  "Bhutan": [
    27.514162,
    90.433601
  ],
  "Bolivia": [
    -16.290154,
    -63.588653
  ],
  "Bonaire": [
    12.178361,
    -68.238534
  ],
  "Bosnia Herzegovina": [
    43.915886,
    17.679076
  ],
  "Botswana": [
    -22.328474,
    24.684866
  ],
  "Bouvet Island": [
    -54.42,
    3.38
  ],
  "Brazil": [
    -14.235004,
    -51.92528
  ],
  "British Indian Ocean Territory": [
    -6.343194,
    71.876519
  ],
  "British Virgin Islands": [
    18.420695,
    -64.639968
  ],
  "Brunei Darussalam": [
    4.535277,
    114.727669
  ],
  "Bulgaria": [
    42.733883,
    25.48583
  ],
  "Bunkers": [
    0,
    0
  ],
  "Burkina Faso": [
    12.238333,
    -1.561593
  ],
  "Burundi": [
    -3.373056,
    29.918886
  ],
  "Cabo Verde": [
    16.002082,
    -24.013197
  ],
  "Cambodia": [
    12.565679,
    104.990963
  ],
  "Cameroon": [
    7.369722,
    12.354722
  ],
  "Canada": [
    56.130366,
    -106.346771
  ],
  "Cayman Islands": [
    19.3133,
    -81.2546
  ],
  "Central African Rep.": [
    6.611111,
    20.939444
  ],
  "Chad": [
    15.454166,
    18.732207
  ],
  "Chile": [
    -35.675147,
    -71.542969
  ],
  "China": [
    35.86166,
    104.195397
  ],
  "China, Hong Kong SAR": [
    22.396428,
    114.109497
  ],
  "China, Macao SAR": [
    22.198745,
    113.543873
  ],
  "Christmas Islands": [
    -10.447525,
    105.690449
  ],
  "Cocos Islands": [
    -12.164165,
    96.870956
  ],
  "Colombia": [
    4.570868,
    -74.297333
  ],
  "Comoros": [
    -11.875001,
    43.872219
  ],
  "Dem. Rep. Congo": [
    -4.038333,
    21.758664
  ],
  "Congo": [
    -0.228021,
    15.827659
  ],
  "Cook Islands": [
    -21.236736,
    -159.777671
  ],
  "Costa Rica": [
    9.748917,
    -83.753428
  ],
  "Côte d'Ivoire": [
    7.539989,
    -5.54708
  ],
  "Croatia": [
    45.1,
    15.2
  ],
  "Cuba": [
    21.521757,
    -77.781167
  ],
  "Curacao": [
    12.16957,
    -68.990021
  ],
  "Cyprus": [
    35.126413,
    33.429859
  ],
  "Czech Republic": [
    49.817492,
    15.472962
  ],
  "Denmark": [
    56.26392,
    9.501785
  ],
  "Djibouti": [
    11.825138,
    42.590275
  ],
  "Dominica": [
    15.414999,
    -61.370976
  ],
  "Dominican Republic": [
    18.735693,
    -70.162651
  ],
  "Ecuador": [
    -1.831239,
    -78.183406
  ],
  "Egypt": [
    26.820553,
    30.802498
  ],
  "El Salvador": [
    13.794185,
    -88.89653
  ],
  "Equatorial Guinea": [
    1.650801,
    10.267895
  ],
  "Eritrea": [
    15.179384,
    39.782334
  ],
  "Estonia": [
    58.595272,
    25.013607
  ],
  "Eswatini": [
    -26.522503,
    31.465866
  ],
  "Ethiopia": [
    9.145,
    40.489673
  ],
  "Faeroe Islands": [
    62.0,
    -6.783333
  ],
  "Falkland Is.": [
    -51.796253,
    -59.523613
  ],
  "Fiji": [
    -17.713371,
    178.065033
  ],
  "Finland": [
    61.92411,
    25.748151
  ],
  "Former Sudan": [
    12.862807,
    30.217636
  ],
  "France": [
    46.603354,
    1.888334
  ],
//   "Free Zones": [
//     0.0,
//     0.0
//   ],
  "French Polynesia": [
    -17.679742,
    -149.406843
  ],
  "French Southern Territories": [
    -49.280366,
    69.348557
  ],
  "Gabon": [
    -0.803689,
    11.609444
  ],
  "Gambia": [
    13.443182,
    -15.310139
  ],
  "Georgia": [
    42.315407,
    43.356892
  ],
  "Germany": [
    51.165691,
    10.451526
  ],
  "Ghana": [
    7.946527,
    -1.023194
  ],
  "Gibraltar": [
    36.140751,
    -5.353585
  ],
  "Greece": [
    39.074208,
    21.824312
  ],
  "Greenland": [
    71.706936,
    -42.604303
  ],
  "Grenada": [
    12.1165,
    -61.679
  ],
  "Guam": [
    13.444304,
    144.793731
  ],
  "Guatemala": [
    15.783471,
    -90.230759
  ],
  "Guinea": [
    9.945587,
    -9.696645
  ],
  "Guinea-Bissau": [
    11.803749,
    -15.180413
  ],
  "Guyana": [
    4.860416,
    -58.93018
  ],
  "Haiti": [
    18.971187,
    -72.285215
  ],
  "Heard Island and McDonald Islands": [
    -53.08181,
    73.504158
  ],
  "Holy See": [
    41.902916,
    12.453389
  ],
  "Honduras": [
    15.199999,
    -86.241905
  ],
  "Hungary": [
    47.162494,
    19.503304
  ],
  "Iceland": [
    64.963051,
    -19.020835
  ],
  "India": [
    20.593684,
    78.96288
  ],
  "Indonesia": [
    -0.789275,
    113.921327
  ],
  "Iran": [
    32.427908,
    53.688046
  ],
  "Iraq": [
    33.223191,
    43.679291
  ],
  "Ireland": [
    53.41291,
    -8.24389
  ],
  "Israel": [
    31.046051,
    34.851612
  ],
  "Italy": [
    41.87194,
    12.56738
  ],
  "Jamaica": [
    18.109581,
    -77.297508
  ],
  "Japan": [
    36.204824,
    138.252924
  ],
  "Jordan": [
    30.585164,
    36.238414
  ],
  "Kazakhstan": [
    48.019573,
    66.923684
  ],
  "Kenya": [
    -1.286389,
    36.817223
  ],
  "Kiribati": [
    -3.370417,
    -168.734039
  ],
  "North Korea": [
    40.339852,
    127.510093
  ],
  "South Korea": [
    35.907757,
    127.766922
  ],
  "Kuwait": [
    29.31166,
    47.481766
  ],
  "Kyrgyzstan": [
    41.20438,
    74.766098
  ],
  "Lao PDR": [
    19.85627,
    102.495496
  ],
  "Latin American Integration Association, nes": [
    -13.235004,
    -50.92528
  ],
  "Latvia": [
    56.879635,
    24.603189
  ],
  "Lebanon": [
    33.854721,
    35.862285
  ],
  "Lesotho": [
    -29.609988,
    28.233608
  ],
  "Liberia": [
    6.428055,
    -9.429499
  ],
  "Libya": [
    26.3351,
    17.228331
  ],
  "Lithuania": [
    55.169438,
    23.881275
  ],
  "Luxembourg": [
    49.815273,
    6.129583
  ],
  "Madagascar": [
    -18.766947,
    46.869107
  ],
  "Malawi": [
    -13.254308,
    34.301525
  ],
  "Malaysia": [
    4.210484,
    101.975766
  ],
  "Maldives": [
    3.202778,
    73.22068
  ],
  "Mali": [
    17.570692,
    -3.996166
  ],
  "Malta": [
    35.937496,
    14.375416
  ],
  "Marshall Islands": [
    7.131474,
    171.184478
  ],
  "Mauritania": [
    21.00789,
    -10.940835
  ],
  "Mauritius": [
    -20.348404,
    57.552152
  ],
  "Mayotte": [
    -12.8275,
    45.166244
  ],
  "Mexico": [
    23.634501,
    -102.552784
  ],
  "Micronesia": [
    7.425554,
    150.550812
  ],
  "Moldova": [
    47.411631,
    28.369885
  ],
  "Mongolia": [
    46.862496,
    103.846656
  ],
  "Montenegro": [
    42.708678,
    19.37439
  ],
  "Montserrat": [
    16.742498,
    -62.187366
  ],
  "Morocco": [
    31.791702,
    -7.09262
  ],
  "Mozambique": [
    -18.665695,
    35.529562
  ],
  "Myanmar": [
    21.916221,
    95.955974
  ],
  "Namibia": [
    -22.95764,
    18.49041
  ],
  "Nauru": [
    -0.522778,
    166.931503
  ],
  "Nepal": [
    28.394857,
    84.124008
  ],
  "Netherlands": [
    52.132633,
    5.291266
  ],
  "Netherlands Antilles": [
    12.226079,
    -69.060087
  ],
  "New Caledonia": [
    -20.904305,
    165.618042
  ],
  "New Zealand": [
    -40.900557,
    174.885971
  ],
  "Nicaragua": [
    12.865416,
    -85.207229
  ],
  "Niger": [
    17.607789,
    8.081666
  ],
  "Nigeria": [
    9.081999,
    8.675277
  ],
  "Niue": [
    -19.054445,
    -169.867233
  ],
  "Norfolk Islands": [
    -29.040835,
    167.954712
  ],
  "North America and Central America, nes": [
    22.634501,
    -101.552784
  ],
  "North Macedonia": [
    41.608635,
    21.745275
  ],
  "Northern Mariana Islands": [
    15.0979,
    145.6739
  ],
  "Norway": [
    60.472024,
    8.468946
  ],
  "Oceania, nes": [
    -24.274398,
    134.775136
  ],
  "Oman": [
    21.512583,
    55.923255
  ],
//   "Other Africa, nes": [
//     0.0,
//     0.0
//   ],
//   "Other Asia, nes": [
//     0.0,
//     0.0
//   ],
//   "Other Europe, nes": [
//     0.0,
//     0.0
//   ],
  "Pakistan": [
    30.375321,
    69.345116
  ],
  "Palau": [
    7.51498,
    134.58252
  ],
  "Panama": [
    8.537981,
    -80.782127
  ],
  "Papua New Guinea": [
    -6.314993,
    143.95555
  ],
  "Paraguay": [
    -23.442503,
    -58.443832
  ],
  "Peru": [
    -9.189967,
    -75.015152
  ],
  "Philippines": [
    12.879721,
    121.774017
  ],
  "Pitcairn": [
    -24.703615,
    -127.439308
  ],
  "Poland": [
    51.919438,
    19.145136
  ],
  "Portugal": [
    39.399872,
    -8.224454
  ],
  "Qatar": [
    25.354826,
    51.183884
  ],
  "Romania": [
    45.943161,
    24.96676
  ],
  "Russia": [
    61.52401,
    105.318756
  ],
  "Rwanda": [
    -1.940278,
    29.873888
  ],
  "Saint Helena": [
    -24.143474,
    -10.030696
  ],
  "Saint Kitts and Nevis": [
    17.357822,
    -62.782998
  ],
  "Saint Lucia": [
    13.909444,
    -60.978893
  ],
  "Saint Pierre and Miquelon": [
    46.941936,
    -56.27111
  ],
  "Saint Vincent and the Grenadines": [
    12.984305,
    -61.287228
  ],
  "Saint-Barthelemy": [
    17.9,
    -62.8333
  ],
  "Samoa": [
    -13.759029,
    -172.104629
  ],
  "San Marino": [
    43.933333,
    12.45
  ],
  "Sao Tome and Principe": [
    0.18636,
    6.613081
  ],
  "Saudi Arabia": [
    23.885942,
    45.079162
  ],
  "Senegal": [
    14.497401,
    -14.452362
  ],
  "Serbia": [
    44.016521,
    21.005859
  ],
  "Serbia and Montenegro": [
    44.817078,
    20.456236
  ],
  "Seychelles": [
    -4.679574,
    55.491977
  ],
  "Sierra Leone": [
    8.460555,
    -11.779889
  ],
  "Singapore": [
    1.352083,
    103.819836
  ],
  "Sint Maarten (Dutch part)": [
    18.04248,
    -63.05483
  ],
  "Slovakia": [
    48.669026,
    19.699024
  ],
  "Slovenia": [
    46.151241,
    14.995463
  ],
  "Solomon Is.": [
    -9.64571,
    160.156194
  ],
  "Somalia": [
    5.152149,
    46.199616
  ],
  "South Africa": [
    -30.559482,
    22.937506
  ],
  "South Georgia and the South Sandwich Islands": [
    -54.429579,
    -36.587909
  ],
  "S. Sudan": [
    6.876991,
    31.306978
  ],
  "Spain": [
    40.463667,
    -3.74922
  ],
//   "Special Categories": [
//     0.0,
//     0.0
//   ],
  "Sri Lanka": [
    7.873054,
    80.771797
  ],
  "State of Palestine": [
    31.952162,
    35.233154
  ],
  "Sudan": [
    12.862807,
    30.217636
  ],
  "Suriname": [
    3.919305,
    -56.027783
  ],
  "Sweden": [
    60.128161,
    18.643501
  ],
  "Switzerland": [
    46.818188,
    8.227512
  ],
  "Syria": [
    34.802075,
    38.996815
  ],
  "Tajikistan": [
    38.861034,
    71.276093
  ],
  "Tanzania": [
    -6.369028,
    34.888822
  ],
  "Thailand": [
    15.870032,
    100.992541
  ],
  "Timor-Leste": [
    -8.874217,
    125.727539
  ],
  "Togo": [
    8.619543,
    0.824782
  ],
  "Tokelau": [
    -9.2,
    -171.833333
  ],
  "Tonga": [
    -21.178986,
    -175.198242
  ],
  "Trinidad and Tobago": [
    10.691803,
    -61.222503
  ],
  "Tunisia": [
    33.886917,
    9.537499
  ],
  "Turkey": [
    38.963745,
    35.243322
  ],
  "Turkmenistan": [
    38.969719,
    59.556278
  ],
  "Turks and Caicos Islands": [
    21.694025,
    -71.797928
  ],
  "Tuvalu": [
    -7.109535,
    179.194134
  ],
  "Uganda": [
    1.373333,
    32.290275
  ],
  "Ukraine": [
    48.379433,
    31.16558
  ],
  "United Arab Emirates": [
    23.424076,
    53.847818
  ],
  "United Kingdom": [
    55.378051,
    -3.435973
  ],
  "United States of America": [
    37.09024,
    -95.712891
  ],
//   "United States Minor Outlying Islands": [
//     0.0,
//     0.0
//   ],
  "Uruguay": [
    -32.522779,
    -55.765835
  ],
  "Uzbekistan": [
    41.377491,
    64.585262
  ],
  "Vanuatu": [
    -15.376706,
    166.959158
  ],
  "Venezuela": [
    6.42375,
    -66.58973
  ],
  "Vietnam": [
    14.058324,
    108.277199
  ],
  "Wallis and Futuna Islands": [
    -13.768752,
    -177.156097
  ],
  "Western Sahara": [
    24.215527,
    -12.885834
  ],
  "Yemen": [
    15.552727,
    48.516388
  ],
  "Zambia": [
    -13.133897,
    27.849332
  ],
  "Zimbabwe": [
    -19.015438,
    29.154857
  ]
}}


// function updateTradeArrows() {
//     reload();
// }
refresh();