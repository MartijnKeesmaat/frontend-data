<script>
  import { onMount } from "svelte";
  import SpotlightBackground from "../components/SpotlightBackground.svelte";
  import NavLink from "../components/NavLink.svelte";
  import VideoSnapshot from "../components/VideoSnapshot.svelte";

  const gradientColor = [
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0)"
  ];
</script>

<style>

</style>

<SpotlightBackground
  {gradientColor}
  spotSize="500"
  backgroundColor="rgba(15, 20, 20, 0.9)"
  backgroundImage="https://scontent-amt2-1.xx.fbcdn.net/v/t1.0-9/27654433_764037853794118_4739243479831552770_n.jpg?_nc_cat=108&_nc_oc=AQlDa3nzcVUyWNXYYwZEXB8Kev00AxKqAS7BFDEmsjf5XUh_ovHWoSt79F4l7EvEyRw&_nc_ht=scontent-amt2-1.xx&oh=e76eebc07cb1521fc411076a32b46eb0&oe=5E1871CE" />

<VideoSnapshot
  videoSrc="/video/landing-marine.mp4"
  posterSrc="/img/poster.jpg"
  videoTitle="Marine landing"
  localStorageLink="snapshot1"
  photoCount="01"
  linkTo="/video2"
  linkToText="Bekijk het volgende video fragment" />
