[![Netlify Status](https://api.netlify.com/api/v1/badges/1c5f5275-6038-4ca7-b8d4-32f12e188f72/deploy-status)](https://app.netlify.com/sites/make-frontend-data/deploys)

# 📈 NVWM Dashboard
The NVWM Dashboard is a project created for the [front-end data](https://github.com/cmda-tt/course-19-20/tree/master/frontend-data) of the [Amsterdam University of Applied Sciences](https://www.hva.nl/)

In frontend data (fd) you create an interactive visualisation, use data joins, apply motion, and additionally apply learning outcomes attained in previous courses. You additionally learn about programming principles like debugging and refactoring code.

## Concept
This project is created for the NMVW organisation. They are also the target audience. This tool visuliazes their data. It makes reading the dataset more easy by providing an interactive dashboard. The dashboard show the most common materials from the main categories. Then to make things more interesting, it also reverses the dataset by showing the material within each cateogory.

See the the live demo [here](https://make-frontend-data.netlify.com/)

### Showing the materials for each category
The first chart is a horizontal bar chart which, in this case, updates the data of the donut chart. You can see the bar chart as a fancy alternative to a dropdown. Once the user hovers over a bar in the graph, the content will update.
![](https://camo.githubusercontent.com/293a76cc4730b136d46d5c16cb88baf881d86f65/68747470733a2f2f692e6779617a6f2e636f6d2f35353031626136613335643632303461383733393561393136333262643033632e676966)

### What categories contain a material
The donut chart shows the top 5 materials for each category. To make the prototype more interesting, we also update the bar chart based on those materials. Once the user hovers over a slice of the donut, it shows which categories also have that material. The width of the bars now indicates how much of the selected material each category has.
![](https://camo.githubusercontent.com/30e1e4b2b0dd4e35994344799d32c661d4548d07/68747470733a2f2f692e6779617a6f2e636f6d2f38626237643566336362616263663738393462643033386361316265313735642e676966)

## Next to the examples
Here you briefly see the examples I used and how I transformed. The process of adapting these examples can be find in the [wiki](https://github.com/MartijnKeesmaat/frontend-data/wiki/Examples-&-My-work).

| Bar chart        | Donut chart           | Result  |
| :-------------: |:-------------:| :-----:|
| ![](https://user-images.githubusercontent.com/8048514/68934881-d7c9bc80-0797-11ea-8f40-8842971b6d69.png)      | ![](https://camo.githubusercontent.com/b235439d39d16c3a51199ff22ecb47b3208de94d/68747470733a2f2f692e6779617a6f2e636f6d2f30306462623439656331383265643662643939663364356163623266616437352e676966) | [![Image from Gyazo](https://i.gyazo.com/370d181aa181813bc5236b1939552b56.gif)](https://gyazo.com/370d181aa181813bc5236b1939552b56) |



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
- [Donut chart 'w update](http://bl.ocks.org/dbuezas/9306799)

## Reviews
> Uitstekende documentatie, ik heb hier niets meer aan toe te voegen, veel succes morgen! @roberrrt-s

> pro review: jeetje.... super man. lekker gewerkt - Marc "swagmeister" Kunst



