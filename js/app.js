/* Das Quiz. Ein Bildschirm nach dem anderen, alles ohne Server:
   Auswahl -> Frage -> Auflösung -> Auswertung. */

const app=document.getElementById("app");
const el=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* Erklärungen und Fragetexte enthalten bewusst <code>-Auszeichnung. Sie
   stammen aus der eigenen Fragendatei, nicht aus einer Eingabe – deshalb
   dürfen sie als HTML durch. Alles, was ein Mensch eintippt, geht durch esc(). */
const html=s=>String(s);

const SPEICHER="bsq_stand";
const laden=()=>{ try{ return JSON.parse(localStorage.getItem(SPEICHER))||{}; }catch(_){ return {}; } };
const sichern=o=>{ try{ localStorage.setItem(SPEICHER,JSON.stringify(o)); }catch(_){} };

let stand={
  bereiche:BEREICHE.map(b=>b.id),   // ausgewählte Bereiche
  anzahl:20,                        // Fragen je Durchgang
  reihe:[],                         // die Fragen dieses Durchgangs
  nr:0,                             // welche Frage gerade dran ist
  gewaehlt:null,                    // angeklickte Antwort
  verlauf:[]                        // {frage, gewaehlt, richtig}
};

/* ---------- Farbschema ---------- */

function schemaSetzen(dunkel){
  document.documentElement.setAttribute("data-bs-theme", dunkel?"dark":"light");
  el("schema").textContent = dunkel ? "☀" : "☾";
  const s=laden(); s.hell=!dunkel; sichern(s);
}
el("schema").onclick=()=>schemaSetzen(document.documentElement.getAttribute("data-bs-theme")!=="dark");
schemaSetzen(!laden().hell);

function bestwertZeigen(){
  const b=laden().best;
  const feld=el("bestwert");
  if(!b||!b.gesamt){ feld.classList.add("d-none"); return; }
  feld.classList.remove("d-none");
  feld.textContent="Bestwert "+Math.round(100*b.treffer/b.gesamt)+" %";
}

/* ---------- Fragen ziehen ---------- */

function vorrat(){ return FRAGEN.filter(f=>stand.bereiche.indexOf(f.b)>=0); }

/* Mischt die Fragen und sortiert sie dann von leicht nach schwer, damit ein
   Durchgang nicht mit der schwersten Frage beginnt. */
function ziehen(anzahl){
  const pool=vorrat().slice();
  for(let i=pool.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [pool[i],pool[j]]=[pool[j],pool[i]]; }
  const gezogen=pool.slice(0,Math.min(anzahl,pool.length));
  gezogen.sort((a,b)=>a.s-b.s);
  /* Auch die Antworten mischen – sonst steht die richtige immer an erster Stelle. */
  return gezogen.map(f=>{
    const reihen=f.a.map((text,i)=>({text,war:i}));
    for(let i=reihen.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [reihen[i],reihen[j]]=[reihen[j],reihen[i]]; }
    return {...f, mix:reihen, rMix:reihen.findIndex(x=>x.war===f.r)};
  });
}

/* ---------- Startbildschirm ---------- */

