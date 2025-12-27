(() => {
  window.KMAP = window.KMAP || {};

  window.KMAP.config = {
    // CONNECTION LINES
    CONNECTIONS: [
      { id:"l1", pts: [ [0,0], [200,120], [420,-30] ] },
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
      // { src:"https://static.wixstatic.com/media/0f3578_16e80d61816447c88decdfff57a41cb8~mv2.png/v1/fill/w_799,h_985,al_c,q_90,enc_avif,quality_auto/0f3578_16e80d61816447c88decdfff57a41cb8~mv2.png", x: 0, y: 0, w: 260, rot: 0, op: 1 },
    ],

    // YOUTUBE
    MAP_YOUTUBE: [
      {url:"https://youtu.be/9uCARmlj-KY", x: 800, y: 900, w: 480, h:270, rot:0, op: 1, mute: 1, controls: 1},
    ]
  };
})();
