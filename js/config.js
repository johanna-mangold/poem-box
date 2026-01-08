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
      { id:"l7", pts: [ [530,1438], [530,1995] ] },
      { id:"l8", pts: [ [-490,1800], [64,1800], [64,2125], [387,2125] ] },
      { id:"l9", pts: [ [1459,-580], [1459,-1276] ] },
      { id:"l10", pts: [ [-1635,343], [-1635,1466] ] },
      { id:"l11", pts: [ [80,-700], [80,-2184], [190,-2184] ] },
      { id:"l12", pts: [ [2200,-2700], [2200,-1000] ] },
      { id:"l13", pts: [ [-1700,138], [-2465,138], [-2465,1000] ] },
      { id:"l14", pts: [ [1458,116], [2777,116] ] },
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

    /* =========================================================
       NEW: MAP TEXTS (plain text on the map, no boxes)
       ========================================================= */
    MAP_TEXTS_STYLE: {
      fontFamily: '"Roboto Mono", monospace',
      fontSize: 16,                 // px
      color: "rgba(254,252,247,.85)",
      lineHeight: 1.25,             // multiplier
      letterSpacing: "0px",
      textTransform: "none",        // none | uppercase | lowercase
      opacity: 1,
      maxWidth: null,               // number (px) or null
      align: "left",                // left | center | right
      zIndex: 30,
      rotate: 0,                    // deg
      pointerEvents: "none",        // keep map draggable
      // optional glow like your neon vibe:
      textShadow: "0 0 10px rgba(254,252,247,.12)"
    },

    MAP_TEXTS: [
      {
        id: "t1",
        x: -474,
        y: 928,
        text: "she digs into the finest fluff\nwith gentle claws\nbetween fringes she plucks",
        fontSize: 13,
        color: "#fefcf7",
        maxWidth: null,
        rotate: 0,
        goto: {
          x: 2400,
          y: -744,
          zoom: 0
        },
        hoverColor: "#ffffff",
        cursor: "pointer"
      },

      {
        id: "t2",
        x: -410,
        y: -1200,
        text: "JA - Tanu - R",
        fontSize: 13,
        color: "#fefcf7",
        maxWidth: null,
        rotate: 0,
        goto: {
          x: 2680,
          y: 280
        },
        hoverColor: "#ffffff",
        cursor: "pointer"
      }
    ],
    /* ======================= END NEW ======================= */

    // IMAGES
    MAP_IMAGES: [
      {
        src:"https://static.wixstatic.com/media/0f3578_16e80d61816447c88decdfff57a41cb8~mv2.png/v1/fill/w_799,h_985,al_c,q_90,enc_avif,quality_auto/0f3578_16e80d61816447c88decdfff57a41cb8~mv2.png",
        x: 3000, y: 1500, w: 300, rot: 0, op: 1,
        goto: { x: -2300, y: 1200, zoom: 1 }
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
        x: -434, y: -132, w: 300, rot: 0, op: 1,
        jumpOnHover: true,
        jumpRange: 300,
        jumpCooldownMs: 250,
        jumpMinMove: 200
      }, // blubiiird

      {
        src:"https://static.wixstatic.com/media/0f3578_fd1e418ae03b4f43ba6b6b226ec4b528~mv2.png/v1/fill/w_724,h_554,al_c,q_90,enc_avif,quality_auto/0f3578_fd1e418ae03b4f43ba6b6b226ec4b528~mv2.png",
        x: 3200, y: 900, w: 270, rot: 0, op: 1,
        jumpOnHover: true,
        jumpRange: 300,
        jumpCooldownMs: 250,
        jumpMinMove: 200
      }, // waterviech

      {
        src:"https://static.wixstatic.com/media/0f3578_28aec9253a414b8a9808464358975ce4~mv2.png/v1/fill/w_626,h_472,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/0f3578_28aec9253a414b8a9808464358975ce4~mv2.png",
        x: -1200, y: 3000, w: 300, rot: 0, op: 1,
        href: "https://mothermountain.bandcamp.com/album/mother-mountain"
      } // mother mountain cover
    ],

    // YOUTUBE
    MAP_YOUTUBE: [
      { url:"https://youtu.be/9gh8qjxcoOA", x: 400, y: 2000, w: 480, h: 270, rot: 0, op: 1, mute: 1, controls: 1 }
    ]
  });
})();
