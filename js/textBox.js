/* =========================================================
   TEXT BOX MODULE
   90s windows-ish · scrollable · roboto mono
   ========================================================= */

(() => {
  const TEXT_BOXES = [
    {
      id: "text1",
      title: "READ ME.txt",
      x: 1000,
      y: 1000,
      w: 420,
      h: 220,
      text: `
This is a simple reading box.

No animation.
No interaction.
Just text.

You can scroll inside this box.
Line breaks stay intact.

Perfect for longer texts.
No animation.
No interaction.
Just text.

You can scroll inside this box.
Line breaks stay intact.

Perfect for longer texts.
No animation.
No interaction.
Just text.

You can scroll inside this box.
Line breaks stay intact.

Perfect for longer texts.
No animation.
No interaction.
Just text.

You can scroll inside this box.
Line breaks stay intact.

Perfect for longer texts.
No animation.
No interaction.
Just text.

You can scroll inside this box.
Line breaks stay intact.

Perfect for longer texts.
      `.trim()
    },

    // weitere Boxen einfach hier ergänzen
    /*
    {
      id: "text2",
      title: "ANOTHER.txt",
      x: -400,
      y: 120,
      w: 360,
      h: 260,
      text: `Another text box`
    }
    */
  ];

  function createTextBoxes(mapEl) {
    if (!mapEl) return;

    TEXT_BOXES.forEach(cfg => {
      if (!cfg) return;

      const box = document.createElement("div");
      box.className = "map-textbox";
      box.id = cfg.id || "";

      box.style.left = (cfg.x ?? 0) + "px";
      box.style.top  = (cfg.y ?? 0) + "px";
      box.style.width  = (cfg.w ?? 360) + "px";
      box.style.height = (cfg.h ?? 240) + "px";

      // --- Titlebar
      const title = document.createElement("div");
      title.className = "map-textbox-title";

      const ttlLeft = document.createElement("div");
      ttlLeft.className = "ttl";

      const ttlText = document.createElement("div");
      ttlText.className = "ttlText";
      ttlText.textContent = cfg.title || cfg.id || "TEXTBOX";

      ttlLeft.appendChild(ttlText);

      const btns = document.createElement("div");
      btns.className = "map-textbox-btns";

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "map-textbox-btn";
      closeBtn.setAttribute("aria-label", "close");
      closeBtn.textContent = "×";

      btns.appendChild(closeBtn);

      title.appendChild(ttlLeft);
      title.appendChild(btns);

      // --- Body
      const body = document.createElement("div");
      body.className = "map-textbox-body";

      const inner = document.createElement("div");
      inner.className = "map-textbox-inner";
      inner.textContent = cfg.text || "";

      body.appendChild(inner);

      // decorative grip
      const grip = document.createElement("div");
      grip.className = "map-textbox-grip";

      box.appendChild(title);
      box.appendChild(body);
      box.appendChild(grip);

      // --- Interaction: keep scrolling inside, don't let map swallow the scroll
      // pointerdown: stop so map doesn't start dragging when user tries to select/scroll inside the box
      box.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      }, { passive: true });

      // wheel: allow scroll in box, prevent the wheel from panning/zooming map
      inner.addEventListener("wheel", (e) => {
        e.stopPropagation();
      }, { passive: true });

      // Close button
      closeBtn.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      }, { passive: true });

      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        box.remove();
      });

      mapEl.appendChild(box);
    });
  }

  // Auto-init: attach to KMAP world when available
  function init() {
    const world = window.KMAP?.world || document.getElementById("world");
    if (!world) return;
    createTextBoxes(world);
  }

  // defer scripts run after parse; map-core is also defer and loaded earlier,
  // but we keep a fallback just in case.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // (optional) expose for debugging/manual calls
  window.createTextBoxes = createTextBoxes;
})();
