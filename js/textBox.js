/* =========================================================
   TEXT BOX MODULE
   plain text · scrollable · roboto mono
   ========================================================= */

const TEXT_BOXES = [
  {
    id: "text1",
    x: 300,
    y: 1600,
    w: 820,
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
    `
  }
];

function createTextBoxes(mapEl){
  TEXT_BOXES.forEach(cfg => {

    const box = document.createElement("div");
    box.className = "map-textbox";
    box.style.left = cfg.x + "px";
    box.style.top  = cfg.y + "px";
    box.style.width  = cfg.w + "px";
    box.style.height = cfg.h + "px";

    const inner = document.createElement("div");
    inner.className = "map-textbox-inner";
    inner.textContent = cfg.text || "";

    // ✅ Scroll inside box should NOT trigger map wheel-pan
    // capture:true => stop it early before viewport wheel handler sees it
    inner.addEventListener("wheel", (e) => {
      e.stopPropagation();
    }, { passive: true, capture: true });

    // ✅ On touch: allow scrolling inside box (don't start map drag)
    // On mouse: don't block pointerdown (map drag can still start)
    inner.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") e.stopPropagation();
    }, { passive: true });

    box.appendChild(inner);
    mapEl.appendChild(box);
  });
}
