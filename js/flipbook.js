(() => {
  const KMAP = window.KMAP;
  if (!KMAP) return;

  const flipEl = document.getElementById("flipPOI");
  if (!flipEl) return;

  // ✅ register as POI target
  KMAP.registerPOIHitTest((target) => target && (target === flipEl || flipEl.contains(target)));

  let flipTimer = null;
  const startFlipMoment = () => {
    flipEl.classList.add("isAnimating");
    clearTimeout(flipTimer);
    flipTimer = setTimeout(() => flipEl.classList.remove("isAnimating"), 1200);
  };

  flipEl.addEventListener("pointerdown", (e) => { KMAP.stop(e); startFlipMoment(); }, {passive:true});
  flipEl.addEventListener("pointermove", (e) => KMAP.stop(e), {passive:true});
  flipEl.addEventListener("touchstart",  (e) => { KMAP.stop(e); startFlipMoment(); }, {passive:true});
  flipEl.addEventListener("touchmove",   (e) => KMAP.stop(e), {passive:true});
})();

