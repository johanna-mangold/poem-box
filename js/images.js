(() => {
  const KMAP = window.KMAP;
  const cfg = KMAP?.config;
  if (!KMAP || !cfg) return;

  const imageLayer = document.getElementById("imageLayer");
  if (!imageLayer) return;

  function renderMapImages(){
    imageLayer.innerHTML = "";

    for(const item of cfg.MAP_IMAGES){
      if(!item || !item.src) continue;

      const wrap = document.createElement("div");
      wrap.className = "mapImg";

      const x = (item.x ?? 0);
      const y = (item.y ?? 0);
      const w = (item.w ?? 240);
      const rot = (item.rot ?? 0);
      const op = (item.op ?? 1);

      wrap.style.setProperty("--x", `${x}px`);
      wrap.style.setProperty("--y", `${y}px`);
      wrap.style.setProperty("--w", `${w}px`);
      wrap.style.setProperty("--rot", `${rot}deg`);
      wrap.style.setProperty("--op", `${op}`);

      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = item.src;

      wrap.appendChild(img);
      imageLayer.appendChild(wrap);
    }
  }

  renderMapImages();
})();

