<script>
  // Plugins
  import { Router, Route } from "svelte-routing";
  import { onMount } from "svelte";

  // Pages
  import Home from "./routes/Home.svelte";
  import Video from "./routes/Video.svelte";
  import Video2 from "./routes/Video2.svelte";
  import Video3 from "./routes/Video3.svelte";
  import Result from "./routes/Result.svelte";

  // Components
  import NavLink from "./components/NavLink.svelte";

  // Used for routing
  export let url = "";

  // Specify which data is retrieved
  const queryUrl =
    "https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-20/sparql";

  const query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX edm: <http://www.europeana.eu/schemas/edm/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>

    SELECT ?cho (SAMPLE(?title) as ?title) ?placeName (SAMPLE(?description) as ?description) (SAMPLE(?imageLink) as ?imageLink) WHERE {
      <https://hdl.handle.net/20.500.11840/termmaster7745> skos:narrower* ?place . #Indonesie
      ?place skos:prefLabel ?placeName .
      
      VALUES ?type { "Foto" "foto / ansichtkaart" "Panoramafoto" "foto op karton" "foto / carte-de-visite" "Stereofoto" "stereofoto" "fotoalbum" "fotomech druk: prentbriefkaart kleur" "foto's" "foto" "Negatief" "negatief" "Glasnegatief" "glasnegatief" "Dia" "dia" "Kleurendia" "kleurendia" "Lichtbeeld" "lichtbeeld"}

      <https://hdl.handle.net/20.500.11840/termmaster16239> skos:narrower* ?cat . # Strijd en oorlog
      # ?cat skos:prefLabel ?catLabel .
      
      ?cho dct:spatial ?place ;
      dc:type ?type ;
      edm:isShownBy ?imageLink ;
      dc:description ?description ;
      dc:title ?title .
      # FILTER langMatches(lang(?title), "ned")
    }
    LIMIT 100
  `;
  let results = [];

  // Fetch data & clean it
  const runQuery = (queryUrl, query) => {
    fetch(queryUrl + "?query=" + encodeURIComponent(query) + "&format=json")
      .then(res => res.json())
      .then(json => {
        results = JSON.parse(JSON.stringify(json.results));
        results = results.bindings;
        results = results.map((result, index) => {
          return {
            id: index,
            cho: result.cho.value,
            description: result.description.value,
            imageLink: result.imageLink.value,
            title: result.title.value,
            placeName: result.placeName.value
          };
        });
      });
  };

  onMount(() => {
    runQuery(queryUrl, query);
  });
</script>

<Router {url}>
  <!-- Nav links -->
  <nav class="main-nav">
    <NavLink to="/intro">
      <img src="/icons/logo.svg" alt="" />
    </NavLink>

    <div class="main-nav__links">
      <NavLink to="intro">Intro</NavLink>
      <NavLink to="video">Video1</NavLink>
      <NavLink to="video2">Video2</NavLink>
      <NavLink to="video3">Video3</NavLink>
      <NavLink to="result">Result</NavLink>
    </div>
  </nav>

  <!-- Route pages -->
  <div>
    <Route path="/" component={Home} />
    <Route path="intro" component={Home} />
    <Route path="video" component={Video} />
    <Route path="video2" component={Video2} />
    <Route path="video3" component={Video3} />
    <Route path="result" component={Result} {results} />
  </div>
</Router>
