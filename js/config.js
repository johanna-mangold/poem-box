(() => {
  window.KMAP = window.KMAP || {};

  window.KMAP.config = {
    // CONNECTION LINES
    CONNECTIONS: [
      { id:"l1", pts: [ [0,0], [-245,-132],[-178,-552] ] },
      { id:"l2", pts: [ [420,-30], [680,120], [1220,40] ] },
    ],
    LINES: {
      color: "rgba(255,255,255,0.80)",
      width: 1.6,
      dash:  [10, 10],
      cap:   "round",
      join:  "round",
      dashScaleWithZoom: false
    },

    // IMAGES
    MAP_IMAGES: [
    { src:"https://static.wixstatic.com/media/0f3578_16e80d61816447c88decdfff57a41cb8~mv2.png/v1/fill/w_799,h_985,al_c,q_90,enc_avif,quality_auto/0f3578_16e80d61816447c88decdfff57a41cb8~mv2.png", x: 3000, y: 1500, w: 300, rot: 0, op: 1, goto: { x: -700, y: -900, zoom: 1 }},   // red blob
      {src:"https://static.wixstatic.com/media/0f3578_7a3ae281337d4c67a815489f098214a0~mv2.png/v1/fill/w_1170,h_1139,al_c,q_90,enc_avif,quality_auto/0f3578_7a3ae281337d4c67a815489f098214a0~mv2.png", x: -700, y: 200, w: 200, rot: 0, op:1,    //wandobjekt homeflesh
},
      {src:"https://static.wixstatic.com/media/0f3578_ffb6ed42fb3a43fcb4984c3b54ece3cf~mv2.png/v1/fill/w_672,h_490,al_c,lg_1,q_85,enc_avif,quality_auto/0f3578_ffb6ed42fb3a43fcb4984c3b54ece3cf~mv2.png", x: 700, y: 200, w: 300, rot: 0, op:1,
  jumpOnHover: true,
  jumpRange: 300,        // optional biiird
  jumpCooldownMs: 250,   // optional
  jumpMinMove: 200        // optional
},
      {src:"https://static.wixstatic.com/media/0f3578_28aec9253a414b8a9808464358975ce4~mv2.png/v1/fill/w_626,h_472,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/0f3578_28aec9253a414b8a9808464358975ce4~mv2.png", x: -800, y: 700, w: 300, rot: 0, op: 1, href: "https://mothermountain.bandcamp.com/album/mother-mountain"}],

    // YOUTUBE
    MAP_YOUTUBE: [
      {url:"https://youtu.be/9uCARmlj-KY", x: 400, y: 2000, w: 480, h:270, rot:0, op: 1, mute: 1, controls: 1},
    ]
  };
})();
