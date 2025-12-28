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
  },

  // weitere Boxen einfach hier ergänzen
  /*
  {
    id: "text2",
    x: -400,
    y: 120,
    w: 360,
    h: 260,
    text: `Another text box`
  }
  */
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

    /* allow scroll, block map-drag only when inside */
    box.addEventListener("pointerdown", e => e.stopPropagation());
    box.addEventListener("wheel", e => e.stopPropagation(), { passive:false });

    box.appendChild(inner);
    mapEl.appendChild(box);
  });
}
