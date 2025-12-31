/* =========================================================
   TEXT BOX MODULE
   no titlebar · neon colors via CSS · scrollable
   ========================================================= */

(() => {
  const TEXT_BOXES = [
    {
      id: "text1",
      x: 0,
      y: 33,
      w: 420,
      h: 120,
      text: `
*How to navigate this map*

Desktop (Mouse / Trackpad)
-------------------------

Click and drag anywhere to move through the map.

You can also use two-finger scrolling on a trackpad.

Some elements react to hover or clicks.

If something doesn’t move, try dragging slightly outside of it.

Tablet / Touch devices
----------------------

Drag with one finger anywhere on the map to move.

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
    },

     {
      id: "text2",
      x: 199,
      y: -2741,
      w: 420,
      h: 620,
      text: `
     reading 2025
     #### fiction
- [[the heart is deceitful above above all things - jt leroy]] **
- [[no one belongs here more than you - miranda july]] **
- [[plastic abyss - kate wilhelm]] **
- [[stranger in the house - kate wilhelm ]]**
- [[the green millenium - fritz leiber]] **
- [[where late the sweet birds sang - kate wilhelm]] **
- [[margaret and i - kate willhelm]] **
- [[the first bad man - miranda july]] **
- [[mysterious skin - scott heim]] **
- [[nightbitch - rachel yoder]] **
- [[the eyes are the best part - monika kim]] **
- [[the word for world is forest  - ursula le guin]] **
- [[my year of rest and relaxation - ottessa moshfegh]] **
- [[lügen über meine mutter - daniela dröscher]] **
- [[david pablo - joanna yulia kluge]] **
- [[für den rest des lebens - zeruya shalev]]
- [[the dream hotel - laila lalami]] **

#### short stories
- the yellow wallpaper - charlotte perkins gilman 
- my evil mother - margaret atwood
- bereue, harlekin! sagte der ticktackmann - harlan ellison
- die stadt am rande der welt - harlan ellison
- ich muss schreien und habe keinen mund - harlan ellison
- two talented bastids (4*) - stephen king (you like it darker)
- the fifth step (3*) - stephen king (you like it darker)
- willie the weirdo (3*) - stephen king (you like it darker)
- beyond lies the wub (2*) - philip k. dick (human is?) 
- the defenders (5*) - philip k. dick (human is?) 
- roog (2*) - philip k. dick (human is?) 
- impostor (4*) - philip k. dick (human is?) 
- the preserving machine (4*) - philip k. dick (human is?) 
- the father-thing (3*) - philip k. dick (human is?) 
- foster, you're dead (4*) - philip k. dick (human is?) 
- human is? (5*) - philip k. dick (human is?) 
- the infinity box (5*) - kate wilhelm (SF gateway omnibus)
- the time piece (3*) - kate wilhelm (SF gateway omnibus)

#### non-fiction
- [[hexen - die unbesiegte macht der frauen - mona chollet]] **
- [[kulturelle aneignung - lars distelhorst (nautilus)]] **
- [[six ways - aidan wachter]] **
- [[we need your art - amy mcnee]] **
- [[künstliche intelligenz und der neue faschismus - rainer mühlhoff (reclam)]] **
- [[künstliche intelligenz und empathie - catrin misselhorn]] **
- [[das seltsame und das gespenstische - mark fisher]] **
- [[effektive mikroorganismen und ihre praktische anwendung - dr. anne katharina zschocke]] **
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

      // --- scroll label (top right, above box)
      const label = document.createElement("div");
      label.className = "map-textbox-label";
      label.textContent = "scroll";

      const inner = document.createElement("div");
      inner.className = "map-textbox-inner";
      inner.textContent = cfg.text || "";

      box.appendChild(label);
      box.appendChild(inner);
      mapEl.appendChild(box);

      // =========================
      // Interaction fixes
      // =========================

      // ✅ Let scroll work: stop wheel BEFORE it reaches #viewport
      inner.addEventListener(
        "wheel",
        (e) => {
          e.stopPropagation();
        },
        { capture: true, passive: true }
      );

      // ✅ Touch scroll inside box shouldn't start map drag
      inner.addEventListener(
        "pointerdown",
        (e) => {
          if (e.pointerType === "touch") e.stopPropagation();
        },
        { passive: true }
      );

      // Optional: mouse text selection without map drag
      inner.addEventListener(
        "pointerdown",
        (e) => {
          if (e.pointerType === "mouse") e.stopPropagation();
        },
        { passive: true }
      );
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
