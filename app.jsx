/* app.jsx — メインアプリ */

const DRAFT_KEY = "hearingDraft_v3";
const SHEETS_KEY = "hearingSheets_v3";

const emptyHours = () => {
  const h = {};
  DAYS.forEach(([k]) => { h[k] = { start: "", end: "", closed: false }; });
  return h;
};

const initialState = () => ({
  storeName: "", developer: "", googleAccount: "", googlePassword: "", shareUrl: "",
  fieldName: "", fieldTel: "", menuMultiple: "", optionMultiple: "",
  holiday: "", hours: emptyHours(), multipleTimeNote: "",
  interval: "", frameMax: "", userMax: "",
  reserveStart: "", reserveLast: "", reserveLastOver: "", note: "",
  categories: [makeCategory()],
});

const NAV = [
  { id: "sec-basic", label: "基本情報" },
  { id: "sec-form", label: "予約フォーム設定" },
  { id: "sec-hours", label: "営業時間・定休日" },
  { id: "sec-rules", label: "予約の受付ルール" },
  { id: "sec-cats", label: "カテゴリー・メニュー" },
  { id: "sec-ref", label: "参考イメージ・備考" },
];

function computeDone(s) {
  return {
    "sec-basic": !!s.storeName.trim(),
    "sec-form": !!(s.fieldName && s.fieldTel && s.menuMultiple && s.optionMultiple),
    "sec-hours": DAYS.every(([k]) => s.hours[k].closed || (s.hours[k].start && s.hours[k].end)) &&
      DAYS.some(([k]) => !s.hours[k].closed && s.hours[k].start),
    "sec-rules": !!(s.interval && s.reserveStart && s.reserveLast),
    "sec-cats": s.categories.some((c) => c.name.trim()),
    "sec-ref": !!s.note.trim(),
  };
}

