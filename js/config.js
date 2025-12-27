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
      // { src:"https://static.wixstatic.com/media/DEINBILD.png", x: 200, y: 140, w: 260, rot: 0, op: 1 },
    ],

    // YOUTUBE
    MAP_YOUTUBE: [
      {url:"https://youtu.be/9uCARmlj-KY", x: 800, y: 900, w: 480, h:270, rot:0, op: 1, mute: 1, controls: 1},
    ]
  };
})();
