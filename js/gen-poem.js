(() => {
  const KMAP = window.KMAP;
  if (!KMAP) return;

  const genPOI = document.getElementById("genPOI");
  const genPoemBox = document.getElementById("genPoemBox");
  const genResetBtn = document.getElementById("genReset");
  if (!genPOI || !genPoemBox) return;

  // ✅ register as POI target
  KMAP.registerPOIHitTest((target) => target && (target === genPOI || genPOI.contains(target)));

  genPOI.addEventListener("pointerdown", (e)=>KMAP.stop(e), {passive:true});
  genPOI.addEventListener("pointermove", (e)=>KMAP.stop(e), {passive:true});
  genPOI.addEventListener("touchstart",  (e)=>KMAP.stop(e), {passive:true});
  genPOI.addEventListener("touchmove",   (e)=>KMAP.stop(e), {passive:true});

  const MAX_LINES = 7;
  const MAX_CHARS = 1800;

  const TYPE_MIN_MS = 10;
  const TYPE_MAX_MS = 38;
  const NEWLINE_PAUSE_MS = 140;
  const PUNCT_PAUSE_MS = 90;

  let isTyping = false;
  let typeTimer = null;

  function clearTypeTimer(){
    if (typeTimer) { clearTimeout(typeTimer); typeTimer = null; }
  }

  function nextDelayForChar(ch){
    let base = TYPE_MIN_MS + Math.random() * (TYPE_MAX_MS - TYPE_MIN_MS);
    if (ch === "\n") base += NEWLINE_PAUSE_MS;
    else if (ch === "." || ch === "," || ch === "—" || ch === "…" || ch === "!" || ch === "?") base += PUNCT_PAUSE_MS;
    return base;
  }

  function typeText(target, fullText){
    if (isTyping) return;
    isTyping = true;
    clearTypeTimer();
    target.textContent = "";
    let i = 0;

    const step = () => {
      target.textContent += fullText.charAt(i);
      const ch = fullText.charAt(i);
      i++;

      if (i >= fullText.length) {
        isTyping = false;
        clearTypeTimer();
        return;
      }
      typeTimer = setTimeout(step, nextDelayForChar(ch));
    };

    typeTimer = setTimeout(step, 120);
  }

  function triggerGenerate(){
    if (isTyping) return;

    const poem = generatePoem({
      lines: MAX_LINES,
      width: 66,
      stanzaBreakProbability: 0.22,
      boxTextBlockProbability: 0.20,
      codeBlockProbability: 0.40
    });

    typeText(genPoemBox, poem);
  }

  genPoemBox.addEventListener("click", triggerGenerate);
  genPoemBox.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") triggerGenerate();
  });

  if (genResetBtn){
    genResetBtn.addEventListener("pointerdown", (e)=>{ e.preventDefault(); KMAP.stop(e); }, {passive:false});
    genResetBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      KMAP.stop(e);
      clearTypeTimer();
      isTyping = false;
      genPoemBox.textContent = "click";
    }, {passive:false});
    genResetBtn.addEventListener("touchstart", (e)=>{ e.preventDefault(); KMAP.stop(e); }, {passive:false});
  }

  const DET = ["the","a","this","that","these","those","my","your","our","her","his","their","no","all","every"];
  const PRON = ["i","you","we","they","me","us","them","she","he","it","who","someone","no one"];
  const PREP = ["in","on","into","through","beneath","between","with","without","under","above","from","for","of","to","as","like","behind","around"];
  const CONJ = ["and","but","so","yet","or","cause","when","where","while","though","if","then","until","as","because","in case"];
  const AUX = ["am","are","is","was","were","be","been","do","did","dont","can","could","will","would","have","has","had"];
  const NEG = ["not","nothing","never","no"];
  const MOD = ["very","too","still","just","always","ever","never","slowly","finally","forever","again","now","soon","already","perhaps","hardly","still"];

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
    "two-faced","dual-gaze","open","closed","ever lasting","green","hard","cold",
    "wounded","wild","calm","restless","brand new","thick","eternal","dark",
    "deep","lost","black","sweet","gentle","fine","sacred","beautiful","small",
    "invisible","strong","weak","single","distant","soft","lonely","trembling"
  ];

  const PHRASE = [
    "the clattering ratteling","the hissing and whizzing","who open doors",
    "beneath your trembling paws","the spinning and whirling","the wobbling and shuddering",
    "dance the edge","climb the hedge","hold the pledge","clicking clacking",
    "the huffing and puffing","the humming and buzzing","stir your wings","hold fast",
    "this world and the next","howl and gobble","jingle and cluck","draw the line",
    "ooze and loam","forever home","we draw a door on the wall","through our eyes",
    "bring her","a gift","the threshold","knock knock","the wild ones","stretches long",
    "stretches tight","glance-shout","around the feathers","tight around","cracks into me",
    "my old wings","when i sing","in the forest","i walk alone","in the meadow",
    "they are weeping","i could not keep","her skin","her heart","catch us mother",
    "when we fall","see through","i trust","i do as i please","my temple","a pitfall",
    "a spaceship","enter the muck",
  ];

  const TEMPLATES = [
    ["VERB","DET?","ADJ?","NOUN"],
    ["DET","NOUN","VERB","PREP","DET?","NOUN"],
    ["PREP","DET?","ADJ?","NOUN"],
    ["PRON","VERB","PREP","DET?","NOUN"],
    ["CONJ","MOD?","VERB","CONJ","VERB","PREP?","PRON?"],
    ["CONJ","DET?","NOUN","VERB","MOD?"],
    ["CONJ","DET?","NOUN","AUX?","NEG?","VERB"],
    ["SOUND","SOUND","SOUND","SOUND"],
    ["PHRASE"]
  ];

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickN(arr, n) { const out = []; for (let i = 0; i < n; i++) out.push(pick(arr)); return out; }
  function chance(p) { return Math.random() < p; }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

  function generatePoem(opts) {
    const cfg = {
      lines: (opts && opts.lines) ? opts.lines : 18,
      width: (opts && opts.width) ? opts.width : 66,
      stanzaBreakProbability: clamp01((opts && opts.stanzaBreakProbability) ?? 0.20),
      punctuationProbability: 0.25,
      lineBreakProbability: 0.14,
      boxTextBlockProbability: clamp01((opts && opts.boxTextBlockProbability) ?? 0.18),
      codeBlockProbability: clamp01((opts && opts.codeBlockProbability) ?? 0.08),
      titleProbability: 0.25
    };

    const out = [];

    if (chance(cfg.titleProbability)) {
      out.push(makeTitle());
      out.push("");
    }

    let i = 0;
    let lastWasBlock = false;

    while (i < cfg.lines) {
      if (!lastWasBlock && i > 0 && chance(cfg.boxTextBlockProbability)) {
        const panel = makeBoxedTextBlock();
        out.push(...boxLike(panel, cfg.width));
        out.push("");
        lastWasBlock = true;
        i += 1;
        continue;
      }

      if (!lastWasBlock && i > 0 && chance(cfg.codeBlockProbability)) {
        const panel = makeCodePoemBlock();
        out.push(...boxLike(panel, cfg.width));
        out.push("");
        lastWasBlock = true;
        i += 1;
        continue;
      }

      let line = genSyntacticLine(cfg.punctuationProbability, cfg.lineBreakProbability);
      out.push(...wrapPreservingNewlines(line, cfg.width));
      lastWasBlock = false;

      if (chance(cfg.stanzaBreakProbability)) out.push("");
      i += 1;
    }

    while (out.length && out[out.length - 1] === "") out.pop();
    return limitPoemLines(out).join("\n");
  }

  function makeTitle() {
    const parts = chance(0.45) ? pickN(NOUN, randInt(1, 2)) : [pick(PHRASE)];
    const sep = pick([" ", " / ", " — "]);
    return parts.join(sep).toUpperCase();
  }

  function pickFromKey(key) {
    switch (key) {
      case "DET": return pick(DET);
      case "PRON": return pick(PRON);
      case "PREP": return pick(PREP);
      case "CONJ": return pick(CONJ);
      case "AUX": return pick(AUX);
      case "NEG": return pick(NEG);
      case "MOD": return pick(MOD);
      case "NOUN": return pick(NOUN);
      case "VERB": return pick(VERB);
      case "ADJ": return pick(ADJ);
      case "SOUND": return pick(SOUND);
      case "PHRASE": return pick(PHRASE);
      default: return "";
    }
  }

  function cleanup(s) {
    return String(s)
      .replace(/\s+/g, " ")
      .replace(/\b(the)\s+\1\b/gi, "$1")
      .replace(/\b(and)\s+\1\b/gi, "$1")
      .replace(/\b(cause)\s+cause\b/gi, "cause")
      .replace(/\bi am am\b/gi, "i am")
      .trim();
  }

  function genSyntacticLine(punctProb, breakProb) {
    const tpl = pick(TEMPLATES);
    const parts = [];

    for (let idx = 0; idx < tpl.length; idx++) {
      const slot = tpl[idx];
      const optional = slot.endsWith("?");
      const key = optional ? slot.slice(0, -1) : slot;
      if (optional && chance(0.38)) continue;
      parts.push(pickFromKey(key));
    }

    let line = cleanup(parts.join(" "));

    if (chance(breakProb) && line.split(" ").length >= 6) {
      const words = line.split(" ");
      const cut = randInt(3, Math.min(7, words.length - 1));
      line = words.slice(0, cut).join(" ") + "\n" + " ".repeat(randInt(1, 6)) + words.slice(cut).join(" ");
    }

    if (chance(punctProb)) line += pick(["", ",", ".", "—", "..."]);
    return line;
  }

  function makeBoxedTextBlock() {
    const lines = [];
    const n = randInt(3, 6);

    if (chance(0.55)) lines.push(pick(PHRASE));
    else lines.push(pickN(SOUND, randInt(3, 5)).join(" "));

    for (let i = 1; i < n; i++) lines.push(genSyntacticLine(0.35, 0.0));
    return lines;
  }

  function makeCodePoemBlock() {
    const template = pick(["ritual", "listener", "binder", "threshold", "inventory", "walkstate"]);
    if (template === "listener") return codeBlockListener();
    if (template === "binder") return codeBlockBinder();
    if (template === "threshold") return codeBlockThresholdV2();
    if (template === "inventory") return codeBlockInventory();
    if (template === "walkstate") return codeBlockWalkState();
    return codeBlockRitual();
  }

  function w(key) { return pickFromKey(key); }

  function token(key) {
    return String(w(key))
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24) || "thing";
  }

  function q(s) {
    const safe = String(s).replace(/"/g, '\\"');
    return "\"" + safe + "\"";
  }

  function textFromVocab() {
    const choice = pick(["PHRASE", "PHRASE", "NOUN", "NOUN", "SOUND", "ADJ"]);
    return q(w(choice));
  }

  function argList(n) {
    const args = [];
    for (let i = 0; i < n; i++) {
      const k = pick(["NOUN","VERB","ADJ","SOUND","PREP","MOD"]);
      args.push(q(w(k)));
    }
    return args.join(", ");
  }

  function codeBlockRitual() {
    const action = token("VERB");
    const a = w("NOUN");
    const b = w("NOUN");
    const adj = w("ADJ");

    return [
      `def ${action}(thing, *, as_what=${textFromVocab()}):`,
      "    # a function is a small vow",
      `    return ${q(String(adj) + " " + String(a))}`,
      "",
      `# invocation`,
      `${action}(${q(b)}, as_what=${textFromVocab()})`
    ];
  }

  function codeBlockListener() {
    const hear = token("VERB");
    const body = w("NOUN");
    const soundLine = pickN(SOUND, randInt(3, 6)).join(" ");

    return [
      `def ${hear}(to, with_what=${q(body)}):`,
      "    # listening is pressure",
      `    return ${q(soundLine)}`,
      "",
      "def chorus(*sounds):",
      "    return sounds",
      "",
      `sounds = chorus(${argList(randInt(4, 7))})`,
      `${hear}(sounds, with_what=${q(body)})`
    ];
  }

  function codeBlockBinder() {
    const bind = token("VERB");
    const thing = w("NOUN");
    const to = w("NOUN");
    const tight = w("ADJ");
    const prep = w("PREP");

    return [
      `def ${bind}(thing, *, to=${q(to)}, tension=${q(tight)}):`,
      "    # connection is a controlled tear",
      `    return thing + ${q(" " + prep + " ")} + to`,
      "",
      `${bind}(${q(thing)}, to=${q(to)}, tension=${q(tight)})`,
      `return ${textFromVocab()}`
    ];
  }

  function codeBlockThresholdV2() {
    const enter = "enter";
    const place = w("NOUN");
    const bring = w("NOUN");
    const condition = pick(["heart","flesh","soul","promise","gift","threshold","door"]);
    const line = w("PHRASE");

    return [
      `def ${enter}(place, *, bring=${q(bring)}):`,
      "    # to enter: to bring something named",
      `    if ${q(condition)} in ${textFromVocab()}:`,
      `        return ${q("open wide")}`,
      `    return ${q(line)}`,
      "",
      `${enter}(${q(place)}, bring=${q(bring)})`
    ];
  }

  function codeBlockInventory() {
    const fn = token("VERB");
    const items = [w("NOUN"), w("NOUN"), w("NOUN")].map(q).join(", ");

    return [
      `def ${fn}(*items):`,
      "    # an inventory that wants to be a spell",
      `    return ${q(" / ")}.join(items)`,
      "",
      `items = (${items})`,
      `return ${fn}(*items)`
    ];
  }

  function codeBlockWalkState() {
    const place = w("NOUN");
    const state = w("ADJ");
    const verb = token("VERB");

    return [
      `def walk(state=${q("alone")}):`,
      "    return state",
      "",
      `${token("PREP")}_${token("NOUN")}:`,
      `    they are ${q(state)}`,
      "",
      `${verb}(${q(place)})`,
      "walk()"
    ];
  }

  function boxLike(lines, width) {
    const maxInner = Math.min(62, Math.max(34, width));
    const innerWidth = Math.min(Math.max(...lines.map(l => l.length), 0), maxInner);

    const top = "+" + "-".repeat(innerWidth + 2) + "+";
    const bot = "+" + "-".repeat(innerWidth + 2) + "+";

    const out = [top];
    for (const l of lines) {
      const trimmed = l.length > innerWidth ? l.slice(0, innerWidth) : l;
      out.push("| " + trimmed.padEnd(innerWidth, " ") + " |");
    }
    out.push(bot);
    return out;
  }

  function limitPoemLines(lines) {
    const out = [];
    let charCount = 0;
    for (const line of lines) {
      if (out.length >= MAX_LINES) break;
      charCount += (line.length + 1);
      if (charCount >= MAX_CHARS) break;
      out.push(line);
    }
    return out;
  }

  function wrapPreservingNewlines(text, width) {
    const parts = String(text).split("\n");
    const out = [];
    for (const p of parts) out.push(...wrapLine(p, width));
    return out;
  }

  function wrapLine(line, width) {
    if (line.length <= width) return [line];
    const words = line.split(/\s+/);
    const out = [];
    let cur = "";
    for (const w of words) {
      if (!cur) { cur = w; continue; }
      if ((cur + " " + w).length <= width) cur += " " + w;
      else { out.push(cur); cur = w; }
    }
    if (cur) out.push(cur);
    return out;
  }
})();

