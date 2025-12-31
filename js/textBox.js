/* =========================================================
   TEXT BOX MODULE
   no titlebar · neon colors via CSS · scrollable
   ========================================================= */

(() => {
  const TEXT_BOXES = [
    {
      id: "text1",
      x: 0,
      y: 0,
      w: 420,
      h: 220,
      text: `
How to navigate this map
-------------------------
---------      ----------
Desktop (Mouse / Trackpad)
-------------------------
Move the map
------------

Click and drag anywhere to move through the map.

You can also use two-finger scrolling on a trackpad.

Text boxes
----------

When your cursor is inside a text box, use the mouse wheel / trackpad scroll to read the text.

Other elements
--------------

Some elements react to hover or clicks.

If something doesn’t move, try dragging slightly outside of it.

Tablet / Touch devices
----------------------

Move the map
------------

Drag with one finger anywhere on the map to move.

Text boxes
-----------

Swipe inside a text box to scroll its content.

Swipe outside the text box to move the map.

Tip
----

If scrolling feels “stuck”, lift your finger and try again slightly inside or outside the box.

General notes
-------------

The map has no fixed beginning or end - explore freely.

Or you can follow the white-dotted-lines, Dorothy.

You can always teleport back to the starting point by clicking on the white dot on the bottom of the screen.
      `.trim()
    }
  ];

  function createTextBoxes(mapEl) {
    if (!mapEl) return;

    TEXT_BOXES.forEach(cfg => {
      if (!cfg) return;

      // avoid duplicates
      if (cfg.id && document.getElementById(cfg.id)) return;

      const box = document.createElement("div");
      box.className = "map-textbox";
      if (cfg.id) box.id = cfg.id;

      box.style.left = (cfg.x ?? 0) + "px";
      box.style.top  = (cfg.y ?? 0) + "px";
      box.style.width  = (cfg.w ?? 360) + "px";
      box.style.height = (cfg.h ?? 240) + "px";

      const inner = document.createElement("div");
      inner.className = "map-textbox-inner";
      inner.textContent = cfg.text || "";

      box.appendChild(inner);
      mapEl.appendChild(box);

      // =========================
      // Interaction fixes
      // =========================

      // ✅ Let scroll work: stop wheel BEFORE it reaches #viewport (which preventDefault's it)
      inner.addEventListener("wheel", (e) => {
        e.stopPropagation();
        // don't preventDefault -> keep native scrolling
      }, { capture: true, passive: true });

      // ✅ Touch scroll inside box shouldn't start map drag
      // We stop propagation only for touch pointers.
      inner.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "touch") e.stopPropagation();
      }, { passive: true });

      // Optional: if you want mouse selection inside box without dragging map when grabbing text:
      inner.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse") e.stopPropagation();
      }, { passive: true });
    });
  }

  // Auto-init
  function init() {
    const world = window.KMAP?.world || document.getElementById("world");
    if (!world) return;
    createTextBoxes(world);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.createTextBoxes = createTextBoxes;
})();
