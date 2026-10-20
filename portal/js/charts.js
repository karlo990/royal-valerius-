/* Tiny SVG charts for Crest Quest (no libraries). Each returns an SVG/HTML string. */
(() => {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // term average over time, with a soft gold area
  function line(points, { w = 640, h = 220, min = 40, max = 100 } = {}) {
    const pad = { l: 34, r: 14, t: 16, b: 30 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const x = (i) => pad.l + (points.length < 2 ? iw / 2 : (i * iw) / (points.length - 1));
    const y = (v) => pad.t + ih - ((v - min) / (max - min)) * ih;
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.avg).toFixed(1)}`).join(' ');
    const grid = [50, 60, 70, 80, 90].map((v) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y(v)}" y2="${y(v)}" class="g"/><text x="${pad.l - 8}" y="${y(v) + 4}" class="ax" text-anchor="end">${v}</text>`).join('');
    const dots = points.map((p, i) => `<g class="pt"><circle cx="${x(i)}" cy="${y(p.avg)}" r="5"/><text x="${x(i)}" y="${y(p.avg) - 12}" text-anchor="middle" class="val">${p.avg}%</text><text x="${x(i)}" y="${h - 8}" text-anchor="middle" class="ax">${esc(p.label)}</text></g>`).join('');
    return `<svg class="chart-line" viewBox="0 0 ${w} ${h}" role="img" aria-label="Average marks over the term">
      <defs><linearGradient id="lg-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d2ae4c" stop-opacity=".35"/><stop offset="1" stop-color="#d2ae4c" stop-opacity="0"/></linearGradient></defs>
      ${grid}<path d="${d} L${x(points.length - 1)} ${pad.t + ih} L${x(0)} ${pad.t + ih} Z" fill="url(#lg-area)"/><path d="${d}" class="ln"/>${dots}</svg>`;
  }

  // subject marks against the class average
  function bars(subjects) {
    return `<div class="bars">${subjects.map((s) => `
      <div class="bar-row" data-route="#/results">
        <span class="bn">${esc(s.name)}</span>
        <span class="bt"><i class="g-${s.grade}" style="width:${s.total}%"></i><b class="avg" style="left:${s.class_avg}%" title="Class average ${s.class_avg}%"></b></span>
        <span class="bv">${s.total}<small>%</small> <em class="grade g-${s.grade}">${s.grade}</em></span>
      </div>`).join('')}</div>`;
  }

  function ring(pct, { size = 120, stroke = 11, label = '' } = {}) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, pct)));
    return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="rt" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="rv" stroke-width="${stroke}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="50%" dy=".35em" text-anchor="middle" class="rl">${esc(label)}</text></svg>`;
  }

  // school days as a GitHub-style grid: one column per week, Mon–Fri rows
  function heat(days) {
    if (!days.length) return '';
    const first = new Date(days[0].date), monday = new Date(first); monday.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const cols = {};
    days.forEach((d) => {
      const dt = new Date(d.date), wk = Math.floor((dt - monday) / (7 * 864e5)), row = (dt.getDay() + 6) % 7;
      (cols[wk] = cols[wk] || [])[row] = d;
    });
    const weeks = Object.keys(cols).map(Number).sort((a, b) => a - b);
    return `<div class="heat" role="img" aria-label="Attendance calendar">
      <div class="heat-rows">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => `<span>${d}</span>`).join('')}</div>
      ${weeks.map((w) => `<div class="heat-col">${[0, 1, 2, 3, 4].map((r) => { const d = cols[w][r];
        return d ? `<i class="h-${d.status}" title="${d.date}: ${d.status}"></i>` : '<i class="h-none"></i>'; }).join('')}</div>`).join('')}
    </div>`;
  }

  window.RC_CHARTS = { line, bars, ring, heat, esc };
})();
