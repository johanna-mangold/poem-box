(() => {
  const KMAP = window.KMAP;
  const cfg = KMAP?.config;
  if (!KMAP || !cfg) return;

  const viewport = KMAP.viewport;
  const videoLayer = document.getElementById("videoLayer");
  if (!videoLayer) return;

  // ✅ register as POI target (so map drag ignores unless ALT)
  KMAP.registerPOIHitTest((target) => target && (target === videoLayer || videoLayer.contains(target)));

  function extractYouTubeId(url){
    try{
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/embed/")[1].split("/")[0];
      if (u.searchParams.get("v")) return u.searchParams.get("v");
    } catch(e){}
    const m = String(url).match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : "";
  }

  function renderYouTube(){
    videoLayer.innerHTML = "";

    for(const item of cfg.MAP_YOUTUBE){
      if(!item || !item.url) continue;

      const id = extractYouTubeId(item.url);
      if(!id) continue;

      const wrap = document.createElement("div");
      wrap.className = "mapVideo";

      const x = (item.x ?? 0);
      const y = (item.y ?? 0);
      const w = (item.w ?? 480);
      const h = (item.h ?? 270);
      const rot = (item.rot ?? 0);
      const op = (item.op ?? 1);

      wrap.style.setProperty("--x", `${x}px`);
      wrap.style.setProperty("--y", `${y}px`);
      wrap.style.setProperty("--w", `${w}px`);
      wrap.style.setProperty("--h", `${h}px`);
      wrap.style.setProperty("--rot", `${rot}deg`);
      wrap.style.setProperty("--op", `${op}`);

      const mute = (item.mute ?? 1) ? 1 : 0;
      const controls = (item.controls ?? 1) ? 1 : 0;

      const src =
        `https://www.youtube.com/embed/${encodeURIComponent(id)}?` +
        `rel=0&modestbranding=1&playsinline=1&mute=${mute}&controls=${controls}`;

      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.title = "YouTube video";

      // ✅ wheel über video -> map wheel
      wrap.addEventListener("wheel", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const evt = new WheelEvent("wheel", {
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          deltaZ: e.deltaZ,
          deltaMode: e.deltaMode,
          bubbles: true,
          cancelable: true
        });
        viewport.dispatchEvent(evt);
      }, {passive:false});

      wrap.appendChild(iframe);
      videoLayer.appendChild(wrap);
    }
  }

  renderYouTube();
})();

