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
  backgroundImage="/img/dummy4.jpg" />

<VideoSnapshot
  videoSrc="/video/wegversperingen.mp4"
  posterSrc="/img/dummy5.jpg"
  videoTitle="Wegversperingen"
  localStorageLink="snapshot2"
  photoCount="02"
  linkTo="/video3"
  linkToText="Bekijk het volgende video fragment" />
