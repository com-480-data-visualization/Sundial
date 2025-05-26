// Global variables for storing data
let coffeeData, tradeData, productionData, priceData;

// Load all data files
async function loadData() {
    try {
        const [coffee, trade, commodities, exporters, production] = await Promise.all([
            d3.csv('data/coffee.csv'),
            d3.csv('data/Trade.csv'),
            d3.csv('data/Commodities.csv'),
            d3.csv('data/Exporters.csv'),
            d3.csv('data/psd_coffee.csv')
        ]);

        // Process and initialize visualizations
        const processedCoffee = coffee.map(d => ({
            ...d,
            latitude: +d.latitude || 0,
            longitude: +d.longitude || 0,
            altitude: +d.altitude_mean_meters || 0,
            total_cup_points: +d.total_cup_points || 0
        })).filter(d => d.latitude && d.longitude); // Remove entries without coordinates

        const processedTrade = trade.map(d => ({
            ...d,
            value: +d.value || 0,
            weight: +d.weight || 0,
            year: +d.year
        })).filter(d => d.value > 0); // Remove entries without valid trade value

        const processedProduction = processProductionData(production);

        loadCoffeeData();
        initializeTradeViz(processedTrade);
        initializeProductionViz(processedProduction);
        initializePriceViz(generatePlaceholderPriceData());
    } catch (error) {
        console.error('Error loading data:', error);
        displayErrorMessage('Failed to load data. Please check the console for details.');
    }
}

// Load coffee quality data
async function loadCoffeeData() {
    try {
        d3.csv('data/coffee.csv').then(data => {
        // Convert scores to numbers
        data.forEach(d => {
            d['Data.Scores.Aroma'] = +d['Data.Scores.Aroma'];
            d['Data.Scores.Flavor'] = +d['Data.Scores.Flavor'];
            d['Data.Scores.Aftertaste'] = +d['Data.Scores.Aftertaste'];
            d['Data.Scores.Acidity'] = +d['Data.Scores.Acidity'];
            d['Data.Scores.Body'] = +d['Data.Scores.Body'];
            d['Data.Scores.Balance'] = +d['Data.Scores.Balance'];
            d['Data.Scores.Uniformity'] = +d['Data.Scores.Uniformity'];
            d['Data.Scores.Sweetness'] = +d['Data.Scores.Sweetness'];
            d['Data.Scores.Moisture'] = +d['Data.Scores.Moisture'];
            d['Data.Scores.Total'] = +d['Data.Scores.Total'];
        });

        // Set up button event listeners
        const buttons = document.querySelectorAll('.button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const scoreType = button.id;
                const averageScores = calculateAverageScores(data, scoreType);
                updateMapWithScores(averageScores);
            });
        });
    });
        initializeMapViz();
    } catch (error) {
        console.error('Error loading coffee data:', error);
        displayErrorMessage('Coffee quality data could not be loaded', 'map-viz');
    }
}

// Load trade data
async function loadTradeData() {
    try {
        const [trade, commodities, exporters] = await Promise.all([
            d3.csv('data/Trade.csv'),
            d3.csv('data/Commodities.csv'),
            d3.csv('data/Exporters.csv')
        ]);
        tradeData = processTradeData(trade, commodities, exporters);
        console.log('test')
        initializeTradeViz(tradeData);
    } catch (error) {
        console.error('Error loading trade data:', error);
        displayErrorMessage('Trade data could not be loaded', 'trade-viz');
    }
}

// Load production data
async function loadProductionData() {
    try {
        const production = await d3.csv('data/psd_coffee.csv');
        productionData = processProductionData(production);
        initializeProductionViz(productionData);
    } catch (error) {
        console.error('Error loading production data:', error);
        displayErrorMessage('Production data could not be loaded', 'production-viz');
    }
}

// Load price data
async function loadPriceData() {
    try {
        // Since we don't have direct access to price data, we'll create a placeholder
        // You would typically load this from an API or CSV file
        const priceData = generatePlaceholderPriceData();
        initializePriceViz(priceData);
    } catch (error) {
        console.error('Error loading price data:', error);
        displayErrorMessage('Price data could not be loaded', 'price-viz');
    }
}

// Process trade data
function processTradeData(trade, commodities, exporters) {
    // Filter for coffee-related commodities
    const coffeeCommodities = commodities.filter(d => d.name.toLowerCase().includes('coffee'));
    const coffeeIds = new Set(coffeeCommodities.map(d => d.id));

    return trade.filter(d => coffeeIds.has(d.commodity_id))
        .map(d => ({
            year: +d.year,
            exporter: d.exporter,
            importer: d.importer,
            value: +d.value,
            weight: +d.weight
        }));
}

// Process production data
function processProductionData(production) {
    return production.map(d => ({
        year: +d.year,
        country: d.country,
        production: +d.production || 0, // Convert to number and handle null/undefined
        exports: +d.exports || 0,
        domesticConsumption: +d.domestic_consumption || 0
    })).filter(d => !isNaN(d.production) && d.production > 0); // Remove invalid entries
}

// Generate placeholder price data
function generatePlaceholderPriceData() {
    const years = d3.range(2000, 2024);
    return years.map(year => ({
        year: year,
        price: 1 + Math.sin(year * 0.5) + Math.random() * 0.5, // Generate some realistic-looking price data
        event: year === 2011 ? '2011 Price Peak' : 
               year === 2019 ? '2019 Price Crisis' : null
    }));
}

// Error handling
function displayErrorMessage(message, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-warning';
        errorDiv.role = 'alert';
        errorDiv.innerHTML = `<strong>Error:</strong> ${message}. <br>Please check the browser's console for more details.`;
        container.prepend(errorDiv);
    }
}

function calculateAverageScores(data, scoreType) {
    const countryScores = {};

    data.forEach(d => {
        const country = d['Location.Country'];
        const score = d[scoreType];

        if (!countryScores[country]) {
            countryScores[country] = { total: 0, count: 0 };
        }

        countryScores[country].total += score;
        countryScores[country].count += 1;
    });

    // Calculate averages
    const averages = {};
    for (const country in countryScores) {
        averages[country] = countryScores[country].total / countryScores[country].count;
    }

    return averages;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadData); 