function zeigeStart(){
  const gewaehlt=id=>stand.bereiche.indexOf(id)>=0;
  const verfuegbar=vorrat().length;
  const letzte=laden().letzte;

  app.innerHTML=`
  <div class="row justify-content-center">
    <div class="col-lg-9 col-xl-8">

      <div class="text-center mb-4 einblenden">
        <h1 class="display-6 fw-bold mb-2">Wie gut kennst du Bootstrap&nbsp;5?</h1>
        <p class="lead text-body-secondary mb-0">
          80 Fragen zu Grid, Abständen, Komponenten, Formularen, Sass und dem Umstieg von Bootstrap&nbsp;4.
          Nach jeder Frage kommt die Auflösung mit Erklärung.
        </p>
      </div>

      ${letzte?`<div class="alert alert-secondary d-flex flex-wrap align-items-center gap-2 einblenden">
        <span class="me-auto">Zuletzt: <b>${letzte.treffer} von ${letzte.gesamt}</b> richtig
          (${Math.round(100*letzte.treffer/letzte.gesamt)} %)</span>
        ${letzte.falsch&&letzte.falsch.length?`<button class="btn btn-sm btn-outline-secondary" id="nurfalsch">
          Nur die ${letzte.falsch.length} falschen wiederholen</button>`:""}
      </div>`:""}

      <div class="card shadow-sm mb-3 einblenden">
        <div class="card-body">
          <h2 class="h5 card-title">Bereiche</h2>
          <p class="card-text text-body-secondary small">Wähle aus, worauf du dich prüfen lassen willst.</p>
          <div class="row row-cols-1 row-cols-sm-2 g-2">
            ${BEREICHE.map(b=>`
              <div class="col">
                <input type="checkbox" class="btn-check" id="b-${b.id}" data-bereich="${b.id}" ${gewaehlt(b.id)?"checked":""}>
                <label class="btn btn-outline-primary w-100 d-flex align-items-center gap-2 text-start" for="b-${b.id}">
                  <span class="fw-bold" style="min-width:1.5rem">${esc(b.zeichen)}</span>
                  <span class="flex-grow-1">${esc(b.name)}</span>
                  <span class="badge text-bg-secondary">${FRAGEN.filter(f=>f.b===b.id).length}</span>
                </label>
              </div>`).join("")}
          </div>
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-sm btn-outline-secondary" id="alle">Alle auswählen</button>
            <button class="btn btn-sm btn-outline-secondary" id="keine">Alle abwählen</button>
          </div>
        </div>
      </div>

      <div class="card shadow-sm mb-3 einblenden">
        <div class="card-body">
          <h2 class="h5 card-title">Wie viele Fragen?</h2>
          <div class="btn-group w-100" role="group">
            ${[10,20,40,999].map(n=>`
              <input type="radio" class="btn-check" name="anzahl" id="a-${n}" data-anzahl="${n}" ${stand.anzahl===n?"checked":""}>
              <label class="btn btn-outline-primary" for="a-${n}">${n===999?"Alle":n}</label>`).join("")}
          </div>
          <p class="card-text text-body-secondary small mt-2 mb-0" id="hinweis"></p>
        </div>
      </div>

      <button class="btn btn-primary btn-lg w-100 einblenden" id="los" ${verfuegbar?"":"disabled"}>
        Quiz starten
      </button>
    </div>
  </div>`;

  const hinweis=()=>{
    const v=vorrat().length;
    const n=Math.min(stand.anzahl,v);
    el("hinweis").textContent = v
      ? n+" von "+v+" möglichen Fragen · gemischt und von leicht nach schwer sortiert"
      : "Kein Bereich ausgewählt.";
    el("los").disabled=!v;
  };
  hinweis();

  app.querySelectorAll("[data-bereich]").forEach(cb=>cb.onchange=()=>{
    const id=cb.dataset.bereich;
    const i=stand.bereiche.indexOf(id);
    if(cb.checked && i<0) stand.bereiche.push(id);
    if(!cb.checked && i>=0) stand.bereiche.splice(i,1);
    hinweis();
  });
  el("alle").onclick=()=>{ stand.bereiche=BEREICHE.map(b=>b.id); zeigeStart(); };
  el("keine").onclick=()=>{ stand.bereiche=[]; zeigeStart(); };
  app.querySelectorAll("[data-anzahl]").forEach(r=>r.onchange=()=>{ stand.anzahl=+r.dataset.anzahl; hinweis(); });
  el("los").onclick=()=>starten(ziehen(stand.anzahl));

  if(el("nurfalsch")) el("nurfalsch").onclick=()=>{
    const ids=laden().letzte.falsch;
    const wieder=FRAGEN.filter(f=>ids.indexOf(f.f)>=0);
    if(!wieder.length) return;
    starten(wieder.map(f=>{
      const reihen=f.a.map((text,i)=>({text,war:i}));
      for(let i=reihen.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [reihen[i],reihen[j]]=[reihen[j],reihen[i]]; }
      return {...f, mix:reihen, rMix:reihen.findIndex(x=>x.war===f.r)};
    }));
  };
}

function starten(reihe){
  stand.reihe=reihe; stand.nr=0; stand.gewaehlt=null; stand.verlauf=[];
  zeigeFrage();
}

/* ---------- Frage ---------- */

const BUCHSTABEN=["A","B","C","D"];

/* Codebeispiele stehen normalerweise erst in der Aufloesung – bei der Frage
   wuerden sie die Antwort verraten. Nur wo sich die Frage ausdruecklich auf
   das Beispiel bezieht, ist es von Anfang an zu sehen (Merkmal cf). */

