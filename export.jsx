/* export.jsx — ヒアリングシートのHTML出力 */

const YESNO = (v) => (v === "yes" ? "はい" : v === "no" ? "いいえ" : "—");
const DAY_JP = { mon: "月", tue: "火", wed: "水", thu: "木", fri: "金", sat: "土", sun: "日" };

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function row(label, value, copyable = true) {
  const empty = value === "" || value == null || value === "—";
  const val = empty ? "—" : value;
  return `<tr class="${empty ? "empty" : ""}">
    <th>${esc(label)}</th>
    <td><span class="val">${esc(val)}</span></td>
    <td class="act">${empty || !copyable ? "" : `<button class="cp" data-copy="${esc(val)}" title="コピー">${COPY_SVG}</button>`}</td>
  </tr>`;
}

const COPY_SVG = `<svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7V4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5v7a1.5 1.5 0 0 1-1.5 1.5H13M3.5 7h7A1.5 1.5 0 0 1 12 8.5v7A1.5 1.5 0 0 1 10.5 17h-7A1.5 1.5 0 0 1 2 15.5v-7A1.5 1.5 0 0 1 3.5 7Z"/></svg>`;

function generateSheetHTML(d) {
  const title = d.storeName ? `${d.storeName} 様` : "予約システム ヒアリングシート";

  const basic = [
    row("店舗名", d.storeName),
    row("LINE Developer 権限確認", YESNO(d.developer), false),
    row("Google アカウント名", d.googleAccount),
    row("Google パスワード", d.googlePassword),
    row("共有URL", d.shareUrl),
  ].join("");

  const formCfg = [
    row("お名前入力欄", YESNO(d.fieldName), false),
    row("電話番号入力欄", YESNO(d.fieldTel), false),
    row("メニューの複数選択", YESNO(d.menuMultiple), false),
    row("オプションの複数選択", YESNO(d.optionMultiple), false),
  ].join("");

  const hoursRows = DAYS.map(([k, label]) => {
    const h = d.hours[k];
    const disp = h.closed ? "定休日" : (h.start && h.end ? `${h.start} 〜 ${h.end}` : "—");
    return `<div class="bh ${h.closed ? "cl" : ""}"><b>${label}</b><span>${esc(disp)}</span></div>`;
  }).join("");

  const hours = `
    <table class="kv"><tbody>${row("祝日営業", YESNO(d.holiday), false)}</tbody></table>
    <div class="bh-grid">${hoursRows}</div>
    ${d.multipleTimeNote ? `<table class="kv"><tbody>${row("営業時間の備考", d.multipleTimeNote)}</tbody></table>` : ""}`;

  const rules = [
    row("予約間隔", d.interval ? d.interval + "分" : "—"),
    row("1コマの最大予約数", d.frameMax ? d.frameMax + "件" : "—"),
    row("1ユーザーの最大予約数", d.userMax ? d.userMax + "件" : "—"),
    row("予約受付開始", d.reserveStart),
    row("予約最終受付", d.reserveLast),
    row("最終受付の超過", YESNO(d.reserveLastOver), false),
  ].join("");

  const cats = (d.categories || []).filter((c) => c.name || c.menus.length || c.options.length);
  const catsHTML = cats.length === 0 ? `<p class="muted">登録されたカテゴリーはありません。</p>` :
    cats.map((c, i) => {
      const mk = (items) => items.filter((x) => x.name).map((x) =>
        `<li><span>${esc(x.name)}</span>${x.time ? `<em>${esc(x.time)}分</em>` : ""}</li>`).join("") || `<li class="none">—</li>`;
      return `<div class="cat">
        <div class="cat-h"><span class="b">${i + 1}</span>${esc(c.name || "（名称未設定）")}</div>
        <div class="cat-c">
          <div><h5>メニュー項目</h5><ul>${mk(c.menus)}</ul></div>
          <div><h5>オプション項目</h5><ul>${mk(c.options)}</ul></div>
        </div>
      </div>`;
    }).join("");

  const note = d.note ? `<div class="note">${esc(d.note).replace(/\n/g, "<br>")}</div>` : `<p class="muted">特記事項なし</p>`;

  const stamp = new Date().toLocaleString("ja-JP", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} ｜ ヒアリングシート</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@600&display=swap" rel="stylesheet">
<style>
:root{--ink:oklch(0.28 0.022 255);--muted:oklch(0.56 0.014 255);--faint:oklch(0.7 0.012 255);
--border:oklch(0.918 0.008 250);--accent:oklch(0.55 0.12 248);--accent-soft:oklch(0.955 0.028 248);
--accent-ink:oklch(0.42 0.12 248);--surface:#fff;--bg:oklch(0.985 0.004 240);--warn:oklch(0.52 0.14 25);--ok:oklch(0.58 0.1 200);}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:"Noto Sans JP",system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.65;padding:32px 18px 80px;-webkit-font-smoothing:antialiased;}
.sheet{max-width:840px;margin:0 auto;}
.head{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:30px 34px;margin-bottom:18px;box-shadow:0 1px 2px rgba(20,30,50,.05);}
.head .eyebrow{font-size:11px;letter-spacing:.16em;color:var(--accent-ink);font-weight:700;}
.head h1{font-family:"Noto Serif JP",serif;font-size:27px;font-weight:600;margin:6px 0 4px;}
.head .stamp{font-size:12px;color:var(--faint);}
.sec{background:var(--surface);border:1px solid var(--border);border-radius:16px;margin-bottom:16px;overflow:hidden;box-shadow:0 1px 2px rgba(20,30,50,.05);}
.sec>h2{display:flex;align-items:center;gap:11px;font-size:15px;font-weight:700;padding:16px 24px;border-bottom:1px solid var(--border);background:linear-gradient(180deg,#fff,oklch(0.978 0.005 240));}
.sec>h2 .n{width:26px;height:26px;border-radius:8px;background:var(--accent-soft);color:var(--accent-ink);display:grid;place-items:center;font-size:13px;border:1px solid oklch(0.86 0.06 248);}
.sec .pad{padding:18px 24px;}
table.kv{width:100%;border-collapse:collapse;}
table.kv th{text-align:left;font-size:13px;font-weight:600;color:var(--muted);width:230px;vertical-align:top;padding:9px 16px 9px 24px;border-bottom:1px solid oklch(0.95 0.005 250);}
table.kv td{padding:9px 16px;border-bottom:1px solid oklch(0.95 0.005 250);vertical-align:top;}
table.kv tr:last-child th,table.kv tr:last-child td{border-bottom:none;}
table.kv .val{font-size:14.5px;font-weight:500;word-break:break-word;}
table.kv tr.empty .val{color:var(--faint);font-weight:400;}
table.kv td.act{width:44px;text-align:right;padding-right:24px;}
.cp{border:1px solid var(--border);background:#fff;color:var(--muted);width:30px;height:30px;border-radius:7px;display:grid;place-items:center;cursor:pointer;transition:all .14s;}
.cp:hover{background:var(--accent-soft);border-color:oklch(0.86 0.06 248);color:var(--accent-ink);}
.bh-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;padding:18px 24px;}
.bh{border:1px solid var(--border);border-radius:9px;padding:10px 6px;text-align:center;}
.bh b{display:block;font-size:14px;margin-bottom:5px;}
.bh span{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums;}
.bh.cl{background:oklch(0.965 0.02 25);border-color:oklch(0.88 0.07 25);}
.bh.cl span{color:var(--warn);font-weight:600;}
.cat{border:1px solid var(--border);border-radius:12px;margin:14px 24px;overflow:hidden;}
.cat:first-child{margin-top:18px;}.cat:last-child{margin-bottom:18px;}
.cat-h{display:flex;align-items:center;gap:10px;padding:12px 16px;font-weight:700;font-size:15px;background:oklch(0.978 0.005 240);border-bottom:1px solid var(--border);}
.cat-h .b{width:24px;height:24px;border-radius:7px;background:var(--accent);color:#fff;display:grid;place-items:center;font-size:12px;}
.cat-c{display:grid;grid-template-columns:1fr 1fr;}
.cat-c>div{padding:14px 16px;}
.cat-c>div+div{border-left:1px solid var(--border);}
.cat-c h5{font-size:11px;color:var(--muted);letter-spacing:.04em;margin-bottom:9px;text-transform:none;}
.cat-c ul{list-style:none;}
.cat-c li{display:flex;justify-content:space-between;gap:10px;padding:7px 10px;border:1px solid var(--border);border-radius:7px;font-size:13.5px;margin-bottom:6px;background:#fff;}
.cat-c li.none{color:var(--faint);border-style:dashed;justify-content:center;}
.cat-c li em{font-style:normal;color:var(--muted);font-size:12px;font-variant-numeric:tabular-nums;}
.note{padding:16px 24px;font-size:14px;white-space:pre-wrap;}
.muted{padding:16px 24px;color:var(--faint);font-size:13.5px;}
.foot{text-align:center;color:var(--faint);font-size:11.5px;margin-top:24px;}
.toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:11px 20px;border-radius:99px;font-size:13px;font-weight:600;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(-4px);}
@media print{body{background:#fff;padding:0;}.cp{display:none;}.sec,.head{box-shadow:none;break-inside:avoid;}}
@media(max-width:640px){.bh-grid{grid-template-columns:repeat(4,1fr);}.cat-c{grid-template-columns:1fr;}.cat-c>div+div{border-left:none;border-top:1px solid var(--border);}table.kv th{width:140px;padding-left:16px;}}
</style></head><body>
<div class="sheet">
  <div class="head">
    <div class="eyebrow">予約システム ヒアリングシート</div>
    <h1>${esc(title)}</h1>
    <div class="stamp">作成日時：${esc(stamp)}</div>
  </div>
  <div class="sec"><h2><span class="n">1</span>基本情報</h2><div class="pad" style="padding:0"><table class="kv"><tbody>${basic}</tbody></table></div></div>
  <div class="sec"><h2><span class="n">2</span>予約フォームの設定</h2><div class="pad" style="padding:0"><table class="kv"><tbody>${formCfg}</tbody></table></div></div>
  <div class="sec"><h2><span class="n">3</span>営業時間・定休日</h2>${hours}</div>
  <div class="sec"><h2><span class="n">4</span>予約の受付ルール</h2><div class="pad" style="padding:0"><table class="kv"><tbody>${rules}</tbody></table></div></div>
  <div class="sec"><h2><span class="n">5</span>カテゴリー・メニュー</h2>${catsHTML}</div>
  <div class="sec"><h2><span class="n">6</span>備考・その他</h2>${note}</div>
  <div class="foot">中江式ヒアリング ／ 予約システム導入ヒアリングシート</div>
</div>
<div class="toast" id="t">コピーしました</div>
<script>
document.addEventListener('click',function(e){
  var b=e.target.closest('.cp'); if(!b)return;
  var txt=b.getAttribute('data-copy');
  var done=function(){var t=document.getElementById('t');t.classList.add('show');setTimeout(function(){t.classList.remove('show')},1400);};
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(txt).then(done).catch(fb);}else{fb();}
  function fb(){var a=document.createElement('textarea');a.value=txt;a.style.position='fixed';a.style.left='-9999px';document.body.appendChild(a);a.select();try{document.execCommand('copy');done();}catch(_){}document.body.removeChild(a);}
});
</script>
</body></html>`;
}

function downloadSheet(d) {
  const html = generateSheetHTML(d);
  const name = (d.storeName ? d.storeName + "_" : "") + "ヒアリングシート.html";
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.style.display = "none";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

Object.assign(window, { generateSheetHTML, downloadSheet, esc });
