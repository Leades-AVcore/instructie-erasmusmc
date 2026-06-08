const app = document.querySelector("#app");
const state = {
  rooms: [],
  room: null,
  view: "home",
  mode: "start",
  source: "Laptop via USB-C",
  volume: 42,
  adminOpen: false
};

const icon = (name, size = 20) => `<i data-lucide="${name}" style="width:${size}px;height:${size}px" aria-hidden="true"></i>`;

const params = () => new URLSearchParams(window.location.search);

const getView = () => params().get("view") || "home";

const getRoomId = () => params().get("room") || state.room?.id || state.rooms[0]?.id;

const roomLink = (view, roomId = state.room.id) => `./index.html?view=${view}&room=${encodeURIComponent(roomId)}`;

const publicRoomUrl = (roomId = state.room.id) => {
  const url = new URL(window.location.href);
  url.search = `?view=room&room=${encodeURIComponent(roomId)}`;
  url.hash = "";
  return url.toString();
};

async function init() {
  try {
    const response = await fetch("./assets/rooms.json", { cache: "no-cache" });
    const data = await response.json();
    state.rooms = data.rooms;
    const requestedRoom = params().get("room") || data.defaultRoom;
    state.room = state.rooms.find((room) => room.id === requestedRoom) || state.rooms[0];
    state.source = state.room.sources[0];
    state.view = getView();
    render();
  } catch (error) {
    app.innerHTML = `<section class="info-card"><h1>Platform kon niet laden</h1><p>${error.message}</p></section>`;
  }
}

function render() {
  state.view = getView();
  const roomId = getRoomId();
  state.room = state.rooms.find((room) => room.id === roomId) || state.rooms[0];
  if (!state.room.sources.includes(state.source)) state.source = state.room.sources[0];

  app.innerHTML =
    state.view === "screens"
      ? renderScreens()
      : state.view === "room"
        ? renderRoomPage()
        : state.view === "beheer"
          ? renderAdmin()
          : renderHome();

  setActiveNav();
  bindEvents();
  renderQrCodes();
  refreshIcons();
}

function setActiveNav() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const key = link.getAttribute("data-nav");
    link.classList.toggle("active", key === state.view || (state.view === "home" && key === "home"));
  });
}

