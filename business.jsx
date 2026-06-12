/* business.jsx — 営業時間 & カテゴリーエディタ */

const DAYS = [
  ["mon", "月", false], ["tue", "火", false], ["wed", "水", false],
  ["thu", "木", false], ["fri", "金", false],
  ["sat", "土", true], ["sun", "日", true],
];

/* ===== 営業時間 ===== */
function BusinessHours({ hours, setHours }) {
  const [qStart, setQStart] = useState("09:00");
  const [qEnd, setQEnd] = useState("18:00");

  const setDay = (key, patch) =>
    setHours({ ...hours, [key]: { ...hours[key], ...patch } });

  const applyTo = (keys) => {
    const next = { ...hours };
    keys.forEach((k) => {
      if (!next[k].closed) next[k] = { ...next[k], start: qStart, end: qEnd };
    });
    setHours(next);
  };

  return (
    <div>
      <div className="bh-quick">
        <span className="bh-quick-label">
          <Icon name="spark" className="ic" style={{ width: 15, height: 15 }} />
          一括設定
        </span>
        <TimePicker value={qStart} onChange={setQStart} />
        <span className="time-colon" style={{ color: "var(--accent-ink)" }}>〜</span>
        <TimePicker value={qEnd} onChange={setQEnd} />
        <span className="bh-quick-spacer" />
        <button type="button" className="bh-apply"
          onClick={() => applyTo(["mon", "tue", "wed", "thu", "fri"])}>平日に適用</button>
        <button type="button" className="bh-apply"
          onClick={() => applyTo(DAYS.map((d) => d[0]))}>全曜日に適用</button>
      </div>

      <div className="bh-list">
        {DAYS.map(([key, label, weekend]) => {
          const d = hours[key];
          return (
            <div key={key} className={"bh-row" + (d.closed ? " closed" : "") + (weekend ? " weekend" : "")}>
              <div className="bh-day">{label}</div>
              <div className="bh-times">
                {d.closed ? (
                  <span className="bh-closed-tag">定休日</span>
                ) : (
                  <React.Fragment>
                    <TimePicker value={d.start} onChange={(v) => setDay(key, { start: v })} />
                    <span className="time-colon">〜</span>
                    <TimePicker value={d.end} onChange={(v) => setDay(key, { end: v })} />
                  </React.Fragment>
                )}
              </div>
              <label className="bh-toggle">
                <input type="checkbox" checked={d.closed}
                  onChange={(e) => setDay(key, { closed: e.target.checked })} />
                <span className="switch" />
                定休
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== カテゴリー / メニュー / オプション ===== */
let __cid = 1;
const newId = () => "x" + (__cid++) + Date.now().toString(36).slice(-3);

function makeCategory() {
  return { id: newId(), name: "", menus: [], options: [] };
}

function ItemRows({ items, kind, onAdd, onChange, onRemove }) {
  const isMenu = kind === "menu";
  return (
    <div>
      <div className="cat-col-head">
        <span className={"dotmark " + (isMenu ? "dot-menu" : "dot-opt")} />
        {isMenu ? "メニュー項目" : "オプション項目"}
      </div>
      <div className="item-rows">
        {items.map((it) => (
          <div className="item-row" key={it.id}>
            <input type="text" value={it.name} placeholder={isMenu ? "メニュー名" : "オプション名"}
              onChange={(e) => onChange(it.id, { name: e.target.value })} />
            <div className="item-time">
              <input type="number" min="0" value={it.time ?? ""} placeholder="30"
                onChange={(e) => onChange(it.id, { time: e.target.value })} />
              <span className="unit">分</span>
            </div>
            <button type="button" className="icon-btn" title="削除"
              onClick={() => onRemove(it.id)}>
              <Icon name="trash" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="add-row" onClick={onAdd}>
        <Icon name="plus" className="ic" style={{ width: 14, height: 14 }} />
        {isMenu ? "メニューを追加" : "オプションを追加"}
      </button>
    </div>
  );
}

function Categories({ categories, setCategories }) {
  const update = (cid, patch) =>
    setCategories(categories.map((c) => (c.id === cid ? { ...c, ...patch } : c)));

  const addItem = (cid, kind) => {
    const c = categories.find((x) => x.id === cid);
    const list = [...c[kind === "menu" ? "menus" : "options"], { id: newId(), name: "", time: "" }];
    update(cid, kind === "menu" ? { menus: list } : { options: list });
  };
  const changeItem = (cid, kind, iid, patch) => {
    const c = categories.find((x) => x.id === cid);
    const field = kind === "menu" ? "menus" : "options";
    update(cid, { [field]: c[field].map((it) => (it.id === iid ? { ...it, ...patch } : it)) });
  };
  const removeItem = (cid, kind, iid) => {
    const c = categories.find((x) => x.id === cid);
    const field = kind === "menu" ? "menus" : "options";
    update(cid, { [field]: c[field].filter((it) => it.id !== iid) });
  };

  return (
    <div>
      <div className="cats">
        {categories.length === 0 && (
          <div className="cat-empty">カテゴリーがまだありません。下のボタンから追加してください。</div>
        )}
        {categories.map((c, i) => (
          <div className="cat" key={c.id}>
            <div className="cat-head">
              <div className="cat-badge">{i + 1}</div>
              <div className="cat-name">
                <input type="text" value={c.name} placeholder="カテゴリー名（例：カット、カラー）"
                  onChange={(e) => update(c.id, { name: e.target.value })} />
              </div>
              <button type="button" className="cat-del"
                onClick={() => setCategories(categories.filter((x) => x.id !== c.id))}>
                <Icon name="trash" className="ic" style={{ width: 14, height: 14 }} />
                削除
              </button>
            </div>
            <div className="cat-cols">
              <div className="cat-col">
                <ItemRows items={c.menus} kind="menu"
                  onAdd={() => addItem(c.id, "menu")}
                  onChange={(iid, p) => changeItem(c.id, "menu", iid, p)}
                  onRemove={(iid) => removeItem(c.id, "menu", iid)} />
              </div>
              <div className="cat-col">
                <ItemRows items={c.options} kind="option"
                  onAdd={() => addItem(c.id, "option")}
                  onChange={(iid, p) => changeItem(c.id, "option", iid, p)}
                  onRemove={(iid) => removeItem(c.id, "option", iid)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="add-row solid" style={{ marginTop: 16 }}
        onClick={() => setCategories([...categories, makeCategory()])}>
        <Icon name="plus" className="ic" style={{ width: 16, height: 16 }} />
        カテゴリーを追加
      </button>
    </div>
  );
}

Object.assign(window, { DAYS, BusinessHours, Categories, makeCategory, newId });
