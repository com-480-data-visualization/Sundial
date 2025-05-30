# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Lieu Kaixuan Ryan| 402630|
| Kao Chi Yuk| 403931|
| Tsoi Chun Wong| 403911|

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (21st March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

### Dataset

Our project focuses on coffee, and we will create four visualizations using the following datasets:

Coffee Bean Production Locations and properties (https://corgis-edu.github.io/corgis/csv/coffee/): This dataset includes geographic data on coffee bean production locations, as well as scores for various properties such as aroma, aftertaste, acidity, balance, and sweetness. It is sourced from the Coffee Quality Institute (CQI), an organization dedicated to inspecting coffee quality. Since the data is already clean, no additional processing is needed.

Global Import and Export Data (https://resourcetrade.earth/?year=2017&category=904&units=value&autozoom=1): This dataset provides information on the monetary flow and weight of coffee beans traded globally from 2000 to 2022. It is created by Resource Trade.earth, which utilizes the Chatham House Resource Trade Database (CHRTD) as its original source. The CHRTD data is collected by the United Nations Statistical Division, ensuring the dataset's reliability, so further data processing is unnecessary.

Global Coffee Bean Production (https://www.fas.usda.gov/data/production/commodity/0711100): This dataset covers coffee bean production worldwide from 2015 to 2024. The data is collected by the U.S. Department of Agriculture, indicating that it is clean and reliable.

Coffee Prices (https://www.macrotrends.net/2535/coffee-prices-historical-chart-data): This dataset contains information on the price of coffee per pound. The data is collected from a trusted third-party statistics organization. It will be processed to be compared with the cumulation global inflation rate to calculate the real price value. 


### Problematic

Motivated by a passion for coffee, We aim to explore its production, trade, and pricing through engaging visualizations. We intend to showcase the geographic diversity of coffee cultivation by visualizing production locations and their associated quality attributes, highlighting how geographic conditions contribute to different flavor profiles. Additionally, we will illustrate global trade patterns using import and export data, demonstrating the interconnectedness of coffee markets and the significance of trade relationships. By analyzing production trends from 2015 to 2024, we will identify fluctuations in supply due to factors like climate change and consumer demand, while tracking price movements will provide insights into how market dynamics influence coffee prices. Motivated by a passion for coffee, we seek to educate coffee enthusiasts, consumers, and students about the complexities of the coffee market, making this information accessible and engaging through clear and informative visualizations.

### Exploratory Data Analysis

Our exploratory data analysis (EDA) starts by reviewing four key datasets to make sure they are clean and ready for visualization. Since these datasets come from reliable sources, they don’t require much fixing, but we still check for missing values and ensure everything is formatted correctly. The Coffee Bean Production and Quality dataset from the CORGIS Project includes information about where coffee is grown and how it scores in terms of aroma, acidity, sweetness, and more. We’ll use this to explore how geography affects coffee quality. The Global Trade Data from Resource Trade Earth tracks coffee imports and exports from 2000 to 2022, showing which countries buy and sell the most. We’ll clean and organize this data to highlight trade patterns. The Global Coffee Production dataset from the USDA covers coffee output from 2015 to 2024, giving us a clear view of how production has changed over time. Finally, the Coffee Price Data from Trading Economics shows how coffee prices have fluctuated over the years, helping us connect price trends with production and trade.

From our initial analysis, we see that Brazil leads coffee production, supplying about 38% of the world’s coffee, followed by Vietnam and Colombia. Global trade data shows strong connections between coffee-producing countries and major buyers like the U.S., Germany, and Japan. The quality dataset reveals that high-altitude coffee farms tend to produce better-tasting beans, which explains why regions like Ethiopia are known for their rich coffee flavors. Meanwhile, price trends show coffee prices have been quite unstable, often influenced by weather, supply chain issues, and market demand.

Existing visualizations usually focus on just one aspect of coffee—either production, trade, or pricing—but don’t show how they all connect. Our project aims to fill this gap by creating interactive visuals that let users explore these relationships. We’ll map out coffee-growing regions alongside their quality scores, helping users see how factors like altitude impact taste. For trade, we’ll build on Resource Trade Earth’s maps by linking coffee quality to global trade flows. Instead of just showing price trends, we’ll compare them with production and trade data to explain why prices rise and fall. By combining these insights, we’ll make it easier for coffee lovers, students, and researchers to understand the bigger picture of the coffee industry in a fun and interactive way.

See basic data visualization results in our [Jupyter Notebook file](/milestone1.ipynb). 

### Related work


No existing visualizations have effectively illustrated the relationship between the geographic conditions of coffee bean production locations and the sensory properties of coffee, such as aroma, acidity, sweetness, and aftertaste. Our project will create an interactive website that allows users to explore these relationships visually. By mapping production locations and overlaying sensory data, users will gain insights into how specific geographic factors influence the quality and characteristics of coffee.

Resource Trade Earth has effectively visualized the flow of coffee beans using a map and arrows, where the width of the arrows represents the magnitude of trade flows between countries. This provides a clear and informative overview of global coffee trade dynamics, allowing users to grasp the scale and direction of coffee imports and exports. However, we aim to supplement this existing visualization by delving deeper into the relationship between import and export activities and the sensory properties of coffee beans, such as aroma, acidity, sweetness, and aftertaste. By integrating these sensory attributes into our analysis, we can uncover valuable insights into how the quality of coffee influences trade patterns and market preferences.

The USDA has effectively visualized coffee production data using a global map for the years 2024-2025, offering a snapshot of current production levels and geographical distribution. However, we intend to extend this visualization to cover production data from 2015 onward, creating a comprehensive time-series analysis that captures the trends and changes in coffee production over nearly a decade. By including historical data, we can provide valuable insights into the evolution of coffee production globally.

Trading Economics has visualized coffee price trends using standard graphs. In contrast, we plan to enhance this analysis by integrating price data with production and trade data to explore the correlations between prices, production levels, and trade volumes. Our visualization will not only show price trends over time but also allow users to analyze how changes in production and trade impact coffee prices. By providing interactive tools to filter and compare different datasets, we aim to create a more in-depth understanding of the factors influencing coffee prices.

## Milestone 2 (18th April, 5pm)
The pdf file: [PDF](/COM480_Milestone_2.pdf)
The website prototype: [Page Prototype](https://com-480-data-visualization.github.io/Sundial/)


## Milestone 3 (30th May, 5pm)

The Final Webpage:[Web](https://com-480-data-visualization.github.io/Sundial/).
The Process Book:.
The Screencast:.

This webpage is designed for coffee lovers curious about what makes their favorite origins special; industry pros tracking market trends; students learning about global agricultural trade; researchers studying economic and environmental factors affecting coffee farms.

## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone

