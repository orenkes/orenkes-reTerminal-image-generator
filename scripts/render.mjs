function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cloudPath(id = "") {
  const prefix = id ? ` id="${id}"` : "";
  return `<path${prefix} d="M13 32h24a9 9 0 0 0 .2-18 11 11 0 0 0-21.4 3.2A7.5 7.5 0 0 0 13 32z" fill="#8a96a8" stroke="#5c6778" stroke-width="1.5" stroke-linejoin="round"/>`;
}

function weatherIconSvg(type) {
  const icons = {
    sun: `<svg viewBox="0 0 48 48" aria-hidden="true" role="img">
      <circle cx="24" cy="22" r="9" fill="#f4b942" stroke="#c98712" stroke-width="1.5"/>
      <g stroke="#c98712" stroke-width="2.5" stroke-linecap="round">
        <line x1="24" y1="4" x2="24" y2="9"/><line x1="24" y1="35" x2="24" y2="40"/>
        <line x1="4" y1="22" x2="9" y2="22"/><line x1="39" y1="22" x2="44" y2="22"/>
        <line x1="9.8" y1="7.8" x2="13.2" y2="11.2"/><line x1="34.8" y1="32.8" x2="38.2" y2="36.2"/>
        <line x1="34.8" y1="11.2" x2="38.2" y2="7.8"/><line x1="9.8" y1="36.2" x2="13.2" y2="32.8"/>
      </g>
    </svg>`,
    partly: `<svg viewBox="0 0 48 48" aria-hidden="true" role="img">
      <circle cx="17" cy="16" r="7" fill="#f4b942" stroke="#c98712" stroke-width="1.2"/>
      <g stroke="#c98712" stroke-width="2" stroke-linecap="round">
        <line x1="17" y1="4" x2="17" y2="7"/><line x1="26" y1="7" x2="24" y2="10"/><line x1="8" y1="7" x2="10" y2="10"/>
      </g>
      ${cloudPath()}
    </svg>`,
    cloud: `<svg viewBox="0 0 48 48" aria-hidden="true" role="img">
      ${cloudPath()}
    </svg>`,
    rain: `<svg viewBox="0 0 48 48" aria-hidden="true" role="img">
      ${cloudPath()}
      <g fill="#3b7ddd" stroke="#2563b8" stroke-width="0.5">
        <path d="M14 36v6c0 1.1.9 2 2 2s2-.9 2-2v-6c0-1.1-.9-2-2-2s-2 .9-2 2z"/>
        <path d="M22 38v7c0 1.1.9 2 2 2s2-.9 2-2v-7c0-1.1-.9-2-2-2s-2 .9-2 2z"/>
        <path d="M30 36v6c0 1.1.9 2 2 2s2-.9 2-2v-6c0-1.1-.9-2-2-2s-2 .9-2 2z"/>
      </g>
    </svg>`,
    storm: `<svg viewBox="0 0 48 48" aria-hidden="true" role="img">
      <path d="M13 30h24a9 9 0 0 0 .2-18 11 11 0 0 0-21.4 3.2A7.5 7.5 0 0 0 13 30z" fill="#6b7585" stroke="#454f5c" stroke-width="1.5"/>
      <path d="M26 30l-5 9h5l-3 9 11-15h-6l3-3z" fill="#f0c020" stroke="#b8860b" stroke-width="1" stroke-linejoin="round"/>
    </svg>`,
    snow: `<svg viewBox="0 0 48 48" aria-hidden="true" role="img">
      ${cloudPath()}
      <g stroke="#4a90d9" stroke-width="2" stroke-linecap="round">
        <g transform="translate(15 40)"><line x1="0" y1="-4" x2="0" y2="4"/><line x1="-4" y1="0" x2="4" y2="0"/><line x1="-3" y1="-3" x2="3" y2="3"/><line x1="3" y1="-3" x2="-3" y2="3"/></g>
        <g transform="translate(24 42)"><line x1="0" y1="-4" x2="0" y2="4"/><line x1="-4" y1="0" x2="4" y2="0"/><line x1="-3" y1="-3" x2="3" y2="3"/><line x1="3" y1="-3" x2="-3" y2="3"/></g>
        <g transform="translate(33 40)"><line x1="0" y1="-4" x2="0" y2="4"/><line x1="-4" y1="0" x2="4" y2="0"/><line x1="-3" y1="-3" x2="3" y2="3"/><line x1="3" y1="-3" x2="-3" y2="3"/></g>
      </g>
    </svg>`
  };
  return icons[type] || icons.partly;
}

function periodChip(period, hideLabel = false) {
  const temp =
    period.temp != null && Number.isFinite(Number(period.temp))
      ? `<span class="period-temp">${escapeHtml(String(Math.round(Number(period.temp))))}°</span>`
      : "";
  const label =
    !hideLabel && period.label
      ? `<span class="period-label">${escapeHtml(period.label)}</span>`
      : "";
  return `
    <div class="period-chip">
      <div class="period-icon">${weatherIconSvg(period.icon)}</div>
      <span class="period-name">${escapeHtml(period.name)}</span>
      ${temp}
      ${label}
    </div>
  `;
}

function todaySection(today) {
  const summary = today.summary || "";
  const periods = (today.periods || [])
    .map(period => periodChip(period, period.label === summary))
    .join("");
  return `
    <section class="dock-cell dock-today glass-card">
      <div class="today-top">
        <div class="dock-day-label">היום</div>
        <p class="today-meta"><span>טמפ׳ ${escapeHtml(today.tempRange)}°</span><span class="meta-dot">·</span><span>לחות ${escapeHtml(String(today.humidity))}%</span></p>
      </div>
      <div class="today-periods">${periods}</div>
    </section>
  `;
}

function aheadSection(day) {
  return `
    <section class="dock-cell dock-ahead glass-card">
      <div class="ahead-icon">${weatherIconSvg(day.icon)}</div>
      <div class="ahead-temps"><span class="temp-high">${escapeHtml(String(day.high))}°</span><span class="temp-sep">/</span><span class="temp-low">${escapeHtml(String(day.low))}°</span></div>
      <div class="ahead-day">${escapeHtml(day.dayLabel)}</div>
      <div class="ahead-label">${escapeHtml(day.label)}</div>
    </section>
  `;
}

function forecastDock(today, ahead) {
  return `
    <div class="forecast-dock">
      ${todaySection(today)}
      ${ahead.map(aheadSection).join("")}
    </div>
  `;
}

function heroSpotlight(hero) {
  if (!hero) return "";
  const trend = hero.trend
    ? `<p class="hero-trend">${escapeHtml(hero.trend)}</p>`
    : "";
  return `
    <section class="hero-spotlight" aria-label="סיכום היום">
      <p class="hero-summary">${escapeHtml(hero.summary)}</p>
      <p class="hero-details">
        <span>זריחה ${escapeHtml(hero.sunrise)}</span>
        <span class="hero-dot">·</span>
        <span>שקיעה ${escapeHtml(hero.sunset)}</span>
        <span class="hero-dot">·</span>
        <span>${escapeHtml(hero.wind)}</span>
      </p>
      ${trend}
    </section>
  `;
}

