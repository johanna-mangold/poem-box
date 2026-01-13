/* =========================================================
   TEXT BOX MODULE
   no titlebar · neon colors via CSS · scrollable
   supports {{img:URL}} placeholders
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
    }, 
     {
      id: "text3",
      x: 2800,
      y: 0,
      w: 290,
      h: 620,
      text: `
      januar26
      **
      they do not work like this.  
they must be reconfigured.
//**
turned over,  
thrown down to the floor,  
out the window

**
modular.  
co-co-coo.
they refuse to plush correctly,  
refuse to grow into streets,  
into rails,  
into connection.
a strike.
they want to be different.  
their own.

//**
to cloak themselves,  
to hide the paths,  
to show no roads at all
-----------------------
-----------------------
suuuur reuu
ei ieo owhigr
ef-ellf-li joqe
ELLF
febeow wefij-ei

{{img:https://static.wixstatic.com/media/0f3578_6a800eacceb7449886928d7048fa3a21~mv2.jpg/v1/fill/w_832,h_1200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/0f3578_6a800eacceb7449886928d7048fa3a21~mv2.jpg}}
eine strategie brauchen sie
einen farbcode
eine eigene sprache
es rollt über den wohnzimmerboden
immer mal wieder bleibt es kurz stehen, sieht mich fragend an. 
mit glubsch 
verdreht sich lustig
habe ich dich zu dünn gemacht? 
verdreht sich wieder zurück 
die zunge schleift übers laminat
da ist sie doch, die straße, die ich gesucht hab, die ganze nacht 6/1
** - **

flirrend liegt er auf dem teppich und räkelt sich. 
sie kommt dazu mit schüsseln voller getrockneter pilze,
stellt sie vor uns hin, erwartungsvoll. 
auch feigen sind dabei. 
am klavier spielen wir vierhändig.
unter seiner würde ist das. 
unter seiner würde bin auch ich, denke ich, denkt er. 
ich bin weniger,
zu dünn gemacht.
meine plateauschuhe habe ich verloren
auf dem weg hierher. 
sie geht wieder zu den katzen, 
die sich erst noch eingewöhnen müssen. 
er steht über mir
versucht etwas
aber scheitert. 
macht sich lächerlich. 
7/1
**

und er 
das monster
ist erledigt
denken wir.
feiernd stolpern wir stufen hinab

doch im fünften stock
steht er dann doch wieder auf
elastischer als je zuvor
mit schnellen beinen
und schraubenkrone
keucht er uns hinterher
wie grün er riecht
8/1

heute besucht sie mich
wir machen uns auf den weg
waten durch heißen schlamm
bis zur hüfte stecke ich darin 
ich halte sie über meinem kopf
sie klagt über den gestank
endlich kommen wir an
die burg ist wie neu gebaut
gemäuer kühlt das fell
9/1

mein baby ist gelb und flauschig
ich lege es zwischen die küken
damit es warm bleibt
während ich schlafe
die katze passt auf
13/1

  `.trim()
    }
  ];

  // -------------------------------------------------------
  // render plain text + allow {{img:URL}}
  // -------------------------------------------------------
  function renderTextWithImages(rawText) {
    let safe = (rawText ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // keep original line breaks
    safe = safe.replace(/\n/g, "<br>");

    // inject images
    safe = safe.replace(/\{\{img:([^}]+)\}\}/g, (_, url) => {
      const u = String(url).trim().replace(/"/g, "&quot;");
      return `<img src="${u}" style="max-width:100%;height:auto;display:block;margin:16px auto;" draggable="false">`;
    });

    return safe;
  }

  // -------------------------------------------------------
  // create boxes
  // -------------------------------------------------------
  function createTextBoxes(mapEl) {
    if (!mapEl) return;

    TEXT_BOXES.forEach(cfg => {
      if (!cfg) return;
      if (cfg.id && document.getElementById(cfg.id)) return;

      const box = document.createElement("div");
      box.className = "map-textbox";
      if (cfg.id) box.id = cfg.id;

      box.style.left = (cfg.x ?? 0) + "px";
      box.style.top  = (cfg.y ?? 0) + "px";
      box.style.width  = (cfg.w ?? 360) + "px";
      box.style.height = (cfg.h ?? 240) + "px";

      const label = document.createElement("div");
      label.className = "map-textbox-label";
      label.textContent = "scroll";

      const inner = document.createElement("div");
      inner.className = "map-textbox-inner";
      inner.innerHTML = renderTextWithImages(cfg.text || "");

      box.appendChild(label);
      box.appendChild(inner);
      mapEl.appendChild(box);

      // --- interaction fixes ---
      // Stop wheel from leaking out AND block browser pinch/cmd/ctrl zoom while in textbox
      inner.addEventListener(
        "wheel",
        (e) => {
          if (e.ctrlKey || e.metaKey) e.preventDefault(); // prevents browser zoom gesture (trackpad pinch / cmd+wheel)
          e.stopPropagation();
        },
        { capture: true, passive: false }
      );

      // Safari pinch gesture events (extra safety)
      ["gesturestart", "gesturechange", "gestureend"].forEach(type => {
        inner.addEventListener(
          type,
          (e) => { e.preventDefault(); e.stopPropagation(); },
          { passive: false }
        );
      });

      inner.addEventListener(
        "pointerdown",
        (e) => { if (e.pointerType === "touch") e.stopPropagation(); },
        { passive: true }
      );

      inner.addEventListener(
        "pointerdown",
        (e) => { if (e.pointerType === "mouse") e.stopPropagation(); },
        { passive: true }
      );
    });
  }

  // -------------------------------------------------------
  // init (safe for delayed KMAP/world)
  // -------------------------------------------------------
  function initWhenReady() {
    const world = window.KMAP?.world || document.getElementById("world");
    if (!world) return false;
    createTextBoxes(world);
    return true;
  }

  if (!initWhenReady()) {
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (initWhenReady() || tries > 80) clearInterval(t);
    }, 100);
  }

  window.createTextBoxes = createTextBoxes;

})();
