/* ============================================================
   BERANDA — HP: panel tugas · Desktop: dasbor (F-02)
   ============================================================ */
'use strict';

function todoList(V) {
  // yang perlu dikerjakan: belum diambil, urut tenggat; yang siap diambil di belakang
  return V.active.slice().sort((a, b) => (a.ready - b.ready) || (a.tenggat < b.tenggat ? -1 : a.tenggat > b.tenggat ? 1 : 0));
}
function orderCard(o, opt) {
  opt = opt || {};
  return '<a class="order-card edge-' + o.dl.tone + '" href="#/pesanan/' + o.id + '">' +
    '<div class="row-between" style="align-items:flex-start"><div class="grow"><div class="row"><span class="nm ellipsis">' + esc(o.cust.nama) + '</span><span class="small faint nowrap">#' + esc(String(o.no_nota).split(/[\/\-]/).pop()) + '</span></div>' +
    '<div class="sub ellipsis">' + esc(o.summary || '-') + ' (' + fmt.num(o.pcs) + ' pcs)</div></div>' + UI.dl(o) + '</div>' +
    '<div class="meta">' + UI.stage(o.tahap, o.batal) + UI.pay(o.status_bayar) +
    '<span class="sisa ' + (o.sisa > 0 ? 'danger' : 'success') + '">' + (o.sisa > 0 ? 'Sisa ' + fmt.rp(o.sisa) : 'Lunas') + '</span></div>' +
    (opt.extra || '') + '</a>';
}
function onTimeStats(V) {
  const done = V.live.filter(o => o.finishedAt);
  const ok = done.filter(o => o.finishedAt <= o.tenggat).length;
  return { total: done.length, ok, pct: done.length ? Math.round(ok / done.length * 100) : null };
}
function gaugeSvg(pct) {
  const p = pct == null ? 0 : pct, r = 70, c = Math.PI * r, off = c * (1 - p / 100);
  const col = p >= 85 ? '#10B981' : p >= 65 ? '#F59E0B' : '#EF4444';
  return '<svg viewBox="0 0 180 104" width="200" height="116" role="img" aria-label="Tepat waktu ' + (pct == null ? 'belum ada data' : p + ' persen') + '">' +
    '<path d="M20 94 A70 70 0 0 1 160 94" fill="none" stroke="#E7EAF0" stroke-width="14" stroke-linecap="round"/>' +
    '<path d="M20 94 A70 70 0 0 1 160 94" fill="none" stroke="' + col + '" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '"/>' +
    '<text x="90" y="80" text-anchor="middle" font-size="30" font-weight="800" fill="#0E1838" font-family="inherit">' + (pct == null ? '–' : p + '%') + '</text></svg>';
}
/** Minimal pesanan selesai sebelum persentase tepat waktu ditampilkan (1 dari 1 = 100% menyesatkan). */
const ONTIME_MIN = 5;
/** Beban tenggat: pcs yang harus selesai per hari, 7 hari ke depan + yang sudah lewat. */
function deadlineLoad(V) {
  const t = today(), work = V.active.filter(o => !o.ready);
  const cols = [{ lbl: 'Lewat', sub: 'tenggat', tone: 'late', hit: o => o.days < 0 }];
  for (let i = 0; i < 7; i++) {
    const d = addDays(t, i);
    cols.push({ lbl: i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : HARI[fmt.parseDate(d).getUTCDay()].slice(0, 3), sub: fmt.dateShort(d),
      tone: i === 0 ? 'today' : i <= 3 ? 'soon' : 'ok', hit: o => o.days === i });
  }
  cols.forEach(c => { const os = work.filter(c.hit); c.n = os.length; c.pcs = os.reduce((a, o) => a + o.pcs, 0); });
  const max = Math.max(1, ...cols.map(c => c.pcs));
  const week = cols.slice(1), wN = week.reduce((a, c) => a + c.n, 0), wPcs = week.reduce((a, c) => a + c.pcs, 0);
  const later = work.filter(o => o.days >= 7).length;
  return '<div class="card"><div class="card-head" style="align-items:flex-start"><div><h3>Tenggat 7 hari ke depan</h3><div class="small muted mt8">' +
      (wN ? '<b class="num" style="color:var(--tx)">' + fmt.num(wPcs) + ' pcs</b> dari ' + wN + ' pesanan harus selesai minggu ini' : 'Tidak ada tenggat minggu ini') +
      (cols[0].n ? ' · <b class="danger">' + cols[0].n + ' lewat tenggat</b>' : '') + '</div></div><a class="small semi nowrap" href="#/produksi">Papan →</a></div>' +
    '<div class="card-body"><div class="dl-chart" role="img" aria-label="Jumlah pcs per tenggat, 7 hari ke depan">' +
      cols.map(c => '<div class="dl-col ' + c.tone + (c.pcs ? '' : ' zero') + '"><span class="v num">' + (c.pcs ? fmt.num(c.pcs) : '–') + '</span>' +
        '<div class="track"><i style="height:' + (c.pcs ? Math.max(6, Math.round(c.pcs / max * 100)) : 0) + '%"></i></div>' +
        '<b>' + c.lbl + '</b><small>' + (c.n ? c.n + ' psn' : c.sub) + '</small></div>').join('') +
    '</div>' + (later ? '<div class="small muted mt12">+ ' + later + ' pesanan dengan tenggat lebih dari seminggu lagi</div>' : '') + '</div></div>';
}