export function buildHtml(payload) {
  const { weather, background, slot } = payload;
  const bgRef = background?.imageUrl
    ? escapeHtml(background.imageUrl)
    : null;
  const bgStyle = bgRef
    ? `background-image: url('${bgRef}');`
    : `background-image: linear-gradient(135deg, #f7d57a 0%, #f6c56d 35%, #9fd3e8 100%);`;

  const aheadCount = weather.ahead?.length || 3;
  const today = weather.today || weather.current || {};
  const ahead = weather.ahead || weather.forecast?.slice(1) || [];
  const hero = weather.hero;
  const heroBlock = heroSpotlight(hero);
  const dock = forecastDock(today, ahead);

  return `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=800, height=480, initial-scale=1" />
    <title>${escapeHtml(weather.locationLine)}${slot ? ` — ${escapeHtml(slot)}` : ""}</title>
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: 800px;
        height: 480px;
        overflow: hidden;
        font-family: "Avenir Next", "Rubik", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        color: #111;
      }
      .screen {
        position: relative;
        width: 800px;
        height: 480px;
        ${bgStyle}
        background-size: cover;
        background-position: center;
      }
      .layout {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
      }
      .layout > * {
        pointer-events: auto;
      }
      .on-image-text :is(h1, p, span) {
        text-shadow:
          0 0 14px rgba(255, 255, 255, 0.95),
          0 0 28px rgba(255, 255, 255, 0.75),
          0 1px 3px rgba(15, 23, 42, 0.12);
      }
      .glass-card {
        background: rgba(255, 255, 255, 0.34);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.55);
        border-radius: 14px;
        box-shadow: 0 2px 14px rgba(15, 23, 42, 0.07);
      }
      .info-side {
        position: absolute;
        top: 18px;
        right: 18px;
        left: auto;
        width: min(400px, 48%);
        display: flex;
        flex-direction: column;
        align-items: stretch;
        padding: 4px 6px 0;
        min-width: 0;
        background: transparent;
        border: none;
        box-shadow: none;
      }
      .header {
        text-align: right;
        padding: 0 2px 8px;
      }
      .date-line {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: 0.01em;
      }
      .location-line {
        margin: 4px 0 0;
        font-size: 42px;
        font-weight: 800;
        line-height: 1.02;
        color: #020617;
        letter-spacing: -0.02em;
      }
      .hero-spotlight {
        margin-top: auto;
        text-align: right;
        padding: 4px 2px 0;
      }
      .hero-summary {
        margin: 0;
        font-size: 26px;
        font-weight: 800;
        color: #020617;
        line-height: 1.25;
      }
      .hero-details {
        margin: 8px 0 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
      }
      .hero-dot { opacity: 0.55; color: #64748b; }
      .hero-trend {
        margin: 8px 0 0;
        font-size: 15px;
        font-weight: 800;
        color: #0f172a;
      }
      .forecast-dock {
        position: absolute;
        left: 14px;
        right: 14px;
        bottom: 14px;
        display: grid;
        grid-template-columns: 1.35fr repeat(${aheadCount}, 1fr);
        gap: 8px;
        align-items: stretch;
        padding: 0;
        overflow: visible;
        background: transparent;
        border: none;
        box-shadow: none;
      }
      .dock-cell {
        padding: 8px 8px 7px;
        min-height: 0;
      }
      .dock-today {
        text-align: right;
        padding-inline: 10px 10px;
      }
      .today-top {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }
      .dock-day-label {
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #334155;
        margin: 0;
        flex-shrink: 0;
      }
      .today-meta {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        white-space: nowrap;
      }
      .meta-dot { opacity: 0.45; }
      .today-periods {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 5px;
      }
      .period-chip {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 1px;
        padding: 5px 3px 4px;
        text-align: center;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.42);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
      .period-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        opacity: 0.95;
      }
      .period-icon svg {
        width: 100%;
        height: 100%;
        display: block;
      }
      .period-name {
        font-size: 12px;
        font-weight: 800;
        color: #334155;
        line-height: 1.1;
      }
      .period-temp {
        font-size: 18px;
        font-weight: 800;
        color: #020617;
        line-height: 1;
        letter-spacing: -0.02em;
      }
      .period-label {
        font-size: 11px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
        max-width: 100%;
      }
      .dock-ahead {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 2px;
        padding-top: 2px;
        min-height: 0;
      }
      .ahead-icon {
        width: 28px;
        height: 28px;
        margin-bottom: 0;
      }
      .ahead-icon svg {
        width: 100%;
        height: 100%;
        display: block;
        filter: drop-shadow(0 2px 4px rgba(15,23,42,0.08));
      }
      .ahead-temps {
        font-size: 14px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: 0.02em;
      }
      .temp-low {
        font-weight: 700;
        color: #334155;
      }
      .temp-sep {
        margin: 0 2px;
        opacity: 0.35;
        font-weight: 500;
      }
      .ahead-day {
        margin-top: 0;
        font-size: 14px;
        font-weight: 800;
        color: #1e293b;
        line-height: 1.15;
      }
      .ahead-label {
        font-size: 11px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
        max-width: 92%;
      }
    </style>
  </head>
  <body>
    <div class="screen">
      <div class="layout">
        <div class="info-side on-image-text">
          <header class="header">
            <p class="date-line">${escapeHtml(weather.dateLine)}</p>
            <h1 class="location-line">${escapeHtml(weather.locationLine)}</h1>
          </header>
          ${heroBlock}
        </div>
        ${dock}
      </div>
    </div>
  </body>
</html>
`;
}

export function buildPrompt(payload) {
  const { weather, background } = payload;
  return [
    "Create a single full-bleed landscape background for an e-ink weather display.",
    "No logos, no watermark, no UI chrome, no blank margins for text.",
    `Location mood: ${weather.locationLine}.`,
    `Weather today: ${weather.today?.summary || weather.current?.summary}.`,
    `Ahead: ${(weather.ahead || []).map(day => `${day.dayLabel} ${day.high}/${day.low}`).join(", ")}.`,
    `Visual direction: ${background?.query || "soft watercolor landscape"}.`,
    "Calm, bright, readable, Israeli summer feel."
  ].join(" ");
}
