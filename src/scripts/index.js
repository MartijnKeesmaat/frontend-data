import renderBarChart from './renderBarChart'
import donutTest from './donutTest'
// import renderDonutChart from './renderDonutChart.js'

let categoryCounter = 0;
const nCategories = 19;
const categories = [];

const queryMainCategories = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX dc: <http://purl.org/dc/elements/1.1/>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX edm: <http://www.europeana.eu/schemas/edm/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  # tel aantallen per materiaal
  SELECT ?categoryLabel ?category (COUNT(?cho) AS ?objCount) WHERE {
  <https://hdl.handle.net/20.500.11840/termmaster2802> skos:narrower ?category .
  ?category skos:prefLabel ?categoryLabel .
  ?category skos:narrower* ?subcategory .
  ?cho edm:isRelatedTo ?subcategory .
  ?cho dct:medium ?place .
  }
  GROUP BY ?categoryLabel ?category
  ORDER BY DESC(?objCount)

`;

const fetchDataFromQuery = (querySrc, query, outsideScope, responseFn) => {
  fetch(`${querySrc}?query=${encodeURIComponent(query)}&format=json`)
    .then(res => res.json())
    .then(data => responseFn(data, outsideScope));
};

const handleDataMaterialPerCategory = data => {
  const categories = getCategoriesFromData(data);
  fetchMaterialPerCategoryEach(categories);
};

fetchDataFromQuery(
  "https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-20/sparql",
  queryMainCategories,
  "",
  handleDataMaterialPerCategory
);

const getCategoriesFromData = data => {
  return data.results.bindings.map(i => {
    return {
      termmaster: `<${i.category.value}>`,
      name: i.categoryLabel.value,
      value: i.objCount.value
    };
  });
};

const fetchMaterialPerCategoryEach = categoriesTermaster => {
  categoriesTermaster.forEach(category => {
    const queryCategories = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX dct: <http://purl.org/dc/terms/>
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX edm: <http://www.europeana.eu/schemas/edm/>
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        # tel aantallen per materiaal
        SELECT ?subcategorie ?materiaalLabel (COUNT(?cho) AS ?choCount) WHERE {
        # haal van een term in de thesaurus de subcategorieen op
        ${category.termmaster} skos:narrower* ?subcategorie .
        # haal de objecten van deze subcategorieen en het materiaal
        ?cho edm:isRelatedTo ?subcategorie .
        ?cho dct:medium ?materiaal .
        # haal het Label op van materiaal
        ?materiaal skos:prefLabel ?materiaalLabel .
        }
        GROUP BY ?subcategorie ?materiaalLabel
        ORDER BY DESC(?choCount)
        LIMIT 5
      `;

    fetchDataFromQuery(
      "https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-20/sparql",
      queryCategories,
      category,
      handleFetchMaterialPerCategory
    );
  });
};

const handleFetchMaterialPerCategory = (data, category) => {
  categoryCounter++;
  categories.push(normalizeMaterialPerCategory(data, category));
  if (categoryCounter >= nCategories) renderCharts(categories);
};

const normalizeMaterialPerCategory = (data, category) => {
  return {
    name: category.name,
    value: Number(category.value),
    materials: data.results.bindings.map(i => {
      return {
        name: i.materiaalLabel.value,
        value: Number(i.choCount.value)
      };
    })
  };
};

function renderCharts(categories) {
  const dataForFP = categories.slice(0, 5);
  renderBarChart(dataForFP, 600, 300);
  // renderDonutChart(categories, 240, 35, 200);
  donutTest(categories, 0);

  setTimeout(() => {
    donutTest(categories, 1);
  }, 1000)
}





