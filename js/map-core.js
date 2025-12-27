(() => {
  const viewport = document.getElementById("viewport");
  const world = document.getElementById("world");
  const grid = document.getElementById("grid");

  window.KMAP = window.KMAP || {};
  const KMAP = window.KMAP;

  KMAP.viewport = viewport;
  KMAP.world = world;
  KMAP.grid = grid;

  // Hook-System, damit andere Module “andocken”
  KMAP._applyHooks = [];
  KMAP.onApply = (fn) => { if (typeof fn === "function") KMAP._applyHooks.push(fn); };

  // POI hit-test registry (für “onPOI && !ALT => nicht draggen”)
  KMAP._poiHitTests = [];
  KMAP.registerPOIHitTest = (fn) => { if (typeof fn === "function") KMAP._poiHitTests.push(fn); };
  KMAP.isOnPOI = (target) => KMAP._poiHitTests.some(fn => {
    try { return !!fn(target); } catch(e){ return false; }
  });

  KMAP.stop = (e) => { e.stopPropagation(); };

  /* iOS/iPadOS viewport height fix */
  function setVh(){
    const h = (window.visualViewport && window.visualViewport.height)
      ? window.visualViewport.height
      : window.innerHeight;
    document.documentElement.style.setProperty("--vh", (h * 0.01) + "px");
  }
  setVh();
  window.addEventListener("resize", setVh, {passive:true});
  if (window.visualViewport) window.visualViewport.addEventListener("resize", setVh, {passive:true});

  /* Camera / map drag engine */
  const START = () => ({
    x: Math.round((window.visualViewport?.width ?? window.innerWidth) * 0.5),
    y: Math.round((window.visualViewport?.height ?? window.innerHeight) * 0.5)
  });

  let camX = START().x;
  let camY = START().y;

  let dragging = false;
  let lastX = 0, lastY = 0;
  let vx = 0, vy = 0;

  // Home animation
  let animatingHome = false;
  let homeFrom = {x:0,y:0}, homeTo = {x:0,y:0}, homeT0 = 0;
  const HOME_MS = 420;

  function apply(){
    world.style.transform = `translate3d(${camX}px, ${camY}px, 0)`;
    grid.style.backgroundPosition = `${camX}px ${camY}px`;

    // shared transform (no zoom => scale=1)
    KMAP.transform = { x: camX, y: camY, scale: 1 };

    // run hooks (lines redraw etc.)
    for(const fn of KMAP._applyHooks) {
      try { fn(KMAP.transform); } catch(e){}
    }
  }
  apply();

  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function goHome(){
    const s = START();
    animatingHome = true;
    homeFrom = { x: camX, y: camY };
    homeTo   = { x: s.x,  y: s.y  };
    homeT0 = performance.now();
    vx = vy = 0;
  }

  /* Home Button */
  const homeBtn = document.createElement("button");
  homeBtn.type = "button";
  homeBtn.setAttribute("aria-label", "back to start");
  homeBtn.title = "back to start";
  Object.assign(homeBtn.style, {
    position: "absolute",
    left: "50%",
    bottom: "calc(18px + env(safe-area-inset-bottom))",
    transform: "translateX(-50%)",
    width: "14px",
    height: "14px",
    borderRadius: "999px",
    border: "0",
    padding: "0",
    background: "#fff",
    opacity: "0.9",
    cursor: "pointer",
    zIndex: "2147483647",
    boxShadow: "0 0 0 7px rgba(255,255,255,0.10), 0 0 18px rgba(255,255,255,0.35)",
    outline: "none"
  });
  homeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    goHome();
  });
  viewport.appendChild(homeBtn);

  function onDown(x, y){
    if(animatingHome) animatingHome = false;
    dragging = true;
    lastX = x; lastY = y;
    vx = vy = 0;
  }

  function onMove(x, y){
    if(!dragging) return;
    const dx = x - lastX;
    const dy = y - lastY;
    lastX = x; lastY = y;

    camX += dx;
    camY += dy;

    vx = dx; vy = dy;
    apply();
  }

  function onUp(){ dragging = false; }

  // pointer drag (ignore POIs unless ALT)
  viewport.addEventListener("pointerdown", (e) => {
    if (e.target === homeBtn) return;

    const onPOI = KMAP.isOnPOI(e.target);
    if (onPOI && !e.altKey) return;

    e.preventDefault();
    viewport.setPointerCapture(e.pointerId);
    onDown(e.clientX, e.clientY);
  });

  viewport.addEventListener("pointermove", (e) => {
    if(!dragging) return;
    e.preventDefault();
    onMove(e.clientX, e.clientY);
  });

  viewport.addEventListener("pointerup", (e) => { e.preventDefault(); onUp(); });
  viewport.addEventListener("pointercancel", onUp);

  // wheel always moves map
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    if(animatingHome) animatingHome = false;

    camX -= e.deltaX;
    camY -= e.deltaY;

    vx = -e.deltaX;
    vy = -e.deltaY;

    apply();
  }, { passive:false });

  function tick(ts){
    requestAnimationFrame(tick);

    if(animatingHome){
      const t = Math.min(1, (ts - homeT0) / HOME_MS);
      const k = easeOutCubic(t);
      camX = homeFrom.x + (homeTo.x - homeFrom.x) * k;
      camY = homeFrom.y + (homeTo.y - homeFrom.y) * k;
      apply();
      if(t >= 1){
        animatingHome = false;
        vx = vy = 0;
      }
      return;
    }

    if(dragging) return;

    vx *= 0.90;
    vy *= 0.90;
    if(Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01) return;

    camX += vx;
    camY += vy;
    apply();
  }
  requestAnimationFrame(tick);

  viewport.addEventListener("dblclick", () => goHome());
})();

