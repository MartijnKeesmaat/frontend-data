[![Netlify Status](https://api.netlify.com/api/v1/badges/a77e8421-230a-49f8-96b9-327ef67bbe1a/deploy-status)](https://app.netlify.com/sites/boring-liskov-c16543/deploys)

# 📈 NVWM Dashboard
> Uitstekende documentatie, ik heb hier niets meer aan toe te voegen, veel succes morgen! [@roberrrt-s](https://github.com/MartijnKeesmaat/functional-programming/issues/24)

The NVWM Dashboard is a project created for the [functional programming](https://github.com/cmda-tt/course-19-20/tree/master/functional-programming) of the [Amsterdam University of Applied Sciences](https://www.hva.nl/)

In functional programming (fp) you learn how to create visualisations from external data, and how to clean and transform data, use svg, use d3, and specifically use d3’s scales. You additionally apply learning attained in frontend apps.

For this project I created a dashboard which first shows the main categories of the [NMVW organisation](https://collectie.wereldculturen.nl/#/query/a399dc40-72c2-48e0-9675-654ffc84570f) and second the materials of their respective category. The categories are displayed in a bar chart. This chart shows 5 categories. If the user scrolls he/she can view all categories. The user will be greeted with the materials of a category when clicked on a bar in the bar chart.

## Demo
See the the live demo [here](https://functional-progammer.netlify.com/)

> disclaimer, the demo is still static, hence it doesn't show the categories dynamically

![Webp net-gifmaker (8)](https://user-images.githubusercontent.com/8048514/68758929-05cfc500-060f-11ea-8d78-dddc0e457a2a.gif)

## Install
First install dependencies:

```sh
npm install
```

To create a production build:

```sh
npm run build-prod
```

To create a development build:

```sh
npm run build-dev
```

## Wiki
The [wiki](https://github.com/MartijnKeesmaat/functional-programming/wiki) documents the progress of this project. It goes over the process through the stages of the concept, technical research, visual design and prototype.

## Data
The data that is used comes from the database of the [NMVW collection](https://collectie.wereldculturen.nl/). For the assignment we are asked to use [SPARQL](https://www.w3.org/TR/rdf-sparql-query/) to retrieve the data. 

Data being used in the app regards the main categories and their respective most-used materials. The process of gaining this data is explained on the [quest for the query](https://github.com/MartijnKeesmaat/functional-programming/wiki/Quest-for-the-query) page.

### Data cleaning
Since the data that is being retrieved doesn't need much cleaning, I decided to clean the survey data from another project. This is explained on the [data cleaning](https://github.com/MartijnKeesmaat/functional-programming/wiki/Data-cleaning-exercise) page.

## Acknowledgments
- [The NMVW org.](https://collectie.wereldculturen.nl/), for hosting us and prodiving the data
- [D3 dashboard](http://bl.ocks.org/NPashaP/96447623ef4d342ee09b)
- [Sketch template](https://www.ls.graphics/charts)
- [Nadieh Bremer Skillshare course](https://www.skillshare.com/classes/Data-Visualization-Customizing-Charts-for-Beauty-Impact/84030568/projects)
- [@dandevri](https://github.com/dandevri) for recommending the course
- [Brushable bar chart](http://bl.ocks.org/nbremer/4c015860931fb6a13afc7bac51f40b43)
- [Color palette inspiration](https://colorhunt.co/palette/361)
- [FreeCodeCamp, data visualization](https://www.freecodecamp.org/learn/data-visualization)
- [Donut chart in D3v4](https://codepen.io/zakariachowdhury/pen/EZeGJy)