function roomSelector() {
  return `
    <div class="room-select">
      <label for="roomPicker">Ruimte</label>
      <select id="roomPicker">
        ${state.rooms.map((room) => `<option value="${room.id}" ${room.id === state.room.id ? "selected" : ""}>${room.number} - ${room.type}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderHome() {
  return `
    <section class="workspace">
      <div class="page-head">
        <div>
          <p class="eyebrow">Werkend prototype</p>
          <h1>AV-instructie per ruimte</h1>
          <p>Ruimteschermen, QR-instructie, support en beheer in één testplatform.</p>
        </div>
        ${roomSelector()}
      </div>

      <div class="option-grid">
        <article class="option-card">
          <header>
            <div>
              <p class="eyebrow">Demo weergave</p>
              <h2>Vergaderruimte</h2>
              <p>Een realistische ruimteweergave met Sony scherm, Yealink UVC40 en touchpanel op tafel.</p>
            </div>
            <span class="icon-tile">${icon("monitor", 24)}</span>
          </header>
          <ul>
            <li>65 inch scherm aan de wand</li>
            <li>10 inch bedienpaneel op tafel</li>
            <li>Grote knoppen voor Teams, Presenteren en Help</li>
          </ul>
          <div class="actions">
            <a class="pill-button primary" href="${roomLink("screens")}">${icon("play", 18)}Open demo</a>
          </div>
        </article>

        <article class="option-card">
          <header>
            <div>
              <p class="eyebrow">Demo platform</p>
              <h2>Mobiele instructie</h2>
              <p>De ruimtespecifieke pagina waar gebruikers na het scannen van de QR-code terechtkomen.</p>
            </div>
            <span class="icon-tile">${icon("qr-code", 24)}</span>
          </header>
          <ul>
            <li>Stappen per gebruiksscenario</li>
            <li>Veelvoorkomende problemen</li>
            <li>Support en concept-storingsmelding</li>
          </ul>
          <div class="actions">
            <a class="pill-button primary" href="${roomLink("room")}">${icon("external-link", 18)}Open platform</a>
            <a class="ghost-button" href="${roomLink("beheer")}">${icon("settings", 18)}Beheer</a>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderScreens() {
  return `
    <section class="workspace demo-workspace">
      <div class="page-head">
        <div>
          <p class="eyebrow">Demo weergave</p>
          <h1>Vergaderruimte in gebruik</h1>
          <p>${state.room.name} - ${state.room.location}</p>
        </div>
        ${roomSelector()}
      </div>

      <div class="meeting-room-scene" aria-label="Realistische vergaderruimte demo">
        <div class="room-back-wall">
          <div class="wall-panel">
            <div class="sony-display" aria-label="Sony 65 inch hoofdscherm">
              <div class="display-brand">SONY</div>
              <div class="sony-screen">
                ${renderMeetingScreen()}
              </div>
            </div>
          </div>
        </div>

        <div class="room-floor">
          <div class="chair chair-left"></div>
          <div class="chair chair-right"></div>
          <div class="conference-table">
            <div class="table-highlight"></div>
            <aside class="touch-panel-device" aria-label="10 inch bedienpaneel op tafel">
              <div class="touch-panel-screen">
                <div class="panel-top">
                  <div class="panel-room">
                    <strong>${state.room.number}</strong>
                    <small>${state.room.type}</small>
                  </div>
                  <span class="panel-chip">${state.volume}%</span>
                </div>

                <div class="touch-button-grid">
                  ${panelButton("teams", "video", "Teams")}
                  ${panelButton("presenteren", "presentation", "Presenteren")}
                  ${panelButton("help", "circle-help", "Help")}
                </div>

                <div class="volume-row">
                  <span>Volume</span>
                  <div class="volume-controls">
                    <button class="icon-button" data-action="volume-down" title="Volume lager">${icon("volume-1", 19)}</button>
                    <input data-action="volume" type="range" min="0" max="100" value="${state.volume}" aria-label="Volume" />
                    <button class="icon-button" data-action="volume-up" title="Volume hoger">${icon("volume-2", 19)}</button>
                  </div>
                </div>

                <div class="panel-help ${state.mode === "help" ? "open" : ""}" id="panelHelp">
                  <strong>Hulp nodig?</strong>
                  <span>Scan de QR-code op het hoofdscherm of open het demo platform.</span>
                  <a class="pill-button primary" href="${roomLink("room")}">${icon("external-link", 17)}Open platform</a>
                </div>
              </div>
            </aside>
          </div>
          <div class="chair chair-front-left"></div>
          <div class="chair chair-front-right"></div>
        </div>
        <div class="scene-videobar" aria-label="Yealink UVC40 videobar zichtbaar onder het scherm">
          <span class="camera-lens"></span>
          <span class="bar-brand">Yealink UVC40</span>
          <span class="speaker-dot"></span>
        </div>
      </div>
    </section>
  `;
}

function renderMeetingScreen() {
  if (state.mode === "presenteren") {
    return screenStatus("presentation", "Presenteren actief", `${state.source} is geselecteerd. Controleer beeld en geluid op het hoofdscherm.`);
  }
  if (state.mode === "teams") {
    return screenStatus("video", "Teams vergadering", "Start Teams via de EMC-PC of gekoppelde laptop en controleer camera, microfoon en luidsprekers.");
  }
  if (state.mode === "help") {
    return `
      <div class="screen-content">
        <img class="screen-logo" src="./assets/erasmus-mc.png" alt="Erasmus MC" />
        <div class="screen-help-layout">
          <div>
            <div class="screen-kicker">Hulp in ruimte ${state.room.number}</div>
            <h2 class="screen-title">Scan voor ondersteuning</h2>
            <p class="screen-subtitle">Open de ruimtespecifieke instructie, meld een storing of bel direct support.</p>
          </div>
          <div class="qr-panel">
            <div class="qr-code" data-qr="${publicRoomUrl()}"></div>
            <strong>Demo platform</strong>
          </div>
        </div>
      </div>
    `;
  }
  return `
    <div class="screen-content">
      <img class="screen-logo" src="./assets/erasmus-mc.png" alt="Erasmus MC" />
      <div class="welcome-layout">
        <div>
          <div class="screen-kicker">Welkom in ruimte ${state.room.number}</div>
          <h2 class="screen-title">${state.room.type}</h2>
          <p class="screen-subtitle">Kies uw gebruiksscenario op het bedienpaneel.</p>
        </div>
        <div class="qr-panel">
          <div class="qr-code" data-qr="${publicRoomUrl()}"></div>
          <strong>Demo platform</strong>
        </div>
      </div>
    </div>
  `;
}

function screenStatus(iconName, title, text) {
  return `
    <div class="screen-content">
      <img class="screen-logo" src="./assets/erasmus-mc.png" alt="Erasmus MC" />
      <div class="screen-status">
        <span class="icon-tile">${icon(iconName, 30)}</span>
        <div>
          <p class="screen-kicker">${state.room.number} · ${state.room.type}</p>
          <h2>${title}</h2>
          <p class="screen-subtitle">${text}</p>
          <div class="screen-action-row compact">
            <span>Volume ${state.volume}%</span>
            <span>${state.room.number}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function panelButton(mode, iconName, label) {
  return `
    <button class="panel-button ${state.mode === mode ? "active" : ""}" data-mode="${mode}">
      ${icon(iconName, 24)}
      <span>${label}</span>
    </button>
  `;
}

function renderRoomPage() {
  return `
    <section class="workspace">
      <div class="page-head">
        <div>
          <img class="page-logo" src="./assets/erasmus-mc.png" alt="Erasmus MC" />
          <p class="eyebrow">Demo platform</p>
          <h1>${state.room.name}</h1>
          <p>${state.room.location}</p>
          <div class="meta-row">
            <span class="tag">${icon("door-open", 15)}${state.room.type}</span>
            <span class="tag">${icon("map-pin", 15)}${state.room.number}</span>
            <span class="tag ${state.room.status === "In gebruik" ? "warning" : ""}">${icon("activity", 15)}${state.room.status}</span>
          </div>
        </div>
        ${roomSelector()}
      </div>

      <div class="room-page">
        <div class="quick-actions">
          <a class="quick-action primary" href="#supportForm">${icon("message-square-warning", 22)}Storing melden</a>
          <a class="quick-action" href="tel:${state.room.supportPhone.replaceAll(" ", "")}">${icon("phone", 22)}Bel support</a>
          <a class="quick-action" href="${roomLink("beheer")}">${icon("lock-keyhole", 22)}Beheer</a>
        </div>

        <div class="scenario-grid">
          ${state.room.scenarios.map(renderScenario).join("")}
        </div>

        <aside class="side-stack">
          <section class="support-card urgent">
            <div class="support-line">
              <span class="support-icon">${icon("phone", 22)}</span>
              <div>
                <span>Directe hulp</span>
                <strong>${state.room.supportPhone}</strong>
              </div>
            </div>
          </section>

          <section class="support-card">
            <h2>Veelvoorkomende problemen</h2>
            <ul class="issue-list">
              ${state.room.issues.map((issue) => `<li>${issue}</li>`).join("")}
            </ul>
          </section>

          <section class="support-card">
            <h2>Storing melden</h2>
            <form id="supportForm" class="field-grid">
              <label class="field">
                <span>Type melding</span>
                <select name="type">
                  <option>Geen beeld</option>
                  <option>Geen geluid</option>
                  <option>Teams probleem</option>
                  <option>Bediening werkt niet</option>
                  <option>Anders</option>
                </select>
              </label>
              <label class="field">
                <span>Ruimte</span>
                <input name="room" value="${state.room.number}" readonly />
              </label>
              <label class="field full">
                <span>Omschrijving</span>
                <textarea name="description" rows="4" placeholder="Beschrijf kort wat er niet werkt"></textarea>
              </label>
              <label class="field full">
                <span>Foto toevoegen</span>
                <input name="photo" type="file" accept="image/*" />
              </label>
              <div class="field full actions">
                <button class="action-button primary" type="submit">${icon("send", 17)}Melding opslaan</button>
                <a class="ghost-button" href="${state.room.servicePortal}" target="_blank" rel="noreferrer">${icon("external-link", 17)}Serviceportaal</a>
              </div>
              <p class="form-note field full" id="supportNote"></p>
            </form>
          </section>
        </aside>
      </div>
    </section>
  `;
}

function renderScenario(scenario, index) {
  return `
    <article class="scenario-card ${index === 0 ? "open" : ""}">
      <button class="tab-button" data-action="toggle-scenario" type="button">
        <span>${scenario.title}</span>
        ${icon("chevron-down", 18)}
      </button>
      <p>${scenario.summary}</p>
      <div class="scenario-details">
        <ol class="step-list">
          ${scenario.steps.map((step) => `<li>${step}</li>`).join("")}
        </ol>
      </div>
    </article>
  `;
}

function renderAdmin() {
  if (!state.adminOpen) {
    return `
      <section class="workspace">
        <div class="page-head">
          <div>
            <p class="eyebrow">Beheerfunctie</p>
            <h1>Ruimtebeheer</h1>
            <p>Afgeschermd onderdeel voor apparatuurlijst, controles, storingen en onderhoudsregistratie.</p>
          </div>
          ${roomSelector()}
        </div>
        <section class="admin-hero">
          <form id="adminLogin" class="admin-login">
            <label class="field">
              <span>Demo toegangscode</span>
              <input name="code" placeholder="Vul beheer in" autocomplete="off" />
            </label>
            <button class="action-button primary" type="submit">${icon("lock-keyhole", 17)}Beheer openen</button>
            <p class="form-note" id="adminNote"></p>
          </form>
        </section>
      </section>
    `;
  }

  return `
    <section class="workspace">
      <div class="page-head">
        <div>
          <p class="eyebrow">Beheerfunctie</p>
          <h1>${state.room.name}</h1>
          <p>Eigenaar: ${state.room.owner}</p>
        </div>
        ${roomSelector()}
      </div>

      <div class="metric-grid">
        <article class="metric-card"><span>Status</span><strong>${state.room.status}</strong></article>
        <article class="metric-card"><span>Eigenaar</span><strong>${state.room.owner}</strong></article>
        <article class="metric-card"><span>Apparaten</span><strong>${state.room.equipment.length}</strong></article>
        <article class="metric-card"><span>Storingen</span><strong>${state.room.incidents.length}</strong></article>
      </div>

      <div class="admin-grid">
        <section class="admin-card">
          <h2>Apparatuurlijst</h2>
          <ul class="equipment-list">
            ${state.room.equipment.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </section>

        <section class="admin-card">
          <h2>Laatste controles</h2>
          <ul class="equipment-list">
            ${state.room.checks.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </section>

        <section class="admin-card">
          <h2>Laatste storingen</h2>
          <ul class="timeline-list">
            ${(state.room.incidents.length ? state.room.incidents : [{ date: "-", title: "Geen recente storingen", status: "Actueel" }])
              .map((incident) => `<li><span>${incident.date} · ${incident.title}</span><strong>${incident.status}</strong></li>`)
              .join("")}
          </ul>
        </section>

        <section class="admin-card">
          <h2>Onderhoud registreren</h2>
          <form id="maintenanceForm" class="field-grid">
            <label class="field">
              <span>Datum</span>
              <input name="date" type="date" />
            </label>
            <label class="field">
              <span>Status</span>
              <select name="status">
                <option>Controle uitgevoerd</option>
                <option>Onderhoud gepland</option>
                <option>Actie vereist</option>
              </select>
            </label>
            <label class="field full">
              <span>Opmerking</span>
              <textarea name="note" rows="4" placeholder="Korte beheeropmerking"></textarea>
            </label>
            <div class="field full actions">
              <button class="action-button primary" type="submit">${icon("save", 17)}Registreren</button>
              <button class="ghost-button" data-action="close-admin" type="button">${icon("lock", 17)}Sluiten</button>
            </div>
            <p class="form-note field full" id="maintenanceNote"></p>
          </form>
        </section>
      </div>
    </section>
  `;
}

function bindEvents() {
  const picker = document.querySelector("#roomPicker");
  if (picker) {
    picker.addEventListener("change", (event) => {
      const url = new URL(window.location.href);
      url.searchParams.set("room", event.target.value);
      if (!url.searchParams.get("view")) url.searchParams.set("view", state.view);
      window.history.pushState({}, "", url);
      state.mode = "start";
      render();
    });
  }

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      render();
    });
  });

  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", handleAction);
    element.addEventListener("input", handleInput);
    element.addEventListener("change", handleInput);
  });

  const supportForm = document.querySelector("#supportForm");
  if (supportForm) {
    supportForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(supportForm);
      const records = JSON.parse(localStorage.getItem("av-support-records") || "[]");
      records.unshift({
        room: state.room.number,
        type: form.get("type"),
        description: form.get("description"),
        date: new Date().toLocaleString("nl-NL")
      });
      localStorage.setItem("av-support-records", JSON.stringify(records.slice(0, 20)));
      supportForm.reset();
      document.querySelector("#supportNote").textContent = "Conceptmelding opgeslagen in deze demo.";
      showToast("Melding opgeslagen voor de testomgeving.");
    });
  }

  const adminLogin = document.querySelector("#adminLogin");
  if (adminLogin) {
    adminLogin.addEventListener("submit", (event) => {
      event.preventDefault();
      const code = new FormData(adminLogin).get("code");
      if (String(code).trim().toLowerCase() === "beheer") {
        state.adminOpen = true;
        render();
      } else {
        document.querySelector("#adminNote").textContent = "Gebruik voor de demo de code: beheer";
      }
    });
  }

  const maintenanceForm = document.querySelector("#maintenanceForm");
  if (maintenanceForm) {
    maintenanceForm.addEventListener("submit", (event) => {
      event.preventDefault();
      maintenanceForm.reset();
      document.querySelector("#maintenanceNote").textContent = "Onderhoudsregistratie opgeslagen in deze demo.";
      showToast("Onderhoudsregistratie opgeslagen.");
    });
  }
}

