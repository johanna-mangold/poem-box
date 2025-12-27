(() => {
  const KMAP = window.KMAP;
  if (!KMAP) return;

  const poemEl = document.getElementById("poem");
  if (!poemEl) return;

  // ✅ register as POI target
  KMAP.registerPOIHitTest((target) => target && (target === poemEl || poemEl.contains(target)));

  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

  const isCoarse = matchMedia("(pointer: coarse)").matches;
  const noHover  = matchMedia("(hover: none)").matches;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CHEAP_VISUALS = (isCoarse || noHover || reduceMotion);

  let intensity = CHEAP_VISUALS ? (reduceMotion ? 0.30 : 0.80) : 1.0;
  let SCAR_PERSIST = CHEAP_VISUALS ? 0.28 : 0.22;
  let HEAL_RATE    = CHEAP_VISUALS ? 0.007 : 0.010;
  const USE_BLUR   = !CHEAP_VISUALS;

  function buildPoemFromExistingText(){
    const text = poemEl.textContent.replace(/\r\n/g, "\n").trimEnd();
    poemEl.innerHTML = "";
    const parts = text.split(/(\s+)/);
    for(const part of parts){
      if(part.trim()===""){
        poemEl.appendChild(document.createTextNode(part));
      } else {
        const span = document.createElement("span");
        span.className = "w";
        span.textContent = part;
        span.dataset.seed = (Math.random()*1000).toFixed(3);
        span.dataset.cx = "0";
        span.dataset.cy = "0";
        span.dataset.sx = "0";
        span.dataset.sy = "0";
        poemEl.appendChild(span);
      }
    }
  }
  buildPoemFromExistingText();

  let els = Array.from(poemEl.querySelectorAll(".w"));
  let poemBox = null;

  function snapshotBasePositions(){
    const pr = poemEl.getBoundingClientRect();
    poemBox = { w: pr.width, h: pr.height, left: pr.left, top: pr.top };

    els = Array.from(poemEl.querySelectorAll(".w"));
    for(const el of els){
      const r = el.getBoundingClientRect();
      el._baseX = (r.left - pr.left) + r.width/2;
      el._baseY = (r.top  - pr.top)  + r.height/2;
      el._halfW = r.width/2;
      el._halfH = r.height/2;
    }
  }
  requestAnimationFrame(snapshotBasePositions);

  const ro = new ResizeObserver(() => snapshotBasePositions());
  ro.observe(poemEl);

  let targetX=null, targetY=null, ticking2=false;
  let isInteracting=false;

  function requestDistortion(x,y){
    targetX=x; targetY=y;
    if(!ticking2){
      ticking2=true;
      requestAnimationFrame(()=>{
        snapshotBasePositions();
        applyDistortion(targetX,targetY);
        ticking2=false;
      });
    }
  }

  function applyDistortion(x,y){
    if(!poemBox) return;
    isInteracting=true;

    const mx = x ?? (poemBox.left + poemBox.w/2);
    const my = y ?? (poemBox.top  + poemBox.h/2);

    const maxR = Math.hypot(poemBox.w, poemBox.h) * 0.30;
    const tt = performance.now() * 0.001;
    const pad = 6;

    for(const el of els){
      const baseX = el._baseX || 0;
      const baseY = el._baseY || 0;

      const wx = poemBox.left + baseX;
      const wy = poemBox.top  + baseY;

      const dx = wx - mx;
      const dy = wy - my;
      const dist = Math.hypot(dx, dy);
      const near = 1 - clamp(dist / maxR, 0, 1);

      const seed = parseFloat(el.dataset.seed || "0");
      const noise =
        Math.sin(tt*3.2 + seed) * 0.55 +
        Math.cos(tt*2.4 + seed*1.7) * 0.55;

      const push = near * 40 * intensity;
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);

      let tx = nx * push + noise * near * 12 * intensity;
      let ty = ny * push + noise * near * 8  * intensity;

      const sx = parseFloat(el.dataset.sx || "0");
      const sy = parseFloat(el.dataset.sy || "0");
      tx += sx; ty += sy;

      const halfW = el._halfW || 0;
      const halfH = el._halfH || 0;

      const minX = halfW + pad;
      const maxX = poemBox.w - halfW - pad;
      const minY = halfH + pad;
      const maxY = poemBox.h - halfH - pad;

      let newX = clamp(baseX + tx, minX, maxX);
      let newY = clamp(baseY + ty, minY, maxY);

      tx = newX - baseX;
      ty = newY - baseY;

      const ease = 0.35;
      const cxp = parseFloat(el.dataset.cx || "0");
      const cyp = parseFloat(el.dataset.cy || "0");
      const smx = cxp + (tx - cxp) * ease;
      const smy = cyp + (ty - cyp) * ease;

      el.dataset.cx = String(smx);
      el.dataset.cy = String(smy);

      const add = SCAR_PERSIST * near;
      el.dataset.sx = String(sx + (smx - sx) * add);
      el.dataset.sy = String(sy + (smy - sy) * add);

      const rot = noise * near * (CHEAP_VISUALS ? 2.8 : 3.5) * intensity;

      el.style.transform =
        `translate3d(${smx.toFixed(2)}px, ${smy.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;

      // ✅ opacity fix
      el.style.opacity = "1";

      if(USE_BLUR){
        const blur = near * 0.6 * intensity;
        el.style.filter = `blur(${blur.toFixed(2)}px)`;
      } else {
        el.style.filter = "none";
      }
    }
  }

  function healTick(){
    for(const el of els){
      const sx = parseFloat(el.dataset.sx || "0");
      const sy = parseFloat(el.dataset.sy || "0");

      const nsx = sx + (0 - sx) * HEAL_RATE;
      const nsy = sy + (0 - sy) * HEAL_RATE;

      el.dataset.sx = (Math.abs(nsx) < 0.02) ? "0" : String(nsx);
      el.dataset.sy = (Math.abs(nsy) < 0.02) ? "0" : String(nsy);

      if(!isInteracting){
        const cx = parseFloat(el.dataset.cx || "0");
        const cy = parseFloat(el.dataset.cy || "0");
        const follow = 0.08;

        const fx = cx + (nsx - cx) * follow;
        const fy = cy + (nsy - cy) * follow;

        el.dataset.cx = String(fx);
        el.dataset.cy = String(fy);

        el.style.transform = `translate3d(${fx.toFixed(2)}px, ${fy.toFixed(2)}px, 0) rotate(0deg)`;
        el.style.opacity = "1";
        if(!USE_BLUR) el.style.filter = "none";
      }
    }

    isInteracting = false;
    requestAnimationFrame(healTick);
  }
  requestAnimationFrame(healTick);

  // stop propagation on poem itself
  poemEl.addEventListener("pointerdown", (e)=>KMAP.stop(e), {passive:true});
  poemEl.addEventListener("pointermove", (e)=>KMAP.stop(e), {passive:true});
  poemEl.addEventListener("touchstart",  (e)=>KMAP.stop(e), {passive:true});
  poemEl.addEventListener("touchmove",   (e)=>KMAP.stop(e), {passive:true});

  poemEl.addEventListener("mousemove", (e)=> requestDistortion(e.clientX, e.clientY), {passive:true});
  poemEl.addEventListener("touchmove", (e)=>{
    const t = e.touches[0];
    if(t) requestDistortion(t.clientX, t.clientY);
  }, {passive:true});
})();

