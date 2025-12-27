(() => {
  const KMAP = window.KMAP;
  if (!KMAP || !window.p5) return;

  const viewport = KMAP.viewport;
  const p5Host = document.getElementById("p5POI");
  const p5ResetBtn = document.getElementById("p5Reset");
  if (!p5Host) return;

  // ✅ register as POI target
  KMAP.registerPOIHitTest((target) => target && (target === p5Host || p5Host.contains(target)));

  p5Host.addEventListener("pointerdown", (e)=>KMAP.stop(e), {passive:true});
  p5Host.addEventListener("pointermove", (e)=>KMAP.stop(e), {passive:true});
  p5Host.addEventListener("touchstart",  (e)=>KMAP.stop(e), {passive:true});
  p5Host.addEventListener("touchmove",   (e)=>KMAP.stop(e), {passive:true});

  if (p5ResetBtn){
    p5ResetBtn.addEventListener("pointerdown", (e)=>{ e.preventDefault(); KMAP.stop(e); }, {passive:false});
    p5ResetBtn.addEventListener("click", (e)=>{ e.preventDefault(); KMAP.stop(e); }, {passive:false});
    p5ResetBtn.addEventListener("touchstart", (e)=>{ e.preventDefault(); KMAP.stop(e); }, {passive:false});
  }

  let p5Instance = null;

  const sketch = (p) => {
    const CELL = 50;

    const WORD_LEN = 5;
    const LOCK_AT  = 5;
    const CELL_CAP = 7;

    const START_FILL_RATIO = 0.16;
    const MAX_FILL_RATIO   = 0.42;

    const START_N_MAX = 180;
    const MAX_N_MAX   = 520;

    const SPAWN_EVERY_MS_BASE = 420;

    const STEP_MS = 1100;
    const DRIFT   = 0.12;
    const DAMPING = 0.985;

    const POINTER_RADIUS = 85;
    const POINTER_PUSH   = 3.3;

    const BURST_SPEED_MIN = 120;
    const BURST_SPEED_MAX = 220;
    const BURST_DAMPING   = 0.88;
    const BURST_BOUNCE    = 0.75;
    const REORDER_EASE    = 8.0;
    const REORDER_AFTER_S = 0.08;
    const BURST_TOTAL_S   = 0.55;

    const BASE_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
    const VOWELS = ["a","e","i","o","u"];
    const EXTRA_VOWELS_PER_BAG = 24;

    let cols = 1, rows = 1;
    let agents = [];
    let lockedCells = [];
    let occCount = [];

    let letterBag = [];
    let lastSpawnAt = 0;
    let nextId = 1;

    let START_N = 120;
    let MAX_N   = 420;
    let SPAWN_EVERY_MS = SPAWN_EVERY_MS_BASE;

    let pointerX = -9999, pointerY = -9999;
    let pointerActive = false;
    let prevPointerCellKey = -1;

    let ro2 = null;
    let lastW = -1, lastH = -1;

    p.setup = () => {
      const cnv = p.createCanvas(10,10);
      cnv.parent(p5Host);

      applyPixelDensity();

      p.textFont("Roboto Mono");
      p.textAlign(p.CENTER, p.CENTER);

      attachPointerHandlers();
      resizeToHost(true);

      if ("ResizeObserver" in window) {
        ro2 = new ResizeObserver(() => resizeToHost(false));
        ro2.observe(p5Host);
      }

      resetSim();
    };

    function applyPixelDensity(){
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      p.pixelDensity(dpr);
    }

    p.draw = () => {
      p.background(255);
      drawGrid();

      const now = p.millis();
      const dt = Math.min(0.05, p.deltaTime / 1000);

      if (agents.length < MAX_N && now - lastSpawnAt >= SPAWN_EVERY_MS) {
        if (trySpawnAgent(18)) lastSpawnAt = now;
        else lastSpawnAt = now;
      }

      occCount.fill(0);
      for (let a of agents){
        const k = keyOf(a.c, a.r);
        occCount[k] = (occCount[k] || 0) + 1;
      }

      const occFree = new Map();
      for (let i=0; i<agents.length; i++){
        const a = agents[i];
        if (a.locked) continue;
        const k = keyOf(a.c, a.r);
        if (!occFree.has(k)) occFree.set(k, []);
        occFree.get(k).push(i);
      }
      for (const [k, idxs] of occFree.entries()){
        if (lockedCells[k]) continue;
        if (idxs.length >= LOCK_AT) lockCell(k, idxs);
      }

      const hoverKey = pointerActive ? hoveredCellKey(pointerX, pointerY) : -1;

      if (hoverKey !== prevPointerCellKey) {
        if (hoverKey !== -1 && lockedCells[hoverKey]) startBurstForCell(hoverKey, now);
        prevPointerCellKey = hoverKey;
      }

      const fs = autoFontSize();
      p.textSize(fs);

      for (let a of agents){
        if (!a.locked){
          if (pointerActive) a.applyPointer(pointerX, pointerY);
          a.updateFree(now);
        } else {
          a.updateLocked(now, dt, hoverKey);
        }
      }

      p.noStroke();
      p.fill(0);
      for (let a of agents){
        const pos = a.renderPosition();
        const ch = (typeof a.char === "string" && a.char.length) ? a.char : "?";
        p.text(ch, pos.x, pos.y);
      }
    };

    function constrain(v,a,b){ return Math.max(a, Math.min(b, v)); }

    function recomputeAdaptiveCounts(){
      const totalCells = cols * rows;
      const capacity = totalCells * CELL_CAP;

      START_N = Math.floor(constrain(capacity * START_FILL_RATIO, 20, START_N_MAX));
      MAX_N   = Math.floor(constrain(capacity * MAX_FILL_RATIO, START_N + 20, MAX_N_MAX));

      const slowFactor = constrain(p.map(totalCells, 40, 220, 1.55, 1.0), 1.0, 1.65);
      SPAWN_EVERY_MS = Math.floor(SPAWN_EVERY_MS_BASE * slowFactor);
    }

    function lockCell(k, idxs){
      lockedCells[k] = true;
      const rc = cellFromKey(k);
      const list = idxs.map(i => agents[i]);
      const targets = computeSlotTargets(list.length);

      for (let n=0; n<list.length; n++){
        const a = list[n];
        a.locked = true;
        a.c = rc.c; a.r = rc.r;

        const t = targets[n];
        a.local.set(t.x, t.y);
        a.baseLocal.set(t.x, t.y);
        a.targetLocal.set(t.x, t.y);
        a.burstT = 999;
        a.vLocal.set(0,0);
      }
    }

    function startBurstForCell(k, now){
      const rc = cellFromKey(k);
      const list = [];
      for (let a of agents){
        if (!a.locked) continue;
        if (a.c === rc.c && a.r === rc.r) list.push(a);
      }
      if (!list.length) return;

      shuffleInPlace(list);
      const targets = computeSlotTargets(list.length);

      for (let i=0; i<list.length; i++){
        const a = list[i];
        a.targetLocal.set(targets[i].x, targets[i].y);
        a.baseLocal.set(a.local.x, a.local.y);

        const cx = CELL/2, cy = CELL/2;
        let dir = p.createVector(a.baseLocal.x - cx, a.baseLocal.y - cy);
        if (dir.mag() < 0.001) dir = p5.Vector.random2D();
        dir.normalize();

        const sp = p.random(BURST_SPEED_MIN, BURST_SPEED_MAX);
        a.vLocal = dir.mult(sp).rotate(p.random(-0.8, 0.8));

        a.burstStartMs = now;
        a.burstT = 0;
      }
    }

    function computeSlotTargets(n){
      const fs = autoFontSize();
      const charW = fs * 0.62;
      const charH = fs * 1.15;

      const perRow = Math.max(1, WORD_LEN);
      const rowsNeeded = Math.ceil(n / perRow);

      const totalH = (rowsNeeded - 1) * charH;
      const baseY = (CELL/2) - (totalH/2);

      const out = [];
      for (let idx=0; idx<n; idx++){
        const row = Math.floor(idx / perRow);
        const col = idx % perRow;

        const colsInThisRow = (row === rowsNeeded - 1)
          ? Math.min(perRow, n - row*perRow)
          : perRow;

        const totalW = (colsInThisRow - 1) * charW;
        const baseX = (CELL/2) - (totalW/2);

        out.push({
          x: constrain(baseX + col * charW, 6, CELL - 6),
          y: constrain(baseY + row * charH, 6, CELL - 6)
        });
      }
      return out;
    }

    class Agent{
      constructor(id, c, r, ch){
        this.id = id;
        this.c = c;
        this.r = r;
        this.char = ch;

        this.locked = false;

        this.local = p.createVector(p.random(CELL), p.random(CELL));
        this.v = p5.Vector.random2D().mult(DRIFT);
        this.nextStepAt = p.millis() + p.random(STEP_MS);

        this.baseLocal = this.local.copy();
        this.targetLocal = this.local.copy();
        this.vLocal = p.createVector(0,0);
        this.burstStartMs = 0;
        this.burstT = 999;
      }

      applyPointer(px, py){
        if (!isFinite(px) || !isFinite(py)) return;

        const pos = this.renderPosition();
        const dx = pos.x - px;
        const dy = pos.y - py;
        const d  = Math.hypot(dx, dy);

        if (d > 0 && d < POINTER_RADIUS){
          const t = 1 - (d / POINTER_RADIUS);
          const push = POINTER_PUSH * (t*t);
          this.v.x += (dx / d) * push;
          this.v.y += (dy / d) * push;

          const m = this.v.mag();
          if (m > 5.2) this.v.setMag(5.2);
        }
      }

      updateFree(now){
        this.local.add(this.v);
        this.resolveCellCrossingWithCap();

        if (this.c === 0 && this.local.x < 2) { this.local.x = 2; this.v.x *= -0.65; }
        if (this.c === cols-1 && this.local.x > CELL-2) { this.local.x = CELL-2; this.v.x *= -0.65; }
        if (this.r === 0 && this.local.y < 2) { this.local.y = 2; this.v.y *= -0.65; }
        if (this.r === rows-1 && this.local.y > CELL-2) { this.local.y = CELL-2; this.v.y *= -0.65; }

        this.v.mult(DAMPING);

        if (now >= this.nextStepAt){
          this.nextStepAt = now + STEP_MS + p.random(-120, 220);

          const opts = [];
          if (this.c > 0) opts.push({c:this.c-1, r:this.r});
          if (this.c < cols-1) opts.push({c:this.c+1, r:this.r});
          if (this.r > 0) opts.push({c:this.c, r:this.r-1});
          if (this.r < rows-1) opts.push({c:this.c, r:this.r+1});

          let best = null, bestScore = -1e9;
          for (const o of opts){
            const k = keyOf(o.c, o.r);
            if (lockedCells[k]) continue;
            if ((occCount[k]||0) >= CELL_CAP) continue;

            let score = p.random(-0.3, 0.3);
            score += (p.noise(o.c*0.18, o.r*0.18, now*0.00008)-0.5) * 0.18;

            if (score > bestScore){ bestScore = score; best = o; }
          }

          if (best){
            const fromK = keyOf(this.c, this.r);
            const toK   = keyOf(best.c, best.r);

            this.c = best.c;
            this.r = best.r;
            this.local.add(p5.Vector.random2D().mult(2.0));

            occCount[fromK] = Math.max(0, (occCount[fromK]||1) - 1);
            occCount[toK]   = (occCount[toK]||0) + 1;
          }
        }

        const k = keyOf(this.c, this.r);
        if (lockedCells[k]) {
          this.locked = true;
          this.v.set(0,0);

          this.local.x = constrain(this.local.x, 6, CELL-6);
          this.local.y = constrain(this.local.y, 6, CELL-6);

          this.baseLocal.set(this.local.x, this.local.y);
          this.targetLocal.set(this.local.x, this.local.y);
          this.vLocal.set(0,0);
          this.burstT = 999;
        }
      }

      updateLocked(now, dt, hoverKey){
        const k = keyOf(this.c, this.r);

        if (this.burstT <= BURST_TOTAL_S) {
          this.burstT = (now - this.burstStartMs) / 1000;

          this.baseLocal.x += this.vLocal.x * dt;
          this.baseLocal.y += this.vLocal.y * dt;

          if (this.baseLocal.x < 6) { this.baseLocal.x = 6; this.vLocal.x *= -BURST_BOUNCE; }
          if (this.baseLocal.x > CELL-6) { this.baseLocal.x = CELL-6; this.vLocal.x *= -BURST_BOUNCE; }
          if (this.baseLocal.y < 6) { this.baseLocal.y = 6; this.vLocal.y *= -BURST_BOUNCE; }
          if (this.baseLocal.y > CELL-6) { this.baseLocal.y = CELL-6; this.vLocal.y *= -BURST_BOUNCE; }

          this.vLocal.mult(BURST_DAMPING);

          if (this.burstT >= REORDER_AFTER_S) {
            const ax = (this.targetLocal.x - this.baseLocal.x) * REORDER_EASE;
            const ay = (this.targetLocal.y - this.baseLocal.y) * REORDER_EASE;
            this.vLocal.x += ax * dt;
            this.vLocal.y += ay * dt;
          }

          this.local.set(this.baseLocal.x, this.baseLocal.y);
          return;
        }

        if (hoverKey === k) {
          const t = now * 0.002;
          const jx = (p.noise(this.id * 0.17, t) - 0.5) * 0.9;
          const jy = (p.noise(this.id * 0.31, t + 99) - 0.5) * 0.9;
          this.local.x = constrain(this.targetLocal.x + jx, 6, CELL-6);
          this.local.y = constrain(this.targetLocal.y + jy, 6, CELL-6);
        } else {
          this.local.set(this.targetLocal.x, this.targetLocal.y);
        }
      }

      resolveCellCrossingWithCap(){
        if (this.local.x < 0){
          if (this.c > 0){
            const toK = keyOf(this.c - 1, this.r);
            if (!lockedCells[toK] && (occCount[toK]||0) < CELL_CAP){
              const fromK = keyOf(this.c, this.r);
              this.local.x += CELL;
              this.c -= 1;
              occCount[fromK] = Math.max(0, (occCount[fromK]||1) - 1);
              occCount[toK]   = (occCount[toK]||0) + 1;
              return;
            }
          }
          this.local.x = 0;
          this.v.x *= -0.8;
        }

        if (this.local.x >= CELL){
          if (this.c < cols - 1){
            const toK = keyOf(this.c + 1, this.r);
            if (!lockedCells[toK] && (occCount[toK]||0) < CELL_CAP){
              const fromK = keyOf(this.c, this.r);
              this.local.x -= CELL;
              this.c += 1;
              occCount[fromK] = Math.max(0, (occCount[fromK]||1) - 1);
              occCount[toK]   = (occCount[toK]||0) + 1;
              return;
            }
          }
          this.local.x = CELL - 0.001;
          this.v.x *= -0.8;
        }

        if (this.local.y < 0){
          if (this.r > 0){
            const toK = keyOf(this.c, this.r - 1);
            if (!lockedCells[toK] && (occCount[toK]||0) < CELL_CAP){
              const fromK = keyOf(this.c, this.r);
              this.local.y += CELL;
              this.r -= 1;
              occCount[fromK] = Math.max(0, (occCount[fromK]||1) - 1);
              occCount[toK]   = (occCount[toK]||0) + 1;
              return;
            }
          }
          this.local.y = 0;
          this.v.y *= -0.8;
        }

        if (this.local.y >= CELL){
          if (this.r < rows - 1){
            const toK = keyOf(this.c, this.r + 1);
            if (!lockedCells[toK] && (occCount[toK]||0) < CELL_CAP){
              const fromK = keyOf(this.c, this.r);
              this.local.y -= CELL;
              this.r += 1;
              occCount[fromK] = Math.max(0, (occCount[fromK]||1) - 1);
              occCount[toK]   = (occCount[toK]||0) + 1;
              return;
            }
          }
          this.local.y = CELL - 0.001;
          this.v.y *= -0.8;
        }
      }

      renderPosition(){
        return p.createVector(this.c * CELL + this.local.x, this.r * CELL + this.local.y);
      }
    }

    function attachPointerHandlers(){
      const host = p5Host;

      host.addEventListener("mousemove", (e) => {
        const rect = host.getBoundingClientRect();
        pointerX = e.clientX - rect.left;
        pointerY = e.clientY - rect.top;
        pointerActive = true;
      });

      host.addEventListener("mouseleave", () => {
        pointerActive = false;
        prevPointerCellKey = -1;
      });

      const touchToPointer = (t) => {
        const rect = host.getBoundingClientRect();
        pointerX = t.clientX - rect.left;
        pointerY = t.clientY - rect.top;
        pointerActive = true;
      };

      host.addEventListener("touchstart", (e) => {
        if (e.touches && e.touches[0]) touchToPointer(e.touches[0]);
        const k = hoveredCellKey(pointerX, pointerY);
        if (k !== -1 && lockedCells[k]) startBurstForCell(k, p.millis());
        e.preventDefault();
      }, { passive:false });

      host.addEventListener("touchmove", (e) => {
        if (e.touches && e.touches[0]) touchToPointer(e.touches[0]);
        e.preventDefault();
      }, { passive:false });

      host.addEventListener("touchend", () => {
        pointerActive = false;
        prevPointerCellKey = -1;
      });
      host.addEventListener("touchcancel", () => {
        pointerActive = false;
        prevPointerCellKey = -1;
      });
    }

    function refillBag(){
      letterBag = BASE_LETTERS.slice();
      for (let i=0; i<EXTRA_VOWELS_PER_BAG; i++) letterBag.push(p.random(VOWELS));
      shuffleInPlace(letterBag);
    }
    function nextLetter(){
      if (letterBag.length === 0) refillBag();
      return letterBag.pop();
    }
    function shuffleInPlace(arr){
      for (let i = arr.length - 1; i > 0; i--){
        const j = Math.floor(p.random(i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }

    function trySpawnAgent(tries){
      for (let t=0;t<tries;t++){
        const c = Math.floor(p.random(cols));
        const r = Math.floor(p.random(rows));
        const k = keyOf(c,r);
        if (lockedCells[k]) continue;
        if ((occCount[k]||0) >= CELL_CAP) continue;

        agents.push(new Agent(nextId++, c, r, nextLetter()));
        occCount[k] = (occCount[k]||0) + 1;
        return true;
      }
      return false;
    }

    function seedAgentsBalanced(n){
      const keys = [];
      for (let rr=0; rr<rows; rr++){
        for (let cc=0; cc<cols; cc++){
          keys.push(keyOf(cc,rr));
        }
      }
      shuffleInPlace(keys);

      let placed = 0;
      for (let i=0; i<keys.length && placed < n; i++){
        const k = keys[i];
        const rc = cellFromKey(k);
        if (lockedCells[k]) continue;
        if ((occCount[k]||0) >= 1) continue;
        agents.push(new Agent(nextId++, rc.c, rc.r, nextLetter()));
        occCount[k] = (occCount[k]||0) + 1;
        placed++;
      }

      while (placed < n){
        if (!trySpawnAgent(80)) break;
        placed++;
      }
    }

    function resetSim(){
      agents = [];
      nextId = 1;

      initGrid();
      occCount = Array.from({length: cols*rows}, () => 0);

      recomputeAdaptiveCounts();

      refillBag();
      seedAgentsBalanced(START_N);

      lastSpawnAt = p.millis();
      pointerActive = false;
      prevPointerCellKey = -1;
    }
    p.__resetSim = resetSim;

    function initGrid(){
      cols = Math.max(1, Math.floor(p.width / CELL));
      rows = Math.max(1, Math.floor(p.height / CELL));
      lockedCells = Array.from({length: cols*rows}, () => false);
      occCount = Array.from({length: cols*rows}, () => 0);
    }

    function drawGrid(){
      p.stroke(0);
      p.strokeWeight(1);
      for (let c=0;c<=cols;c++){
        const x=c*CELL;
        p.line(x,0,x,rows*CELL);
      }
      for (let r=0;r<=rows;r++){
        const y=r*CELL;
        p.line(0,y,cols*CELL,y);
      }
    }

    function hoveredCellKey(px, py){
      if (!isFinite(px) || !isFinite(py)) return -1;
      if (px < 0 || py < 0 || px >= p.width || py >= p.height) return -1;
      const c = Math.floor(px / CELL);
      const r = Math.floor(py / CELL);
      if (c < 0 || r < 0 || c >= cols || r >= rows) return -1;
      return keyOf(c, r);
    }

    function keyOf(c,r){ return r*cols + c; }
    function cellFromKey(k){
      const r=Math.floor(k/cols);
      const c=k-r*cols;
      return {c,r};
    }

    function autoFontSize(){
      const base = CELL * 0.28;
      const cap  = p.width < 520 ? 12 : 14;
      return Math.floor(constrain(base, 10, cap));
    }

    function hostSize(){
      const rect = p5Host.getBoundingClientRect();
      return { w: Math.max(1, Math.floor(rect.width)), h: Math.max(1, Math.floor(rect.height)) };
    }

    function resizeToHost(forceReset){
      const {w,h} = hostSize();
      if (!forceReset && w === lastW && h === lastH) return;
      lastW = w; lastH = h;

      applyPixelDensity();
      p.resizeCanvas(w,h);
      initGrid();
      resetSim();
    }
  };

  p5Instance = new p5(sketch);

  if (p5ResetBtn){
    p5ResetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      KMAP.stop(e);
      if (p5Instance && typeof p5Instance.__resetSim === "function") p5Instance.__resetSim();
    }, {passive:false});
  }

  const setPaused = (pause) => {
    if (!p5Instance) return;
    if (pause) p5Instance.noLoop();
    else p5Instance.loop();
  };

  if ("IntersectionObserver" in window){
    const io = new IntersectionObserver((entries) => {
      const ent = entries[0];
      if (!ent) return;
      setPaused(!ent.isIntersecting);
    }, {
      root: viewport,
      threshold: 0.01
    });
    io.observe(p5Host);
  }
})();