function zeigeFrage(){
  const f=stand.reihe[stand.nr];
  const bereich=BEREICHE.find(b=>b.id===f.b)||{name:""};
  const anteil=Math.round(100*stand.nr/stand.reihe.length);
  const aufgeloest=stand.gewaehlt!==null;
  const stufe=["","leicht","mittel","schwer"][f.s];

  app.innerHTML=`
  <div class="row justify-content-center">
    <div class="col-lg-9 col-xl-8">

      <div class="d-flex justify-content-between align-items-center small text-body-secondary mb-2">
        <span>Frage ${stand.nr+1} von ${stand.reihe.length}</span>
        <span class="d-flex gap-2">
          <span class="badge text-bg-secondary">${esc(bereich.name)}</span>
          <span class="badge text-bg-secondary">${stufe}</span>
        </span>
      </div>
      <div class="progress mb-4" style="height:.4rem" role="progressbar"
           aria-valuenow="${anteil}" aria-valuemin="0" aria-valuemax="100" aria-label="Fortschritt">
        <div class="progress-bar" style="width:${anteil}%"></div>
      </div>

      <div class="card shadow-sm mb-3 einblenden">
        <div class="card-body">
          <h1 class="h4 card-title fragetext mb-0">${html(f.f)}</h1>
          ${f.c&&f.cf?`<pre class="beispiel mt-3"><code>${esc(f.c)}</code></pre>`:""}
        </div>
      </div>

      <div class="d-grid gap-2 mb-3" id="antworten">
        ${f.mix.map((a,i)=>{
          let stil="btn-outline-secondary";
          if(aufgeloest && i===f.rMix) stil="btn-success";
          else if(aufgeloest && i===stand.gewaehlt) stil="btn-danger";
          return `<button class="btn ${stil} antwort d-flex align-items-center gap-3 py-3"
                    data-i="${i}" ${aufgeloest?"disabled":""}>
                    <span class="kennung">${BUCHSTABEN[i]}</span>
                    <span class="flex-grow-1">${html(a.text)}</span>
                    ${aufgeloest&&i===f.rMix?'<span aria-hidden="true">✓</span>':""}
                    ${aufgeloest&&i===stand.gewaehlt&&i!==f.rMix?'<span aria-hidden="true">✕</span>':""}
                  </button>`;
        }).join("")}
      </div>

      ${aufgeloest?`
      <div class="alert ${stand.gewaehlt===f.rMix?"alert-success":"alert-danger"} einblenden" role="alert">
        <h2 class="h6 alert-heading">${stand.gewaehlt===f.rMix?"Richtig":"Leider nicht"}</h2>
        <div class="erklaerung">${html(f.e)}</div>
        ${f.c&&!f.cf?`<pre class="beispiel mt-3 mb-0"><code>${esc(f.c)}</code></pre>`:""}
      </div>
      <button class="btn btn-primary btn-lg w-100" id="weiter">
        ${stand.nr+1<stand.reihe.length?"Nächste Frage":"Auswertung ansehen"}
      </button>
      <p class="text-center text-body-secondary small mt-2 mb-0">Eingabetaste drückt auch</p>
      `:`<p class="text-center text-body-secondary small mb-0">Tasten 1 bis 4 wählen ebenfalls aus</p>`}
    </div>
  </div>`;

  if(!aufgeloest){
    app.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>antworten(+b.dataset.i));
  }else{
    el("weiter").onclick=weiter;
    el("weiter").focus();
  }
}

function antworten(i){
  if(stand.gewaehlt!==null) return;
  const f=stand.reihe[stand.nr];
  stand.gewaehlt=i;
  stand.verlauf.push({frage:f, gewaehlt:i, richtig:i===f.rMix});
  zeigeFrage();
}
function weiter(){
  stand.nr++; stand.gewaehlt=null;
  if(stand.nr>=stand.reihe.length) zeigeErgebnis();
  else zeigeFrage();
}

document.addEventListener("keydown",e=>{
  if(!stand.reihe.length) return;
  if(stand.gewaehlt===null){
    const n="1234".indexOf(e.key);
    if(n>=0 && n<stand.reihe[stand.nr].mix.length){ e.preventDefault(); antworten(n); }
  }else if(e.key==="Enter"||e.key===" "){
    if(el("weiter")){ e.preventDefault(); weiter(); }
  }
});

/* ---------- Auswertung ---------- */