function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  if (action === "help") {
    document.querySelector("#panelHelp")?.classList.toggle("open");
  }
  if (action === "volume-down") {
    state.volume = Math.max(0, state.volume - 8);
    render();
  }
  if (action === "volume-up") {
    state.volume = Math.min(100, state.volume + 8);
    render();
  }
  if (action === "toggle-scenario") {
    event.currentTarget.closest(".scenario-card")?.classList.toggle("open");
  }
  if (action === "close-admin") {
    state.adminOpen = false;
    render();
  }
}

function handleInput(event) {
  const action = event.currentTarget.dataset.action;
  if (action === "volume") {
    state.volume = Number(event.currentTarget.value);
    const sourceStrip = document.querySelector(".source-strip span:last-child");
    if (sourceStrip) sourceStrip.textContent = `Bron: ${state.source} · Volume: ${state.volume}%`;
    document.querySelector(".panel-chip") && (document.querySelector(".panel-chip").textContent = `${state.volume}%`);
  }
  if (action === "source") {
    state.source = event.currentTarget.value;
    render();
  }
}

function renderQrCodes() {
  document.querySelectorAll(".qr-code[data-qr]").forEach((target) => {
    const text = target.dataset.qr;
    const size = target.closest(".panel-qr") ? 78 : 170;
    target.innerHTML = "";
    if (window.QRCode) {
      new window.QRCode(target, {
        text,
        width: size,
        height: size,
        colorDark: "#142125",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.M
      });
    } else {
      const fallback = document.createElement("a");
      fallback.href = text;
      fallback.textContent = "Open QR-link";
      target.replaceWith(fallback);
    }
  });
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

window.addEventListener("popstate", render);
window.addEventListener("DOMContentLoaded", init);
