<script>
  import StoryChapter from "../components/StoryChapter.svelte";
  import backupData from "../functions/backupData.js";
  import { onMount } from "svelte";

  const fallbackImg = "../img/dummy3.jpg";

  export let results;
  let snapshot1 = fallbackImg;
  let snapshot2 = fallbackImg;
  let snapshot3 = fallbackImg;

  onMount(() => {
    snapshot1 = localStorage.getItem("snapshot1")
      ? localStorage.getItem("snapshot1")
      : fallbackImg;
    // console.log(snapshot1);

    snapshot2 = localStorage.getItem("snapshot2")
      ? localStorage.getItem("snapshot2")
      : fallbackImg;

    snapshot3 = localStorage.getItem("snapshot3")
      ? localStorage.getItem("snapshot3")
      : fallbackImg;
    waitForResults();
  });

  // https://stackoverflow.com/questions/3635924/how-can-i-make-a-program-wait-for-a-variable-change-in-javascript
  const waitForResults = () => {
    if (results.length === 0) {
      setTimeout(waitForResults, 50);
      return;
    }
    populateData();
  };

  let chapters = [];

  const truncator = (str, words) =>
    str
      .split(" ")
      .splice(0, words)
      .join(" ");

  const removeHTMLFromString = str =>
    str.replace(/<P>/g, " ").replace(/<STRONG>/g, " ");

  const populateData = () => {
    chapters = [
      {
        isMirrored: false,
        currentChapter: "01",
        subTitle: "Landing marine",
        moments: [
          {
            title: results[0].title,
            image: snapshot1,
            description: results[0].description
          },
          {
            title: results[1].title,
            image: results[1].imageLink,
            description: results[1].description
          },
          {
            title: results[2].title,
            image: results[2].imageLink,
            description: results[2].description
          }
        ]
      },
      {
        isMirrored: true,
        currentChapter: "02",
        subTitle: "Wegversperingen",
        moments: [
          {
            title: results[3].title,
            image: snapshot2,
            description: results[3].description
          },
          {
            title: results[4].title,
            image: results[4].imageLink,
            description: results[4].description
          },
          {
            title: results[5].title,
            image: results[5].imageLink,
            description: results[5].description
          }
        ]
      },
      {
        isMirrored: false,
        currentChapter: "03",
        subTitle: "Honger",
        moments: [
          {
            title: results[6].title,
            image: snapshot3,
            description: results[6].description
          },
          {
            title: results[9].title,
            image: results[9].imageLink,
            description: results[9].description
          },
          {
            title: results[7].title,
            image: results[7].imageLink,
            description: results[7].description
          }
        ]
      }
    ];

    chapters = backupData();

    chapters.forEach(i => {
      i.moments = i.moments.map((item, j) => {
        return {
          title: item.title,
          image: item.image,
          description: removeHTMLFromString(truncator(item.description, 40))
        };
      });
    });
  };
</script>

<style>
  .bg-img {
    background: url("/img/dummy4.jpg");
    width: 100vw;
    height: 100vh;
    position: fixed;
    background-size: cover;
  }

  .bg-img:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 15, 20, 0.6);
  }

  .story-header {
    font-size: 58px;
    color: #fff;
    font-weight: 300;
    max-width: 610px;
    margin: 0 auto;
    margin-bottom: 40px;
  }

  .story-header:last-child {
    margin-bottom: 0;
  }

  .content {
    position: fixed;
    left: 0;
    right: 0;
    margin: 0 auto;
    width: 100%;
    overflow: scroll;
    max-height: 90vh;
    margin-top: 10vh;
    padding-bottom: 10vh;
    padding-top: 15vh;
  }

  .content-scroll {
    max-width: 1000px;
    margin: 0 auto;
  }
</style>

<div class="bg-img" />

<div class="content">
  <div class="content-scroll">

    <section class="story-intro">
      <h2 class="story-header">
        Op 21 july 1947 lande de Amerikaanse mariniers
      </h2>
    </section>

    {#if chapters.length > 0}
      <StoryChapter
        isMirrored={chapters[0].isMirrored}
        currentChapter={chapters[0].currentChapter}
        subTitle={chapters[0].subTitle}
        moments={chapters[0].moments} />
    {/if}

    <section class="story-intro">
      <h2 class="story-header">
        Er waren vele wegversperingen die in de weg stonden
      </h2>
    </section>

    {#if chapters.length > 0}
      <StoryChapter
        isMirrored={chapters[1].isMirrored}
        currentChapter={chapters[1].currentChapter}
        subTitle={chapters[1].subTitle}
        moments={chapters[1].moments} />
    {/if}

    <section class="story-intro">
      <h2 class="story-header">De hulpmidellen van de bevolking raakte op</h2>
      <h2 class="story-header">Honger was een probleem van vele</h2>
    </section>

    {#if chapters.length > 2}
      <StoryChapter
        isMirrored={chapters[2].isMirrored}
        currentChapter={chapters[2].currentChapter}
        subTitle={chapters[2].subTitle}
        moments={chapters[2].moments} />
    {/if}

  </div>
</div>
