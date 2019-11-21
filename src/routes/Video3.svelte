<script>
  import { onMount } from "svelte";
  import SpotlightBackground from "../components/SpotlightBackground.svelte";
  import NavLink from "../components/NavLink.svelte";
  import VideoSnapshot from "../components/VideoSnapshot.svelte";

  const spotSize = 500;
  const backgroundColor = "rgba(15, 20, 20, 0.9)";
  const gradientColor = [
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0)"
  ];
</script>

<style>

</style>

<SpotlightBackground
  {spotSize}
  {backgroundColor}
  {gradientColor}
  backgroundImage="/img/dummy5.jpg" />

<VideoSnapshot
  videoSrc="/video/honger.mp4"
  posterSrc="/img/poster.jpg"
  videoTitle="Honger"
  localStorageLink="snapshot3"
  photoCount="03"
  linkTo="/result"
  linkToText="Zie hoe het verhaal afloopt" />
