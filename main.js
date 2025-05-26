// Global variables for storing data
let coffeeData, tradeData, productionData, priceData;

// Load all data files
async function loadData() {
    // Load each data source independently
    loadCoffeeData();
    loadTradeData();
    loadProductionData();
    loadPriceData();
}

// Load coffee quality data
async function loadCoffeeData() {
    try {
        const coffee = await d3.csv('data/coffee.csv');
        coffeeData = coffee.map(d => ({
            ...d,
            latitude: +d.latitude,
            longitude: +d.longitude,
            altitude: +d.altitude_mean_meters,
            score_total: +d.total_cup_points
        }));
        initializeMapViz(coffeeData);
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
        initializeTradeViz(tradeData);
    } catch (error) {
        console.error('Error loading trade data:', error);
        displayErrorMessage('Trade data could not be loaded', 'trade-viz');
    }
}

// Load production data
async function loadProductionData() {
    try {
        const production = await d3.csv('data/coffee_production.csv');
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
function processProductionData(production) {
    // Filter for production data and aggregate by country+year
    const filtered = production.filter(d => 
        d.Attribute_Description.includes("Production") && 
        d.Calendar_Year >= 2015
    );
    
    return d3.rollup(filtered,
        v => d3.sum(v, d => +d.Value), // Sum all production types per country/year
        d => d.Country_Name,
        d => +d.Calendar_Year
    );
}

// Process production data
function processProductionData(production) {
    return production.flatMap(country => {
        const countryName = country.Country;
        return Object.keys(country)
            .filter(key => key.includes('/') && !key.includes('Change'))
            .map(year => ({
                country: countryName,
                year: parseInt(year.split('/')[0]),
                production: parseFloat(country[year].replace(/,/g, '')) || 0
            }));
    }).filter(d => !isNaN(d.year) && d.production > 0);
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadData); 