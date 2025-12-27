/* poem-system.js
   Self-contained poem generator + freeze-on-movement logic.
   Expects:
     <div id="poem"></div>
     <div id="status"></div>
*/

(() => {
  "use strict";

  /* ================== WORD DATABASE ================== */

  const DET = ["the","a","this","that","these","those","my","your","our","her","his","their","no","all","every"];
  const PRON = ["i","you","we","they","me","us","them","she","he","it","who","someone","no one"];
  const PREP = ["in","on","into","through","beneath","between","b'tween","with","without","under","above","from","for","of","to","as","like","behind","around"];
  const CONJ = ["and","but","so","yet","or","cause","when","where","while","though","if","then","until","as","because","in case"];
  const AUX  = ["am","are","is","was","were","be","been","do","did","dont","can","could","will","would","have","has","had"];
  const NEG  = ["not","nothing","never","no"];
  const MOD  = ["very","too","still","just","always","ever","never","slowly","finally","forever","again","now","soon","already","perhaps","hardly","still"];

  const SOUND = [
    "clattering","ratteling","hissing","whizzing","snarling",
    "spinning","whirling","wobbling","shuddering",
    "clicking","clacking","creaking","tapping",
    "huffing","puffing","humming","buzzing",
    "howl","gobble","jingle","cluck",
    "knock","squeak","cackle","chirping","blissing","karrkarr","vef-rok"
  ];

  const VERB = [
    "ask","care","open","close","mind","throw","quit","see","tell","offer","sell",
    "guard","hold","face","love","fear","sling","cut","drift","glide","crack",
    "hurt","keep","clean","bow","look","live","take","come","push","reach",
    "poke","squeeze","use","escape","breathe","dive","build","search","walk",
    "weep","sing","stop","stumble","crumble","break","remember","swallow",
    "hollow","save","mourn","start","rule","tell","spread","shed","grow","fall",
    "wait","count","share","lose","find","go","wave","ride","try","shed","bleed",
    "arrive","welcome","miss","return","dig","weave","fade","laugh","change",
    "bring","call","fly","prefer","stay","float","connect","lead","reshape",
    "cherish","emerge","wait","renounce","rise","explore","regret","unearthed"
  ];

  const NOUN = [
    "world","gates","blinds","fit","veils","goods","edge","key","plea","change",
    "shift","rope","window","scapegoat","punch bag","hero","flowers","daisy",
    "rose","lily","tulip","pearls","peas","turf","earth","backbone","neurones",
    "trash","trolls","root","core","cloud","mother","forest","love","kingdom",
    "skin","lava","heart","lover","travels","sand","dirt","gravel",
    "dust","spore","doubts","tunnels","maze","airways","light","net","birth",
    "dusk","pain","carcass","journey","companion","meadow","promise","birds",
    "night","wound","water","waves","critters","pebbles","stay","marrow",
    "ashes","snow","graves","key","beliefs","battle line","share","repair",
    "truth","womb","talons","bones","shell","hands","mouth","throat","tomb",
    "house","trees","morasts","shadows","land","skies","weights","home","trip",
    "past","phantom pains","needle","thread","stories","voices","path","throne",
    "daughters","crown","heartbeat","roots","kiss","father","box","compass",
    "north","dreams","memory","bowl","spiral","milk","animals","spring","pillars",
    "promise","city","ruins","relics","crimes","storm","spark","spaceship",
    "pitfall","trapdoors","cracks","ceiling","body","skeleton","scaffolding",
    "temple","death","goddess","sinsta","roar","urd","tork-vrrum"
  ];

  const ADJ = [
    "two-faced","dual","open","closed","ever lasting","green","hard","cold",
    "wounded","wild","calm","restless","brand new","thick","eternal","dark",
    "deep","lost","black","sweet","gentle","fine","sacred","beautiful","small",
    "invisible","strong","weak","single","distant","soft","lonely","trembling"
  ];

  /* ============ SAFE MERGE + FALLBACK ============ */

  const WORDS = [
    ...DET, ...PRON, ...PREP, ...CONJ, ...AUX, ...NEG, ...MOD,
    ...SOUND, ...VERB, ...NOUN, ...ADJ
  ].filter(w => typeof w === "string" && w.trim().length);

  const rint = (a,b)=> Math.floor(Math.random()*(b-a+1))+a;
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];

  /* grammar-ish patterns */
  const PATTERNS = [
    () => [pick(DET),  pick(ADJ),  pick(NOUN)],
    () => [pick(PRON), pick(VERB)],
    () => [pick(PRON), pick(VERB), pick(DET), pick(NOUN)],
    () => [pick(ADJ),  pick(NOUN)],
    () => [pick(VERB), pick(PREP), pick(DET), pick(NOUN)],
    () => [pick(NOUN), pick(CONJ), pick(NOUN)],
    () => [pick(VERB), pick(MOD)],
    () => [pick(SOUND), pick(PREP), pick(DET), pick(NOUN)]
  ];

  function makeLine(){
    return pick(PATTERNS)().join(" ").replace(/\s+/g," ").trim();
  }

  function mutateLine(line){
    const parts = String(line).split(" ").filter(Boolean);
    if (!parts.length) return makeLine();

    const i = rint(0, parts.length - 1);

    const roll = Math.random();
    let pool = WORDS;
    if (roll < 0.20) pool = VERB;
    else if (roll < 0.40) pool = NOUN;
    else if (roll < 0.55) pool = ADJ;
    else if (roll < 0.70) pool = MOD;
    else if (roll < 0.82) pool = PREP;
    else if (roll < 0.92) pool = DET;

    parts[i] = pick(pool);
    return parts.join(" ");
  }

  function initPoemSystem(userCfg = {}) {
    const poemEl = document.getElementById("poem");
    const statusEl = document.getElementById("status");

    if (!poemEl || !statusEl) {
      console.warn("[poem-system] Missing #poem or #status element.");
      return;
    }

    if (!WORDS.length) {
      poemEl.textContent =
        "no words\n\n" +
        "the system waits\n" +
        "but nothing arrives";
      statusEl.textContent = "word list empty";
      return;
    }

    const cfg = {
      MAX_LINES: 12,
      START_LINES: 9,
      TICK_MS: 900,
      STILLNESS_MS: 650,
      ...userCfg
    };

    let lines = [];
    let frozen = false;
    let stillTimer = null;
    let intervalId = null;

    function render(){
      poemEl.textContent = lines.join("\n");
    }

    function seed(){
      lines = [];
      const n = Math.min(cfg.MAX_LINES, Math.max(4, cfg.START_LINES));
      for(let i=0;i<n;i++) lines.push(makeLine());
      render();
    }

    function evolve(){
      if (frozen) return;
      if (!lines.length) seed();

      const m = Math.random();

      if (m < 0.72) {
        const idx = rint(0, lines.length - 1);
        lines[idx] = mutateLine(lines[idx]);
      } else if (m < 0.92) {
        const idx = rint(0, lines.length - 1);
        lines[idx] = makeLine();
      } else {
        const idx = rint(0, lines.length - 1);
        lines[idx] = makeLine();
      }

      if (lines.length > cfg.MAX_LINES) lines = lines.slice(0, cfg.MAX_LINES);
      render();
    }

    function setFrozen(v){
      frozen = !!v;
      document.body.classList.toggle("frozen", frozen);
      statusEl.textContent = frozen ? "frozen" : "";
    }

    function onDisturb(){
      setFrozen(true);
      clearTimeout(stillTimer);
      stillTimer = setTimeout(() => setFrozen(false), cfg.STILLNESS_MS);
    }

    ["mousemove","touchmove","wheel","keydown"].forEach(ev=>{
      window.addEventListener(ev, onDisturb, { passive: true });
    });

    setFrozen(false);
    seed();
    intervalId = setInterval(evolve, cfg.TICK_MS);

    // Optional: expose a tiny API for debugging
    window.__POEM__ = {
      reseed: seed,
      freeze: () => setFrozen(true),
      unfreeze: () => setFrozen(false),
      stop: () => { if (intervalId) clearInterval(intervalId); intervalId = null; }
    };
  }

  // Auto-start on DOM ready, with optional config via window.POEM_CONFIG
  const start = () => initPoemSystem(window.POEM_CONFIG || {});
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
