<script>
  import { onMount } from "svelte";
  import NavLink from "../components/NavLink.svelte";
  import VideoMeta from "../components/VideoMeta.svelte";
  import SnapshotButton from "../components/SnapshotButton.svelte";

  let context, video, canvas, w, h;
  export let videoSrc;
  export let videoTitle;
  export let localStorageLink;
  export let photoCount;
  export let posterSrc;
  export let linkTo;
  export let linkToText;

  let isShowNextVideo = false;

  onMount(() => {
    toggleNext();
  });

  // #### VIDEO INSTRUCTIONS #####
  const playVideo = () => {
    const videoInstructions = document.getElementById("video-instructions");
    const snapButton = document.getElementById("snap");
    const videoPlayer = document.querySelector("video");

    const toggleVideoClass = () => {
      videoInstructions.style.opacity = 0;
      videoInstructions.style.visibility = "hidden";
      videoPlayer.play();

      setTimeout(function() {
        snapButton.style.opacity = 1;
      }, 1200);
    };

    videoInstructions.addEventListener("click", toggleVideoClass);
  };

  const toggleNext = () => {
    document.querySelector("video").addEventListener(
      "ended",
      function() {
        isShowNextVideo = true;
      },
      false
    );
  };
</script>

<style>
  #snapshot-canvas {
    position: fixed;
    z-index: -1;
  }

  video {
    width: 888px;
    height: 496px;

    background: #000;
  }

  .video-view {
    position: relative;
    z-index: 3;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    max-width: 900px;
    height: 100vh;
    margin: 0 auto;

    color: #fff;
  }

  .video-wrapper {
    position: relative;

    margin-left: 100px;
  }

  video:focus {
    outline: none;
  }

  #snapshots-taken {
    margin-bottom: 100px;
    margin-left: 50px;
  }

  #snapshots-taken h4 {
    width: 80px;
    margin-bottom: 41px;

    letter-spacing: 2px;
    text-transform: uppercase;

    opacity: 0;

    font-size: 14px;
    line-height: 1.4;
  }

  .video-and-snapshot-wrapper {
    display: flex;
    align-items: flex-end;
  }

  .video-container {
    position: relative;

    width: 100%;
    height: 100%;
  }

  .video-overlay {
    position: absolute;
    z-index: 10;
    top: 0;
    left: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 100%;
    padding-bottom: 30px;

    transition: 0.3s all ease;

    background: rgba(10, 10, 10, 0.7);

    cursor: pointer;
  }

  .video-overlay:hover {
    background: rgba(0, 0, 0, 0.35);
  }

  .video-overlay:hover .button-round {
    border: 2px solid rgba(255, 255, 255, 0.6);
  }

  .video-overlay:hover h3 {
    opacity: 1;
  }

  .video-overlay button {
    border: none;
    background: none;
  }

  .video-overlay h3 {
    max-width: 240px;
    margin: 0;
    margin-right: 10px;

    transition: 0.3s all ease;

    text-align: right;
    letter-spacing: 1px;
    color: #fff;

    font-size: 17px;
    font-weight: 400;

    opacity: 0.7;
  }

  .video-overlay button img {
    width: 9px;
    height: 14px;
  }

  .next-video .flex {
    display: flex;
    align-items: center;
  }
</style>

<article class="video-view">
  <div class="video-and-snapshot-wrapper">
    <div class="video-wrapper">

      <VideoMeta {photoCount} {videoTitle} />

      <div class="video-container">
        <div class="video-overlay" on:click={playVideo} id="video-instructions">
          <h3>
            Maak momentopnames van de gebeurtenis, de laatste zie je straks
            terug
          </h3>

          <button>
            <span class="button-round">
              <img src="/icons/arrow-solid.svg" alt="" />
            </span>
          </button>
        </div>

        {#if isShowNextVideo}
          <NavLink to={linkTo}>
            <div class="video-overlay next-video">
              <div class="flex">
                <h3>{linkToText}</h3>
                <button>
                  <span class="button-round">
                    <img src="/icons/arrow.svg" alt="" />
                  </span>
                </button>
              </div>
            </div>
          </NavLink>
        {/if}

        <video poster={posterSrc}>
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>

      {#if !isShowNextVideo}
        <SnapshotButton {localStorageLink} />
      {/if}
    </div>

    <div id="snapshots-taken">
      <h4>Jouw foto's</h4>
    </div>

    <canvas id="snapshot-canvas" width="640" height="480" />
  </div>
</article>
