<script>
  export let isMirrored;
  export let currentChapter;
  export let subTitle;
  export let moments;
</script>

<style>
  .story-chapter {
    margin-top: 50px;
  }

  .story-chapter--mirror .story__intro {
    margin-left: 30px;
  }

  .story-chapter--mirror .story__moment-container {
    flex-direction: row-reverse;
  }

  .story__count {
    margin: 0;
    line-height: 1;
  }
  .story__current-count {
    font-size: 338px;
    color: #ffe6a0;
    font-weight: 300;
    letter-spacing: -9px;
  }
  .story__total-count {
    font-size: 68px;
    font-weight: 300;
    color: #fff;
    padding-left: 20px;
  }

  .story__chapter-name {
    text-transform: uppercase;
    font-style: italic;
    font-weight: 600;
    letter-spacing: 4px;
    font-size: 20px;
    color: #fff;
    margin-left: 20px;
    margin-top: 5px;
  }

  .story__intro:nth-child(1) {
    margin-left: calc(50% + 30px);
  }

  .story__moment-container {
    display: flex;
  }

  .story-intro {
    margin: 80px 0;
  }

  .stories:last-child {
    padding-top: 25%;
  }

  .story__moment {
    max-width: 517px;
    margin: 40px;
    margin-bottom: 70px;
  }

  .story__moment-img {
    max-width: 100%;
    object-fit: cover;
    max-height: 300px;
    width: 100%;
  }

  .story__moment figcaption {
    color: #fff;
    font-size: 16px;
    font-family: "Source Sans Pro", sans-serif;
    line-height: 1.5;
    margin-top: 7px;
    opacity: 0.85;
  }
</style>

<section
  class="story-chapter {isMirrored === true ? 'story-chapter--mirror' : ''}">
  <div class="story__intro">
    <h3 class="story__count">
      <span class="story__current-count">{currentChapter}</span>
      <span class="story__total-count">/03</span>
    </h3>
    <div class="story__chapter-name">{subTitle}</div>
  </div>

  <div class="story__moment-container">
    <div class="stories">
      <figure class="story__moment">
        <img
          class="story__moment-img background"
          src={moments[0].image}
          alt={moments[0].title} />
        <figcaption>{moments[0].description}</figcaption>
      </figure>

      <figure class="story__moment">
        <img
          class="story__moment-img background"
          src={moments[2].image}
          alt={moments[2].title} />
        <figcaption>{moments[2].description}</figcaption>
      </figure>
    </div>

    <div class="stories">
      <figure class="story__moment">
        <img
          class="story__moment-img background"
          src={moments[1].image}
          alt={moments[1].title} />
        <figcaption>{moments[1].description}</figcaption>
      </figure>
    </div>
  </div>

</section>