/* ====== Saved sheets dropdown ====== */
function SavedMenu({ onLoad, onToast }) {
  const [open, setOpen] = useState(false);
  const [sheets, setSheets] = useState({});
  const ref = useRef(null);

  const refresh = () => {
    try { setSheets(JSON.parse(localStorage.getItem(SHEETS_KEY) || "{}")); }
    catch (_) { setSheets({}); }
  };
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const names = Object.keys(sheets).sort((a, b) => (sheets[b].updatedAt || 0) - (sheets[a].updatedAt || 0));

  const del = (e, name) => {
    e.stopPropagation();
    const next = { ...sheets }; delete next[name];
    localStorage.setItem(SHEETS_KEY, JSON.stringify(next));
    setSheets(next);
    onToast("削除しました");
  };

  return (
    <div className="dd" ref={ref}>
      <button className="btn" onClick={() => { if (!open) refresh(); setOpen(!open); }}>
        <Icon name="folder" className="ic" />保存済み
      </button>
      {open && (
        <div className="dd-menu">
          {names.length === 0 ? (
            <div className="dd-empty">保存されたシートはまだありません</div>
          ) : (
            <React.Fragment>
              <div className="dd-head">保存済みシート（{names.length}）</div>
              {names.map((name) => (
                <div className="dd-item" key={name}
                  onClick={() => { onLoad(sheets[name].data); setOpen(false); }}>
                  <Icon name="folder" className="ic" style={{ width: 15, height: 15, color: "var(--faint)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="dd-item-name">{name}</div>
                    <div className="dd-item-meta">{new Date(sheets[name].updatedAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <button className="dd-del" onClick={(e) => del(e, name)}><Icon name="trash" style={{ width: 14, height: 14 }} /></button>
                </div>
              ))}
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );
}

/* ====== Reference image with graceful fallback ====== */
function RefImage({ src, label }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="ref-ph">
        <span>{label}</span>
        <em>画像を表示できません</em>
      </div>
    );
  }
  return <img loading="lazy" alt={label} src={src} onError={() => setErr(true)} />;
}

/* ====== Confirm dialog ====== */
function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, danger, icon, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);
  if (!open) return null;
  return (
    <div className="confirm-back" onMouseDown={onCancel}>
      <div className="confirm" onMouseDown={(e) => e.stopPropagation()}>
        <div className="confirm-body">
          <div className={"confirm-ic" + (danger ? " danger" : "")}>
            <Icon name={icon || (danger ? "alert" : "save")} style={{ width: 21, height: 21 }} />
          </div>
          <div className="confirm-text">
            <h3>{title}</h3>
            <p>{message}</p>
          </div>
        </div>
        <div className="confirm-foot">
          <button className="btn btn-ghost" onClick={onCancel}>{cancelLabel || "キャンセル"}</button>
          <button className={"btn " + (danger ? "btn-danger" : "btn-primary")} onClick={onConfirm}>{confirmLabel || "OK"}</button>
        </div>
      </div>
    </div>
  );
}

/* ====== Preview modal ====== */
function PreviewModal({ html, onClose, onDownload }) {
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);
  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <Icon name="eye" className="ic" style={{ color: "var(--accent-ink)" }} />
          <h3>ヒアリングシート プレビュー</h3>
          <button className="btn btn-primary" onClick={onDownload}><Icon name="download" className="ic" />HTMLで保存</button>
          <button className="btn btn-ghost" onClick={onClose}>閉じる</button>
        </div>
        <div className="modal-body">
          <iframe className="modal-iframe" srcDoc={html} title="preview" />
        </div>
      </div>
    </div>
  );
}

/* ====== App ====== */
function App() {
  const [s, setS] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return { ...initialState(), ...JSON.parse(saved) };
    } catch (_) {}
    return initialState();
  });
  const [savedAt, setSavedAt] = useState(null);
  const [active, setActive] = useState("sec-basic");
  const [toasts, setToasts] = useState([]);
  const [refOpen, setRefOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const first = useRef(true);

  const set = (key, val) => setS((p) => ({ ...p, [key]: val }));

  const toast = (msg) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  };

  /* autosave draft */
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(s)); setSavedAt(Date.now()); } catch (_) {}
    }, 500);
    return () => clearTimeout(t);
  }, [s]);

  /* active section on scroll */
  useEffect(() => {
    const onScroll = () => {
      const offset = 120;
      let cur = NAV[0].id;
      for (const n of NAV) {
        const el = document.getElementById(n.id);
        if (el && el.getBoundingClientRect().top <= offset) cur = n.id;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const done = computeDone(s);
  const doneCount = NAV.filter((n) => done[n.id]).length;

  const saveNamed = () => {
    const name = s.storeName.trim();
    if (!name) { toast("店舗名を入力してから保存してください"); return; }
    let sheets = {};
    try { sheets = JSON.parse(localStorage.getItem(SHEETS_KEY) || "{}"); } catch (_) { sheets = {}; }
    const exists = !!sheets[name];
    const write = () => {
      const next = { ...sheets, [name]: { data: s, updatedAt: Date.now() } };
      try {
        localStorage.setItem(SHEETS_KEY, JSON.stringify(next));
        toast(exists ? `「${name}」を上書き保存しました` : `「${name}」を保存しました`);
      } catch (err) {
        toast("保存に失敗しました（容量超過の可能性）");
      }
    };
    if (exists) {
      setConfirm({
        title: "上書き保存しますか？",
        message: `同じ名前のシート「${name}」がすでにあります。現在の内容で上書き保存します。`,
        confirmLabel: "上書き保存", icon: "save",
        onConfirm: () => { write(); setConfirm(null); },
      });
    } else {
      write();
    }
  };

  const resetAll = () => {
    setConfirm({
      title: "入力内容をリセットしますか？",
      message: "現在フォームに入力中の内容がすべて消去され、空の状態に戻ります。保存済みのシートは消えません。この操作は取り消せません。",
      confirmLabel: "リセットする", danger: true, icon: "reset",
      onConfirm: () => {
        const fresh = initialState();
        setS(fresh);
        try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
        setSavedAt(null);
        setConfirm(null);
        toast("入力内容をリセットしました");
        window.scrollTo({ top: 0 });
      },
    });
  };

  const loadSheet = (data) => {
    setS({ ...initialState(), ...data });
    toast("シートを読み込みました");
    window.scrollTo({ top: 0 });
  };

  const openPreview = () => setPreview(generateSheetHTML(s));

  return (
    <div className="app">
      {/* topbar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">中</div>
          <div className="brand-text">
            <span className="brand-title">予約システム ヒアリング</span>
            <span className="brand-sub">NAKAE HEARING SHEET</span>
          </div>
        </div>
        <div className="store-field">
          <label>店舗名</label>
          <input value={s.storeName} placeholder="例：サロン・ド・ナカエ"
            onChange={(e) => set("storeName", e.target.value)} />
        </div>
        <div className="topbar-actions">
          <div className="save-status">
            <span className={"save-dot" + (savedAt ? "" : " saving")} />
            <span>{savedAt ? `自動保存済み ${new Date(savedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}` : "自動保存"}</span>
          </div>
          <SavedMenu onLoad={loadSheet} onToast={toast} />
          <button className="btn" onClick={resetAll}><Icon name="reset" className="ic" />リセット</button>
          <button className="btn" onClick={saveNamed}><Icon name="save" className="ic" />保存</button>
          <button className="btn" onClick={openPreview}><Icon name="eye" className="ic" />プレビュー</button>
          <button className="btn btn-primary" onClick={() => downloadSheet(s)}><Icon name="download" className="ic" />HTML出力</button>
        </div>
      </header>

      <div className="layout">
        {/* nav */}
        <nav className="nav">
          <div className="nav-progress">
            <div className="nav-progress-label"><span>入力の進捗</span><span className="nav-progress-num">{doneCount} / {NAV.length}</span></div>
            <div className="nav-bar"><span style={{ width: `${(doneCount / NAV.length) * 100}%` }} /></div>
          </div>
          <ul className="nav-list">
            {NAV.map((n, i) => (
              <li key={n.id}>
                <a className={"nav-link" + (active === n.id ? " active" : "")} href={`#${n.id}`}>
                  <span className={"nav-tick" + (done[n.id] ? " done" : "")}>
                    {done[n.id] ? <Icon name="check" style={{ width: 12, height: 12 }} /> : i + 1}
                  </span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* content */}
        <main className="content">
          <div className="intro">
            <h1>予約システム ヒアリングシート</h1>
            <p>導入時のヒアリング内容を入力してください。入力は<b>自動保存</b>され、完了後は「HTML出力」で共有用シートを作成できます。時間はプルダウン選択式なので入力ミスが起きません。</p>
          </div>

          <Section id="sec-basic" num="1" title="基本情報" desc="アカウント・連携の確認">
            <div className="grid-2">
              <Field label="店舗名"><TextField value={s.storeName} onChange={(v) => set("storeName", v)} placeholder="店舗名を入力" /></Field>
              <Field label="LINE Developer の権限確認"><YesNo value={s.developer} onChange={(v) => set("developer", v)} /></Field>
              <Field label="Google アカウント名"><TextField value={s.googleAccount} onChange={(v) => set("googleAccount", v)} placeholder="example@gmail.com" /></Field>
              <Field label="Google アカウントのパスワード"><TextField value={s.googlePassword} onChange={(v) => set("googlePassword", v)} placeholder="パスワード" /></Field>
              <Field label="共有URL" span><TextField value={s.shareUrl} onChange={(v) => set("shareUrl", v)} placeholder="https://" /></Field>
            </div>
          </Section>

          <Section id="sec-form" num="2" title="予約フォームの設定" desc="お客様が入力する項目の有無">
            <div className="grid-2">
              <Field label="お名前の入力欄を設定する"><YesNo value={s.fieldName} onChange={(v) => set("fieldName", v)} /></Field>
              <Field label="電話番号の入力欄を設定する"><YesNo value={s.fieldTel} onChange={(v) => set("fieldTel", v)} /></Field>
              <Field label="メニューを複数選択できるようにする"><YesNo value={s.menuMultiple} onChange={(v) => set("menuMultiple", v)} /></Field>
              <Field label="オプションを複数選択できるようにする"><YesNo value={s.optionMultiple} onChange={(v) => set("optionMultiple", v)} /></Field>
            </div>
          </Section>

          <Section id="sec-hours" num="3" title="営業時間・定休日" desc="一括設定で素早く入力できます">
            <div className="grid-2" style={{ marginBottom: 22 }}>
              <Field label="祝日も営業する"><YesNo value={s.holiday} onChange={(v) => set("holiday", v)} /></Field>
            </div>
            <BusinessHours hours={s.hours} setHours={(h) => set("hours", h)} />
            <div style={{ marginTop: 18 }}>
              <Field label="営業時間が複数ある場合の備考" optional hint="例：12:00〜13:00は休憩のため受付停止 など">
                <TextField value={s.multipleTimeNote} onChange={(v) => set("multipleTimeNote", v)} placeholder="中抜け時間などがあれば入力" />
              </Field>
            </div>
          </Section>

          <Section id="sec-rules" num="4" title="予約の受付ルール" desc="予約枠と受付時間の設定">
            <div className="grid-2">
              <Field label="予約間隔">
                <select className="select" value={s.interval} onChange={(e) => set("interval", e.target.value)}>
                  <option value="">選択してください</option>
                  {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m}分</option>)}
                </select>
              </Field>
              <div />
              <Field label="1コマの最大予約数"><NumberField value={s.frameMax} onChange={(v) => set("frameMax", v)} placeholder="1" suffix="件" /></Field>
              <Field label="1ユーザーの最大予約数"><NumberField value={s.userMax} onChange={(v) => set("userMax", v)} placeholder="1" suffix="件" /></Field>
              <Field label="予約受付の開始" hint="例：予約日の30日前 / 毎朝9:00 など">
                <TextField value={s.reserveStart} onChange={(v) => set("reserveStart", v)} placeholder="受付開始のタイミング" />
              </Field>
              <Field label="予約の最終受付" hint="例：前日18:00 / 開始1時間前 など">
                <TextField value={s.reserveLast} onChange={(v) => set("reserveLast", v)} placeholder="最終受付のタイミング" />
              </Field>
              <Field label="最終受付時間を超過しての予約を許可する" span><YesNo value={s.reserveLastOver} onChange={(v) => set("reserveLastOver", v)} /></Field>
            </div>
          </Section>

          <Section id="sec-cats" num="5" title="カテゴリー・メニュー" desc="メニュー項目とオプション項目を登録">
            <Categories categories={s.categories} setCategories={(c) => set("categories", c)} />
          </Section>

          <Section id="sec-ref" num="6" title="参考イメージ・備考" desc="予約フォームの完成イメージとその他の連絡事項">
            <Field label="備考・その他の設定" optional>
              <TextArea value={s.note} onChange={(v) => set("note", v)} placeholder="その他の設定や連絡事項を記入してください..." />
            </Field>
            <div style={{ marginTop: 18 }}>
              <button type="button" className={"ref-toggle" + (refOpen ? " open" : "")} onClick={() => setRefOpen(!refOpen)}>
                <Icon name="eye" className="ic" style={{ color: "var(--accent-ink)" }} />
                リッチメニューの予約フォーム完成イメージを{refOpen ? "閉じる" : "見る"}
                <Icon name="chevron" className="ic chev" />
              </button>
              {refOpen && (
                <div className="ref-grid">
                  <RefImage label="予約フォーム イメージ 1" src="https://www.dropbox.com/scl/fi/a3hyjyfcypkd1apa0jqpf/2025-06-16-17.32.40.png?rlkey=rpcmsxdajmy1y2mypcbg3hhfw&raw=1" />
                  <RefImage label="予約フォーム イメージ 2" src="https://www.dropbox.com/scl/fi/dexuzjkce1yt89xa0z632/2025-06-16-17.33.08.png?rlkey=8a01k705vxy8abbe5swqsjp9p&raw=1" />
                  <RefImage label="予約フォーム イメージ 3" src="https://www.dropbox.com/scl/fi/dd8v5l3s30awac0p73aeh/2025-06-16-17.33.34.png?rlkey=qbtx2xyvl1v6kd0w8lwylxvpz&raw=1" />
                </div>
              )}
            </div>
          </Section>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 6 }}>
            <button className="btn" onClick={openPreview}><Icon name="eye" className="ic" />プレビュー</button>
            <button className="btn btn-primary" onClick={() => downloadSheet(s)}><Icon name="download" className="ic" />ヒアリングシートをHTML出力</button>
          </div>
        </main>
      </div>

      {/* toasts */}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div className="toast" key={t.id}><span className="tdot" />{t.msg}</div>
        ))}
      </div>

      {preview && (
        <PreviewModal html={preview} onClose={() => setPreview(null)}
          onDownload={() => { downloadSheet(s); setPreview(null); }} />
      )}

      <ConfirmDialog open={!!confirm} {...(confirm || {})}
        onCancel={() => setConfirm(null)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
