(() => {
  const KMAP = window.KMAP;
  const cfg = KMAP?.config;
  if (!KMAP || !cfg) return;

  const viewport = KMAP.viewport;
  const linesCanvas = document.getElementById("linesCanvas");
  const lctx = linesCanvas.getContext("2d", { alpha:true });

  function worldToScreen(wx, wy){
    const t = KMAP.transform || {x:0,y:0,scale:1};
    return { x: wx * t.scale + t.x, y: wy * t.scale + t.y };
  }

  function drawLines(){
    const r = viewport.getBoundingClientRect();
    lctx.clearRect(0,0,r.width,r.height);

    const { LINES, CONNECTIONS } = cfg;

    lctx.strokeStyle = LINES.color;
    lctx.lineWidth = LINES.width;
    lctx.lineCap = LINES.cap;
    lctx.lineJoin = LINES.join;

    const scale = (KMAP.transform?.scale ?? 1);
    const dash = LINES.dashScaleWithZoom ? LINES.dash.map(v => v * scale) : LINES.dash;
    lctx.setLineDash(dash);

    for(const c of CONNECTIONS){
      if(!c || !Array.isArray(c.pts) || c.pts.length < 2) continue;

      lctx.beginPath();
      const p0 = worldToScreen(c.pts[0][0], c.pts[0][1]);
      lctx.moveTo(p0.x, p0.y);

      for(let i=1;i<c.pts.length;i++){
        const p = worldToScreen(c.pts[i][0], c.pts[i][1]);
        lctx.lineTo(p.x, p.y);
      }
      lctx.stroke();
    }

    lctx.setLineDash([]);
  }

  function resizeLinesCanvas(){
    const r = viewport.getBoundingClientRect();
    linesCanvas.width  = Math.round(r.width  * devicePixelRatio);
    linesCanvas.height = Math.round(r.height * devicePixelRatio);
    linesCanvas.style.width  = r.width + "px";
    linesCanvas.style.height = r.height + "px";
    lctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    drawLines();
  }

  // redraw on every map apply
  KMAP.onApply(drawLines);

  window.addEventListener("resize", resizeLinesCanvas, {passive:true});
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resizeLinesCanvas, {passive:true});
  resizeLinesCanvas();
})();
