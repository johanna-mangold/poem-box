(() => {
  window.KMAP = window.KMAP || {};
  window.KMAP.config = window.KMAP.config || {};

  Object.assign(window.KMAP.config, {
    // CONNECTION LINES
    CONNECTIONS: [
      { id:"l1", pts: [ [4,69], [-60,69], [-60,-28], [-242,-112], [-242,-637], [-84,-637] ] },
      { id:"l2", pts: [ [422,116], [1458,116], [1458,-572], [2000,-572] ] },
      { id:"l3", pts: [ [248,225], [248,1000], [400,1000] ] },
      { id:"l4", pts: [ [250,692], [2308,692] ] },
      { id:"l5", pts: [ [-2,136], [-1151,136] ] },
      { id:"l6", pts: [ [-804,130], [-804,1633] ] },
      { id:"l7", pts: [ [530,1143], [530,1995] ] },
      { id:"l8", pts: [ [-590,1800], [64,1800], [64,2125], [387,2125] ] },
      { id:"l9", pts: [ [1459,-580], [1459,-1276] ] },
      { id:"l10", pts: [ [-1635,343], [-1635,1466] ] },
      { id:"l11", pts: [ [80,-700], [80,-2184], [190,-2184] ] },
      { id:"l12", pts: [ [2200,-2700], [2200,-1000] ] }
     // { id:"l4", pts: [ [11,127], [11,-1171] ] }
    ],

    LINES: {
      color: "rgba(254, 252, 247, .8)",
      width: 1.6,
      dash:  [10, 16],
      cap:   "round",
      join:  "round",
      dashScaleWithZoom: false,
      debug: false
    },

    // IMAGES
    MAP_IMAGES: [
      {
        src:"https://static.wixstatic.com/media/0f3578_16e80d61816447c88decdfff57a41cb8~mv2.png/v1/fill/w_799,h_985,al_c,q_90,enc_avif,quality_auto/0f3578_16e80d61816447c88decdfff57a41cb8~mv2.png",
        x: 3000, y: 1500, w: 300, rot: 0, op: 1,
        goto: { x: -700, y: -900, zoom: 1 }
      }, // red blob

      {
        src:"https://static.wixstatic.com/media/0f3578_14420ea68f1e4ddfa3e1cf12329f3a39~mv2.gif",
        x: -113, y: 800, w: 200, rot: 0, op: 1
      }, // wyrd gif1

      {
        src:"https://static.wixstatic.com/media/0f3578_2822fdaf4da941cdabb84d24d0e44848~mv2.gif",
        x: -1000, y: -1400, w: 200, rot: 0, op: 1
      }, // wyrd gif2
      
      {
        src:"https://static.wixstatic.com/media/0f3578_ffb6ed42fb3a43fcb4984c3b54ece3cf~mv2.png/v1/fill/w_672,h_490,al_c,lg_1,q_85,enc_avif,quality_auto/0f3578_ffb6ed42fb3a43fcb4984c3b54ece3cf~mv2.png",
        x: -870, y: -670, w: 300, rot: 0, op: 1,
        jumpOnHover: true,
        jumpRange: 300,
        jumpCooldownMs: 250,
        jumpMinMove: 200
      }, // blubiiird

      {
        src:"https://static.wixstatic.com/media/0f3578_28aec9253a414b8a9808464358975ce4~mv2.png/v1/fill/w_626,h_472,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/0f3578_28aec9253a414b8a9808464358975ce4~mv2.png",
        x: -900, y: 1700, w: 300, rot: 0, op: 1,
        href: "https://mothermountain.bandcamp.com/album/mother-mountain"
      } // mother mountain cover
    ],

    // YOUTUBE
    MAP_YOUTUBE: [
      { url:"https://youtu.be/9uCARmlj-KY", x: 400, y: 2000, w: 480, h: 270, rot: 0, op: 1, mute: 1, controls: 1 }
    ]
  });
})();
