/* ui.jsx — 再利用コンポーネント群 */
const { useState, useEffect, useRef } = React;

/* ---- icons ---- */
function Icon({ name, className, style }) {
  const paths = {
    plus: "M10 4v12M4 10h12",
    trash: "M3 5h14M8 5V3.5A1.5 1.5 0 0 1 9.5 2h1A1.5 1.5 0 0 1 12 3.5V5m2 0v10a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 6 15V5",
    copy: "M7 7V4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5v7a1.5 1.5 0 0 1-1.5 1.5H13M3.5 7h7A1.5 1.5 0 0 1 12 8.5v7A1.5 1.5 0 0 1 10.5 17h-7A1.5 1.5 0 0 1 2 15.5v-7A1.5 1.5 0 0 1 3.5 7Z",
    download: "M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15.5h12",
    eye: "M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Zm8 2.2A2.2 2.2 0 1 0 10 7.8a2.2 2.2 0 0 0 0 4.4Z",
    chevron: "M5 7.5 10 12.5 15 7.5",
    save: "M4 3h9l3 3v11H4V3Zm3 0v5h6V3M7 17v-5h6v5",
    spark: "M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.6L10 2.5Z",
    check: "M4 10.5 8 14.5 16 5.5",
    clock: "M10 5v5l3.2 1.8M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
    folder: "M3 5.5A1.5 1.5 0 0 1 4.5 4h3l1.5 2h6.5A1.5 1.5 0 0 1 17 7.5v7A1.5 1.5 0 0 1 15.5 16h-11A1.5 1.5 0 0 1 3 14.5v-9Z",
    alert: "M10 7v4m0 3h.01M10 2.5 18 16.5H2L10 2.5Z",
    reset: "M3.5 9a6.5 6.5 0 1 1 1.2 4.7M3.5 5v4h4",
  };
  return (
    <svg className={className}
      style={{ width: 16, height: 16, flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}
      viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

/* ---- field wrapper ---- */
function Field({ label, hint, optional, children, span }) {
  return (
    <div className={"field" + (span ? " col-span" : "")}>
      {label && (
        <div className="field-label">
          {label}
          {optional && <span className="field-opt">任意</span>}
        </div>
      )}
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

/* ---- text input ---- */
function TextField({ value, onChange, placeholder, type = "text" }) {
  return (
    <input className="input" type={type} value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} />
  );
}

function NumberField({ value, onChange, placeholder, suffix }) {
  return (
    <div className="input-suffix input-num">
      <input className="input" type="number" min="0" value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
      {suffix && <span className="suffix">{suffix}</span>}
    </div>
  );
}

function TextArea({ value, onChange, placeholder }) {
  return (
    <textarea className="textarea" value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} />
  );
}

/* ---- segmented yes / no ---- */
function Segmented({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.value} type="button"
          className={(value === o.value ? "on" : "") + (o.value === "no" ? " no" : "")}
          onClick={() => onChange(value === o.value ? "" : o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
function YesNo({ value, onChange }) {
  return <Segmented value={value} onChange={onChange}
    options={[{ value: "yes", label: "はい" }, { value: "no", label: "いいえ" }]} />;
}

/* ---- time picker (hour + minute selects — no invalid input possible) ---- */
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function TimePicker({ value, onChange, disabled }) {
  const [h, m] = (value || ":").split(":");
  const set = (nh, nm) => {
    if (!nh && !nm) { onChange(""); return; }
    onChange(`${nh || "00"}:${nm || "00"}`);
  };
  return (
    <div className={"timepick" + (disabled ? " dim" : "")}>
      <select className="time-sel" value={h || ""} disabled={disabled}
        onChange={(e) => set(e.target.value, m)}>
        <option value="">--</option>
        {HOURS.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <span className="time-colon">:</span>
      <select className="time-sel" value={m || ""} disabled={disabled}
        onChange={(e) => set(h, e.target.value)}>
        <option value="">--</option>
        {MINUTES.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
    </div>
  );
}

/* ---- section card ---- */
function Section({ id, num, title, desc, children }) {
  return (
    <section className="card" id={id}>
      <div className="card-head">
        <div className="card-num">{num}</div>
        <div className="card-head-text">
          <h2>{title}</h2>
          {desc && <p>{desc}</p>}
        </div>
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

Object.assign(window, {
  Icon, Field, TextField, NumberField, TextArea,
  Segmented, YesNo, TimePicker, Section,
  HOURS, MINUTES,
});