function zeigeErgebnis(){
  const gesamt=stand.verlauf.length;
  const treffer=stand.verlauf.filter(v=>v.richtig).length;
  const prozent=Math.round(100*treffer/gesamt);
  const falsche=stand.verlauf.filter(v=>!v.richtig);

  /* Fortschritt merken: letzter Durchgang und bester Durchgang. */
  const s=laden();
  s.letzte={treffer,gesamt,falsch:falsche.map(v=>v.frage.f)};
  if(!s.best || treffer/gesamt > s.best.treffer/s.best.gesamt) s.best={treffer,gesamt};
  sichern(s); bestwertZeigen();

  const urteil = prozent>=90 ? ["Sitzt.","success"]
              : prozent>=70 ? ["Solide Grundlage.","success"]
              : prozent>=50 ? ["Die Hälfte steht – der Rest ist Übungssache.","warning"]
                            : ["Da ist noch Luft. Schau dir die Erklärungen unten an.","danger"];

  /* Je Bereich zählen, wie viel getroffen wurde. */
  const proBereich=BEREICHE.map(b=>{
    const v=stand.verlauf.filter(x=>x.frage.b===b.id);
    return {b, gesamt:v.length, treffer:v.filter(x=>x.richtig).length};
  }).filter(x=>x.gesamt);

  app.innerHTML=`
  <div class="row justify-content-center">
    <div class="col-lg-9 col-xl-8">

      <div class="card shadow-sm text-center mb-3 einblenden">
        <div class="card-body py-4">
          <div class="display-3 fw-bold text-${urteil[1]}">${prozent}&nbsp;%</div>
          <p class="h5 mb-1">${treffer} von ${gesamt} richtig</p>
          <p class="text-body-secondary mb-0">${esc(urteil[0])}</p>
        </div>
      </div>

      <div class="card shadow-sm mb-3 einblenden">
        <div class="card-body">
          <h2 class="h5 card-title mb-3">Nach Bereich</h2>
          ${proBereich.map(x=>{
            const p=Math.round(100*x.treffer/x.gesamt);
            const farbe=p>=70?"bg-success":p>=40?"bg-warning":"bg-danger";
            return `<div class="mb-3">
              <div class="d-flex justify-content-between small mb-1">
                <span>${esc(x.b.name)}</span>
                <span class="text-body-secondary">${x.treffer}/${x.gesamt}</span>
              </div>
              <div class="progress balken" role="progressbar" aria-label="${esc(x.b.name)}"
                   aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar ${farbe}" style="width:${p}%"></div>
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>

      ${falsche.length?`
      <div class="card shadow-sm mb-3 einblenden">
        <div class="card-body">
          <h2 class="h5 card-title mb-3">Das lag daneben</h2>
          <div class="accordion" id="fehler">
            ${falsche.map((v,i)=>`
              <div class="accordion-item">
                <h3 class="accordion-header">
                  <button class="accordion-button ${i?"collapsed":""}" type="button"
                          data-bs-toggle="collapse" data-bs-target="#f${i}">
                    <span class="fragetext">${html(v.frage.f)}</span>
                  </button>
                </h3>
                <div id="f${i}" class="accordion-collapse collapse ${i?"":"show"}" data-bs-parent="#fehler">
                  <div class="accordion-body">
                    <p class="mb-2"><span class="badge text-bg-danger">Deine Antwort</span>
                      <span class="ms-2 fragetext">${html(v.frage.mix[v.gewaehlt].text)}</span></p>
                    <p class="mb-3"><span class="badge text-bg-success">Richtig</span>
                      <span class="ms-2 fragetext">${html(v.frage.mix[v.frage.rMix].text)}</span></p>
                    ${v.frage.c?`<pre class="beispiel mb-3"><code>${esc(v.frage.c)}</code></pre>`:""}
                    <div class="erklaerung text-body-secondary">${html(v.frage.e)}</div>
                  </div>
                </div>
              </div>`).join("")}
          </div>
        </div>
      </div>`:""}

      <div class="d-grid gap-2">
        ${falsche.length?`<button class="btn btn-primary btn-lg" id="wiederholen">
          Die ${falsche.length} falschen wiederholen</button>`:""}
        <button class="btn ${falsche.length?"btn-outline-primary":"btn-primary btn-lg"}" id="nochmal">Neuer Durchgang</button>
        <button class="btn btn-outline-secondary" id="zurueck">Zur Auswahl</button>
      </div>
    </div>
  </div>`;

  window.scrollTo({top:0,behavior:"smooth"});
  if(el("wiederholen")) el("wiederholen").onclick=()=>starten(falsche.map(v=>{
    const f=v.frage;
    const reihen=f.a.map((text,i)=>({text,war:i}));
    for(let i=reihen.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [reihen[i],reihen[j]]=[reihen[j],reihen[i]]; }
    return {...f, mix:reihen, rMix:reihen.findIndex(x=>x.war===f.r)};
  }));
  el("nochmal").onclick=()=>starten(ziehen(stand.anzahl));
  el("zurueck").onclick=()=>{ stand.reihe=[]; zeigeStart(); };
}

bestwertZeigen();
zeigeStart();
