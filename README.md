# 📸 Perspective

> Perspective is a project created for the [frontend-applications course](https://github.com/cmda-tt/course-19-20/tree/master/frontend-applications) of the [Amsterdam University of Applied Sciences](https://www.hva.nl/)

The goal of the project is to dynamically display data with a front-end framework. My framework of choice is [Svelte](https://svelte.dev).

The concept is based around the early photographers who were able to tell a story through imagery instead of sketches or the written word. I want to educate others by placing them behind the lens. The user can take snapshots of certain important moments in history. These snapshots will be combined with data from the [Tropen Museum](https://www.tropenmuseum.nl/) into a storytelling website.

## Demo
See the the live demo [here](https://frontend-applications.mpkeesmaat.now.sh/)

## At its core
Perspective revolves around two views. 
1. A video view in which users are challenged to make the perfect snapshot
2. These are then displayed in the result view which are presented as a story

#### 1. Video snapshots  
![89e2c58bcb7e7fcdbbf9d1d66f7ae356](https://user-images.githubusercontent.com/8048514/67623677-72358080-f828-11e9-8df8-6c20e2676cf0.gif)

![0f3106ff191293a1b8b9cd104ed128ed](https://user-images.githubusercontent.com/8048514/67623655-27b40400-f828-11e9-8fbc-2a4ab1c3127d.gif)

#### 2. Result view
![1506bec30d90e37b527198c3c9873ccc](https://user-images.githubusercontent.com/8048514/67623822-0522ea80-f82a-11e9-8bd7-0c414fe60e51.gif)

## Install
The build tool of choice is webpack along with the [svelte loader](https://github.com/sveltejs/svelte-loader).
- Run `$npm i` to install the node-modules
- Run `$npm run dev` to start the dev environment (opens at localhost:8080)
- Run `$npm rund build` to create a build for deploying


## Wiki
The [wiki](https://github.com/MartijnKeesmaat/frontend-applications/wiki) documents the progress of this project. It goes over the process through the stages of the concept, technical research, visual design and prototype.

## Data
The data that is used comes from the database of the [NMVW collection](https://collectie.wereldculturen.nl/). For the assignment we are asked to use [SPARQL](https://www.w3.org/TR/rdf-sparql-query/) to retrieve the data. For the concept the data we use is from Indonesia and has a war tag. This should be filtered more to only shows photographs around the years of 1945-1947. The data is retrieved through this query below:

```
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX dc: <http://purl.org/dc/elements/1.1/>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX edm: <http://www.europeana.eu/schemas/edm/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  SELECT ?cho ?title ?placeName ?description ?imageLink WHERE {
    <https://hdl.handle.net/20.500.11840/termmaster7745> skos:narrower* ?place . #Ind0
    ?place skos:prefLabel ?placeName .
      
    <https://hdl.handle.net/20.500.11840/termmaster16239> skos:narrower* ?cat . # Strijd en oorlog
    # ?cat skos:prefLabel ?catLabel .
    
    ?cho dct:spatial ?place ;
    dc:type ?type ;
    edm:isShownBy ?imageLink ;
    dc:description ?description ;
    dc:title ?title .
    # FILTER langMatches(lang(?title), "ned")
  }
  LIMIT 50
```


## Tech stack
- [SPARQL](https://www.w3.org/TR/rdf-sparql-query/)
- [Svelte](https://svelte.dev)
- [Svelte routing](https://github.com/EmilTholin/svelte-routing)
- [Svelte webpack loader](https://github.com/sveltejs/svelte-loader)
- [Now](https://zeit.co/)

## Acknowledgments
- [The NMVW org.](https://collectie.wereldculturen.nl/), for hosting us and prodiving the data
- [Evert45](https://evert45.com), for the inspiration of the result page