registerPage('beranda', {
  title: 'Beranda',
  render(el) {
    if (needData(el)) return;
    const V = Data.view(), me = Session.me || {}, owner = Session.owner, t = today();
    const unpaidSum = V.unpaid.reduce((a, o) => a + o.sisa, 0);
    const nearDue = V.unpaid.filter(o => !o.done).map(o => o.days).sort((a, b) => a - b)[0];
    const ready = V.active.filter(o => o.ready);
    const nearDeadline = V.active.filter(o => !o.ready && o.days <= 3).length;
    const ym = t.slice(0, 7), prevYm = addDays(ym + '-01', -1).slice(0, 7);
    const inMonth = V.payments.filter(p => p.tgl.slice(0, 7) === ym).reduce((a, p) => a + p.jumlah, 0);
    // dibandingkan dengan periode yang sama bulan lalu (tgl 1 s.d. hari ini), bukan sebulan penuh
    const prevEnd = prevYm + '-' + t.slice(8, 10);
    const inPrev = V.payments.filter(p => p.tgl.slice(0, 7) === prevYm && p.tgl <= prevEnd).reduce((a, p) => a + p.jumlah, 0);
    const trend = inPrev ? Math.round((inMonth - inPrev) / inPrev * 1000) / 10 : null;
    const todo = todoList(V);
    const stageCounts = V.stages.filter(s => s.kode !== 'diambil').map(s => { const os = V.active.filter(o => o.tahap === s.kode); return { s, n: os.length, pcs: os.reduce((a, o) => a + o.pcs, 0) }; });
    const ot = onTimeStats(V);
    const otShow = ot.total >= ONTIME_MIN;
    const trendHtml = (v, inv) => v == null ? '' : '<span class="trend ' + ((v >= 0) !== !!inv ? 'up' : 'down') + '">' + (v >= 0 ? '▲' : '▼') + ' ' + String(Math.abs(v)).replace('.', ',') + '%</span>';

    el.innerHTML =
      pageHead('Beranda', 'Pantau pesanan, tagihan, dan tahap produksi hari ini.',
        '<button class="btn btn-ghost" data-act="bayar">' + ic('wallet') + 'Terima Bayaran</button><a class="btn btn-primary" href="#/pesanan-baru">' + ic('plus') + 'Catat Pesanan</a>') +
      // ---- HP: sapaan + tombol besar
      '<div class="only-mob stack">' +
        '<div class="row-between"><span class="pill st-diterima">' + ic('calendar', 'ico-sm') + esc(fmt.dateLong(t)) + '</span></div>' +
        '<div><h1 class="h-hero">' + esc(greeting()) + ', ' + esc((me.nama || '').split(' ')[0]) + '</h1><p class="small muted">' + esc(V.settings.nama_usaha || '') + ' · ' + (owner ? 'Pemilik' : 'Admin') + '</p></div>' +
        '<div class="cta-grid"><a class="cta primary" href="#/pesanan-baru"><div class="row-between"><span class="ci">' + ic('plus') + '</span>' + ic('arrow-up-right', 'ico-sm') + '</div><div><b>Catat Pesanan</b><span>Buat pesanan baru</span></div></a>' +
        '<button class="cta" data-act="bayar"><div class="row-between" style="width:100%"><span class="ci">' + ic('wallet') + '</span>' + ic('arrow-up-right', 'ico-sm') + '</div><div><b>Terima Bayaran</b><span>Uang muka / pelunasan</span></div></button></div>' +
        '<a class="card card-pad" href="#/pesanan?f=belum" style="color:inherit"><div class="row-between"><span class="row small semi muted"><span class="icon-box sm red">' + ic('receipt', 'ico-sm') + '</span>Belum dibayar</span><span class="small semi" style="color:var(--pri)">Lihat tagihan →</span></div>' +
        '<div class="money-xl mt12">' + fmt.rp(unpaidSum) + '</div><div class="small muted mt8">dari ' + V.unpaid.length + ' pesanan' + (nearDue != null ? ' · tenggat terdekat ' + (nearDue < 0 ? 'sudah lewat ' + (-nearDue) + ' hari' : nearDue === 0 ? 'hari ini' : nearDue + ' hari lagi') : '') + '</div></a>' +
      '</div>' +
      // ---- Desktop: kartu angka
      '<div class="kpi-grid only-desk grid">' +
        '<a class="card kpi" href="#/pesanan?f=belum" style="color:inherit"><div class="top"><span class="lbl">Belum dibayar</span><span class="icon-box sm red">' + ic('receipt', 'ico-sm') + '</span></div><div class="val">' + fmt.rp(unpaidSum) + '</div><div class="foot">dari ' + V.unpaid.length + ' pesanan</div></a>' +
        '<a class="card kpi" href="#/pesanan" style="color:inherit"><div class="top"><span class="lbl">Pesanan aktif</span><span class="icon-box sm">' + ic('package-open', 'ico-sm') + '</span></div><div class="val">' + V.active.length + '</div><div class="foot ' + (nearDeadline ? 'warnc semi' : '') + '">' + nearDeadline + ' mendekati / lewat tenggat</div></a>' +
        '<a class="card kpi" href="' + (owner ? '#/keuangan?tab=masuk' : '#/pesanan') + '" style="color:inherit"><div class="top"><span class="lbl">Uang masuk ' + BULAN[+ym.slice(5) - 1] + '</span><span class="icon-box sm green">' + ic('trending-up', 'ico-sm') + '</span></div><div class="val">' + fmt.rp(inMonth) + '</div><div class="foot row">' + trendHtml(trend) + '<span>vs ' + fmt.rpShort(inPrev) + ' tgl 1–' + (+t.slice(8, 10)) + ' bln lalu</span></div></a>' +
        '<a class="card kpi" href="#/produksi?tahap=' + V.readyStage + '" style="color:inherit"><div class="top"><span class="lbl">Siap diambil</span><span class="icon-box sm green">' + ic('circle-check', 'ico-sm') + '</span></div><div class="val">' + ready.length + '</div><div class="foot">menunggu diambil pelanggan</div></a>' +
      '</div>' +
      // ---- peringatan
      '<div class="stack mt12">' +
        (ready.length ? '<a class="banner green" href="#/produksi?tahap=' + V.readyStage + '" style="color:inherit"><span class="icon-box sm green">' + ic('circle-check', 'ico-sm') + '</span><div class="grow"><b>' + ready.length + ' pesanan siap diambil</b><span>' + esc(ready.slice(0, 2).map(o => o.cust.nama).join(', ')) + (ready.length > 2 ? ', …' : '') + '</span></div><span class="btn btn-sm btn-ghost">Lihat</span></a>' : '') +
        (V.lowStock.length ? '<a class="banner amber" href="#/stok" style="color:inherit"><span class="icon-box sm amber">' + ic('triangle-alert', 'ico-sm') + '</span><div class="grow"><b>Stok bahan hampir habis</b><span class="ellipsis">' + esc(V.lowStock.map(b => b.nama + ' sisa ' + fmt.dec(b.stok) + ' ' + b.satuan).join(' · ')) + '</span></div><span class="btn btn-sm btn-ghost">Lihat</span></a>' : '') +
      '</div>' +
      // ---- grafik + tahap
      '<div class="dash-grid mt16"><div class="stack">' +
        deadlineLoad(V) +
        '<div class="card"><div class="card-head"><h3>Pesanan per tahap</h3><a class="small semi" href="#/produksi">' + V.active.length + ' aktif · Papan →</a></div><div class="card-body"><div class="stage-tiles">' +
          stageCounts.map(x => '<a class="stage-tile st-' + x.s.kode + '" href="#/produksi?tahap=' + x.s.kode + '"><span>' + esc(STAGE_SHORT[x.s.kode] || x.s.nama) + '</span><b>' + x.n + '</b><small>' + (x.pcs ? fmt.num(x.pcs) + ' pcs' : 'pesanan') + '</small></a>').join('') +
        '</div></div></div>' +
      '</div><div class="stack only-desk flex" style="flex-direction:column">' +
        '<div class="card"><div class="card-head"><h3>Selesai tepat waktu</h3></div><div class="card-body center">' + (otShow ? '<div class="gauge-wrap">' + gaugeSvg(ot.pct) + '</div><div class="small muted">' + ot.ok + ' dari ' + ot.total + ' pesanan selesai sebelum tenggat</div>' : '<div class="small muted" style="padding:12px 0">Angka muncul setelah ' + ONTIME_MIN + ' pesanan selesai.<br>Sekarang baru ' + ot.total + ' pesanan.</div>') + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>Stok bahan</h3><a class="small semi" href="#/stok">Semua →</a></div>' +
          (V.materials.length ? '<div class="list">' + V.materials.slice().sort((a, b) => (a.stok / (a.minimum || 1)) - (b.stok / (b.minimum || 1))).slice(0, 4).map(b => '<a class="li" href="#/stok"><div class="grow"><div class="semi ellipsis">' + esc(b.nama) + '</div><div class="small muted">min. ' + fmt.dec(b.minimum) + ' ' + esc(b.satuan) + '</div></div><span class="pill ' + (b.stok <= b.minimum ? 'pay-belum_bayar' : 'pay-lunas') + ' num">' + fmt.dec(b.stok) + ' ' + esc(b.satuan) + '</span></a>').join('') + '</div>'
            : '<div class="card-body small muted">Belum ada data bahan.</div>') + '</div>' +
      '</div></div>' +
      // ---- yang perlu dikerjakan
      '<div class="section-title"><h2>Yang perlu dikerjakan <span class="badge blue">' + todo.length + '</span></h2><a class="small semi" href="#/pesanan">Semua →</a></div>' +
      (todo.length ? '<div class="only-mob">' + todo.slice(0, 6).map(o => orderCard(o)).join('') + (todo.length > 6 ? '<a class="btn btn-ghost btn-block mt12" href="#/pesanan">Lihat ' + (todo.length - 6) + ' pesanan lainnya</a>' : '') + '</div>' +
        '<div class="card only-desk block"><div class="table-wrap"><table class="table"><thead><tr><th>No. nota</th><th>Pelanggan</th><th class="r">Pcs</th><th>Tahap</th><th>Status bayar</th><th class="r">Sisa tagihan</th><th>Tenggat</th></tr></thead><tbody>' +
        todo.slice(0, 10).map(o => '<tr data-href="#/pesanan/' + o.id + '"><td class="semi nowrap ' + (o.dl.tone === 'late' ? 'late' : '') + '">' + esc(o.no_nota) + '</td><td><div class="semi">' + esc(o.cust.nama) + '</div><div class="small muted ellipsis" style="max-width:260px">' + esc(o.summary) + '</div></td><td class="r num">' + fmt.num(o.pcs) + '</td><td>' + UI.stage(o.tahap) + '</td><td>' + UI.pay(o.status_bayar) + '</td><td class="r num semi ' + (o.sisa > 0 ? 'danger' : 'success') + '">' + fmt.rp(o.sisa) + '</td><td>' + UI.dl(o) + '</td></tr>').join('') +
        '</tbody></table></div></div>'
        : '<div class="card">' + UI.empty('party-popper', 'Tidak ada pekerjaan tertunda', 'Semua pesanan sudah selesai. Catat pesanan baru untuk memulai.', '<a class="btn btn-primary mt16" href="#/pesanan-baru">' + ic('plus') + 'Catat Pesanan</a>') + '</div>') +
      // ---- HP: tepat waktu
      (otShow ? '<a class="banner only-mob mt16" href="#/laporan" style="background:var(--soft-blue);border-color:var(--pri-tint);color:inherit"><span class="icon-box sm">' + ic('award', 'ico-sm') + '</span><div class="grow"><b>Tepat waktu ' + ot.pct + '%</b><span>' + ot.ok + ' dari ' + ot.total + ' pesanan selesai sebelum tenggat</span></div></a>' : '') +
      '<div style="height:8px"></div>';
    el.onclick = e => {
      const a = e.target.closest('[data-act]');
      if (a && a.dataset.act === 'bayar') { e.preventDefault(); openPayment(); return; }
      const tr = e.target.closest('tr[data-href]'); if (tr) location.hash = tr.dataset.href;
    };
  }
});
