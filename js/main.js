let coffeeData, tradeData, productionData, priceData;

async function loadData() {
    try {
        const [production, priceData] = await Promise.all([
            d3.csv('data/coffee_production.csv'),
            d3.csv('data/coffee-prices-historical-chart-data.csv')
        ]);

        const score_buttons = document.querySelectorAll('#score_buttons .button');
        if (score_buttons.length > 0) {
            score_buttons[0].classList.add('selected');
        }

        const import_export_buttons = document.querySelectorAll('#import_export_buttons .button');
        if (import_export_buttons.length > 0) {
            import_export_buttons[0].classList.add('selected');
        }


        const processedProduction = processProductionData(production);

        const processedPrice = priceData
            .map(d => ({
                date: new Date(d.Date),
                price: +d.Price
            }))
            .filter(d => !isNaN(d.date.getTime()) && !isNaN(d.price));

        loadCoffeeData();
        loadTradeData();
        initializeProductionViz(processedProduction);
        initializePriceViz(processedPrice);
        
    } catch (error) {
        console.error('Error loading data:', error);
        displayErrorMessage('Failed to load data. Please check the console for details.');
    }
}

async function loadCoffeeData() {
    try {
        d3.csv('data/coffee.csv').then(data => {
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
            
            if(d['Location.Country'] === 'United States'){
                d['Location.Country'] = 'United States of America';
            }

            if(d['Location.Country'] === 'Tanzania, United Republic Of'){
                d['Location.Country'] = 'Tanzania';
            }

            if(d['Location.Country'] === 'Cote d?Ivoire'){
                d['Location.Country'] = 'Côte d\'Ivoire';
            }
        });

        const score_buttons = document.querySelectorAll('#score_buttons .button');
        score_buttons.forEach(button => {
            button.addEventListener('click', function() {
                if (this.classList.contains('selected')) return;

                score_buttons.forEach(btn => btn.classList.remove('selected'));
                
                this.classList.add('selected');
                const scoreType = button.id;
                const averageScores = calculateAverageScores(data, scoreType);
                updateMapWithScores(averageScores,button.getHTML());
            });
        });

        initializeMapViz().then( () => {
            const scoreType = 'Data.Scores.Total';
            const averageScores = calculateAverageScores(data, scoreType);
            updateMapWithScores(averageScores,'Total Score');})
        });
   
        
    } catch (error) {
        console.error('Error loading coffee data:', error);
        displayErrorMessage('Coffee quality data could not be loaded', 'map-viz');
    }
}

async function loadTradeData() {
    try {
        const [exports, imports, trades] = await Promise.all([
            d3.csv('data/exports_full.csv'),
            d3.csv('data/imports_full.csv'),
            d3.csv('data/trades_full.csv')
        ]);

        const processedTrade = trades.map(d => ({
            year: +d.Year,
            exporter: d.Exporter, 
            importer: d.Importer,
            value: +d["Value (1000USD)"] || +d["Export value, where quarantined"] || +d["Import value, where quarantined"] || 0,
            weight: +d["Weight (1000kg)"] || +d["Export weight, where quarantined"] || +d["Import weight, where quarantined"] || 0,
        })).filter(d => d.value > 0 && d.weight > 0 && d.exporter);

        const year_count = 23
        const starting_year = 2000;
        const ending_year = starting_year + year_count - 1;

        var years = [...Array(year_count).keys()].map(i => i + starting_year)
        var dropDown = d3.select("#dropdown_container")
            .append("select")
            .attr("class", "selection")
            .attr("name", "year-select")
            .property("value", ending_year)
            .on('change', function() {
                const selectedYear = +d3.select(this).property('value');
                console.log("Selected Year:", selectedYear);
                initializeTradeViz(processedTrade.filter(d => d.year === selectedYear), selectedYear);
            });

        var options = dropDown.selectAll("option")
            .data(years)
            .enter()
            .append("option");
        options.text(function(d) { return d; })
            .attr("value", function(d) { return d; });

        const import_export_buttons = document.querySelectorAll('#import_export_buttons .button');
        import_export_buttons.forEach(button => {
            button.addEventListener('click', function() {
                if (this.classList.contains('selected')) return;

                import_export_buttons.forEach(btn => btn.classList.remove('selected'));
                this.classList.add('selected');

                initializeTradeViz(processedTrade.filter(d => d.year === +dropDown.property('value')), +dropDown.property('value'));
            });
        });

        initializeTradeViz(processedTrade.filter(d => d.year === ending_year), ending_year);
    } catch (error) {
        console.error('Error loading trade data:', error);
        displayErrorMessage('Trade data could not be loaded', 'trade-viz');
    }
}

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

async function loadPriceData() {
    try {
        const priceData = generatePlaceholderPriceData();
        initializePriceViz(priceData);
    } catch (error) {
        console.error('Error loading price data:', error);
        displayErrorMessage('Price data could not be loaded', 'price-viz');
    }
}

function processTradeData(trade, commodities, exporters) {
    try {
        const coffeeCommodities = commodities.filter(d => 
            d.name.toLowerCase().includes('coffee')
        );
        
        if(coffeeCommodities.length === 0) {
            console.error('No coffee commodities found');
            return [];
        }

        const coffeeIds = new Set(coffeeCommodities.map(d => d.id));
        const validTrade = trade.filter(d => coffeeIds.has(d.commodity_id));
        
        return validTrade.map(d => ({
            year: +d.year || new Date().getFullYear(),
            exporter: exporters.find(e => e.id === d.exporter_id)?.name || 'Unknown',
            importer: d.importer,
            value: +d.value || 0,
            weight: +d.weight || 0
        }));
    } catch (error) {
        console.error('Trade processing failed:', error);
        return [];
    }
}



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

function generatePlaceholderPriceData() {
    const years = d3.range(2000, 2024);
    return years.map(year => ({
        year: year,
        price: 1 + Math.sin(year * 0.5) + Math.random() * 0.5, 
        event: year === 2011 ? '2011 Price Peak' : 
               year === 2019 ? '2019 Price Crisis' : null
    }));
}

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

    const averages = {};
    for (const country in countryScores) {
        averages[country] = countryScores[country].total / countryScores[country].count;
    }

    return averages;
}



document.addEventListener('DOMContentLoaded', loadData); 
