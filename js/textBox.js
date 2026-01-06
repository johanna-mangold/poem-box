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

Many elements react to hover or clicks.


Tablet / Touch devices
----------------------

Drag with one finger anywhere on the map to move.

Swipe inside a text box to scroll its content.


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
      w: 490,
      h: 620,
      text: `
        reading 2025
     #### fiction
[[the heart is deceitful above all things - jt leroy]]
[[no one belongs here more than you - miranda july]]
[[plastic abyss - kate wilhelm]]
[[stranger in the house - kate wilhelm ]]
[[the green millenium - fritz leiber]] 
[[where late the sweet birds sang - kate wilhelm]] 
[[margaret and i - kate willhelm]] 
[[the first bad man - miranda july]] 
[[mysterious skin - scott heim]] 
[[nightbitch - rachel yoder]] 
[[the eyes are the best part - monika kim]] 
[[the word for world is forest  - ursula le guin]] 
[[my year of rest and relaxation - ottessa moshfegh]] 
[[lügen über meine mutter - daniela dröscher]] 
[[david pablo - joanna yulia kluge]] 
[[für den rest des lebens - zeruya shalev]]
[[the dream hotel - laila lalami]] 
{{img:https://static.wixstatic.com/media/0f3578_66d14a2c05b04185936787430ca1db01~mv2.png/v1/fill/w_980,h_639,al_c,q_90,enc_avif,quality_auto/0f3578_66d14a2c05b04185936787430ca1db01~mv2.png}}

      #### short stories
[[the yellow wallpaper - charlotte perkins gilman]]
[[my evil mother - margaret atwood]]
[[bereue, harlekin! sagte der ticktackmann - h. ellison]]
[[die stadt am rande der welt - h. ellison]]
[[ich muss schreien und habe keinen mund - h. ellison]]
[[two talented bastids - stephen king]]
[[the fifth step - stephen king]]
[[willie the weirdo - stephen king]]
[[beyond lies the wub - philip k. dick]] 
[[the defenders - philip k. dick]]
[[roog - philip k. dick]]  
[[impostor - philip k. dick]] 
[[the preserving machine - philip k. dick]]  
[[the father-thing - philip k. dick]] 
[[foster, you're dead - philip k. dick]] 
[[human is? - philip k. dick]] 
[[the infinity box - kate wilhelm]] 
[[the time piece - kate wilhelm]] 

      #### non-fiction
[[hexen - die unbesiegte macht der frauen - mona chollet]]
[[kulturelle aneignung - lars distelhorst]]
[[six ways - aidan wachter]]
[[we need your art - amy mcnee]]
[[künstliche intelligenz u. der neue faschismus - rainer mühlhoff]]
[[künstliche intelligenz und empathie - catrin misselhorn]]
[[das seltsame und das gespenstische - mark fisher]]
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
