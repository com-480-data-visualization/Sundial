# Global Coffee Insights

An interactive data visualization project exploring global coffee production, trade, and pricing trends.

## Project Overview

This project provides a comprehensive visualization of the global coffee industry through four main components:

1. **Coffee Production & Quality Map**: Visualizes coffee production locations worldwide with quality indicators
2. **Global Trade Flows**: Shows the movement of coffee between countries
3. **Production Trends**: Displays historical production data for major coffee-producing countries
4. **Price Analysis**: Tracks coffee price trends and significant market events

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd coffee-viz
```

2. Start a local server:
```bash
python -m http.server 8000
# or
npx http-server
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

## Data Sources

- Coffee Bean Production Locations and Properties (coffee.csv): From the Coffee Quality Institute (CQI)
- Global Import and Export Data (Trade.csv, Commodities.csv, Exporters.csv): From Resource Trade.earth
- Global Coffee Bean Production (psd_coffee.csv): From U.S. Department of Agriculture
- Coffee Prices: From MacroTrends

## Features

- Interactive world map showing coffee production locations
- Quality score visualization with color coding
- Dynamic trade flow visualization
- Time series analysis of production trends
- Price trend analysis with significant event annotations
- Responsive design for various screen sizes
- Interactive tooltips and hover effects

## Technical Implementation

- Built with D3.js v7
- Responsive SVG visualizations
- TopoJSON for geographical data
- Bootstrap 5 for layout and styling

## Project Structure

```
coffee-viz/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Custom styles
├── js/
│   ├── main.js        # Main application logic
│   ├── mapViz.js      # Production & quality map visualization
│   ├── tradeViz.js    # Trade flow visualization
│   ├── productionViz.js # Production trends visualization
│   └── priceViz.js    # Price analysis visualization
└── data/              # Data files
```

## Team Members

- Lieu Kaixuan Ryan (402630)
- Kao Chi Yuk (403931)
- Tsoi Chun Wong (403911)

## License

This project is part of the Data Visualization (COM-480) course at EPFL. 