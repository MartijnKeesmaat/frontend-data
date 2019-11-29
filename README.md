# 📈 NVWM Dashboard
The NVWM Dashboard is a project created for the [front-end data course](https://github.com/cmda-tt/course-19-20/tree/master/frontend-data) of the [Amsterdam University of Applied Sciences](https://www.hva.nl/)

In frontend data (fd) you create an interactive visualisation, use data joins, apply motion, and additionally apply learning outcomes attained in previous courses. You additionally learn about programming principles like debugging and refactoring code.

## Concept
This project is created for the NMVW organisation. They are also the target audience. This tool visuliazes their data. It makes reading the dataset more easy by providing an interactive dashboard. The dashboard show the most common materials from the main categories. Then to make things more interesting, it also reverses the dataset by showing the material within each cateogory.

See the the live demo [here](https://make-frontend-data.netlify.com/)

### Showing the most populair materials for each category
The first chart is a horizontal bar chart which, in this case, updates the data of the donut chart. You can see the bar chart as a fancy alternative to a dropdown. Once the user hovers over a bar in the graph, the donut-chart will update.
[![Image from Gyazo](https://i.gyazo.com/cf10d977cb5af01cf0b0902bcc674d99.gif)](https://gyazo.com/cf10d977cb5af01cf0b0902bcc674d99)

### What categories contain the selected material
The donut chart shows the top 5 materials for each category. To make the prototype more interesting, we also update the bar chart based on those materials. Once the user hovers over a slice of the donut, it shows which categories contain that material. The width of the bars now indicates how much of the selected material each category has.
[![Image from Gyazo](https://i.gyazo.com/540fbdc762e7cc373ceb81b2138971ec.gif)](https://gyazo.com/540fbdc762e7cc373ceb81b2138971ec)

## Next to the examples
Here you briefly see the examples that were used and how I transformed them. The process of adapting these examples can be found in the [wiki](https://github.com/MartijnKeesmaat/frontend-data/wiki/Examples-&-My-work). 

| [Bar chart](https://www.freecodecamp.org/learn/data-visualization/data-visualization-with-d3/add-a-hover-effect-to-a-d3-element/)        | [Donut chart](http://bl.ocks.org/dbuezas/9306799)           | [Result](https://make-frontend-data.netlify.com/)  |
| :-------------: |:-------------:| :-----:|
| ![](https://user-images.githubusercontent.com/8048514/68934881-d7c9bc80-0797-11ea-8f40-8842971b6d69.png)      | ![](https://camo.githubusercontent.com/b235439d39d16c3a51199ff22ecb47b3208de94d/68747470733a2f2f692e6779617a6f2e636f6d2f30306462623439656331383265643662643939663364356163623266616437352e676966) | [![Image from Gyazo](https://i.gyazo.com/fcd34dc87f4feb83c460747cea63b50b.gif)](https://gyazo.com/fcd34dc87f4feb83c460747cea63b50b) |

Here is what I changed from these examples:

#### Bar chart
- Changed the orientation of the bars to horizontal.
- Added labels to the side and wrapped it with a max-width
- Added a scale
- Added the x-axis
- Added gridlines
- Styling - styled the graph according to the design

#### Donut chart
- Meta data - the title and sub-title which update once the user hovers over a bar in the bar chart See update pattern here
- Data input - the data inside the donut chart now updates with real data. This process is now triggered by hovering over a bar inside the bar-chart See update pattern here
- Legend - the legend shows which materials there currently are displayed. It's also interactive to give feedback to the user of what the current material is.
- Inner value - inside the the donut chart you see the amount of objects total and when hovered of a specific material

## Install
[Parcel](https://parceljs.org/) is used as the application bundler for this project. The main goal of using Parcel was to use ES6 imports. This allows for the code to be more modular and easier to work with.

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
The [wiki](https://github.com/MartijnKeesmaat/frontend-data/wiki) documents the progress of this project. It goes over the process through the stages of the concept, technical research, visual design and prototype.

## Data
The data that is used comes from the database of the [NMVW collection](https://collectie.wereldculturen.nl/). For the assignment we are asked to use [SPARQL](https://www.w3.org/TR/rdf-sparql-query/) to retrieve the data. 

Data being used in the app regards the main categories and their respective most-used materials. The process of gaining this data is explained on the [quest for the query](https://github.com/MartijnKeesmaat/frontend-data/wiki/Quest-for-the-query) page.

### Data usage
There are 19 main categories in total, but for this example, I'll show 2. This is how the objects are structured. They contain a `name`, `value` and `material array`. The value refers to the amount of objects within the category.

``` js
0: {name: "communicatie", value: 557474, materials: Array(5)}
1: {name: "kunst", value: 188227, materials: Array(5)}
```

Each category shows the 5 most common materials. The materials have a name(string) and value(number) which is the number of objects of said material.


``` js
0: {name: "papier (vezelproduct)", value: 12411}
1: {name: "papier (vezelproduct)", value: 7792}
2: {name: "inkt", value: 7473}
3: {name: "houtsnede (drukprocedé)", value: 6640}
4: {name: "pigment", value: 6378}
```

### Data cleaning
Since the data that is being retrieved doesn't need much cleaning, I decided to clean the survey data from another project. This is explained on the [data cleaning](https://github.com/MartijnKeesmaat/frontend-data/wiki/Data-cleaning) page.

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



