<script>
  export let photoCount;
  export let videoTitle;
</script>

<style>
  .video-meta-description {
    display: flex;
    justify-content: space-between;
  }

  .video-title {
    margin: 20px 0;

    letter-spacing: 4.3px;
    text-transform: uppercase;

    color: #ffe6a0;

    font-size: 30px;
    font-weight: 400;
  }

  .video-count__title {
    margin: 0;
    margin-top: 5px;

    letter-spacing: 1.91px;
    text-transform: uppercase;

    font-size: 15px;
    font-weight: 400;
  }

  .video-count__count {
    margin: 0;
    margin-top: -5px;

    letter-spacing: 5.3px;

    font-family: "Playfair Display", serif;
    font-size: 42px;
    line-height: 1;
  }
</style>

<section class="video-meta-description">
  <div class="video-count">
    <h3 class="video-count__title">Foto</h3>
    <p class="video-count__count">{photoCount}</p>
  </div>

  <h1 class="video-title">{videoTitle}</h1>
</section>
