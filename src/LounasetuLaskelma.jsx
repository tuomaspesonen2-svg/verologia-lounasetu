import { useState, useMemo } from "react";

/* Verologia-laskuri – sivuston design-järjestelmä
   Fontit: Bricolage Grotesque (otsikot/numerot) + Inter (leipä)
   Värit vastaavat verologia.fi:n :root-muuttujia. */
const NAVY = "#0D263F";
const NAVY_2 = "#0A1E33";
const ACCENT = "#3C72AB";       // sivuston sininen aksentti
const ACCENT_SOFT = "#DCE6F1";  // soft blue
const GREEN = "#1F8A5B";        // säästö / positiivinen
const GREEN_SOFT = "#7FDBBA";   // säästö tummalla taustalla
const GREEN_PANEL = "#E3F2EA";  // vaalea vihreä paneeli
const RED = "#C4584A";          // lisäkustannus / epäedullinen
const SAND = "#F3F2EC";
const INK = "#14202E";
const MUTED = "#5A6675";
const LINE = "#E4E0D6";
const WHITE = "#FFFFFF";

const HEAD = "'Bricolage Grotesque', system-ui, sans-serif";
const BODY = "'Inter', system-ui, sans-serif";
const SHADOW_SM = "0 10px 30px -16px rgba(28,40,30,.22)";

// Lounasetu (kohdennettu maksuväline / lounaskortti) 2026:
// Työntekijän omavastuu on 75 % aterian hinnasta, kuitenkin vähintään 8,80 €/ateria.
// Työnantajan VEROVAPAA osuus on loppuosa, enintään 25 % aterian hinnasta.
// Ravintoedulla maksettavan aterian enimmäishinta 2026: 14,00 €.
const EMPLOYEE_MIN_SHARE = 8.80;
const MEAL_PRICE_MIN = 8.80;
const MEAL_PRICE_MAX = 14.00;
const MEAL_PRICE_DEFAULT = 12.00;

const SALARY_EXAMPLES = [
{ label: "2 500 €/kk", gross: 2500, marginalTax: 0.30 },
{ label: "3 000 €/kk", gross: 3000, marginalTax: 0.35 },
{ label: "3 500 €/kk", gross: 3500, marginalTax: 0.40 },
{ label: "4 000 €/kk", gross: 4000, marginalTax: 0.43 },
{ label: "4 500 €/kk", gross: 4500, marginalTax: 0.45 },
{ label: "5 000 €/kk", gross: 5000, marginalTax: 0.47 },
];

const SIVUKULUT_RATE = 0.205;
const EMPLOYEES_MIN = 1;
const EMPLOYEES_MAX = 1000;
const LUNCHES_MIN = 1;
const LUNCHES_MAX = 23;
const ACTIVE_MONTHS_DEFAULT = 11;

function fmt(n) {
return n.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Eyebrow({ children, light = false }) {
return (
<div style={{
fontFamily: BODY, fontWeight: 700, fontSize: 12,
letterSpacing: ".15em", textTransform: "uppercase",
color: light ? "rgba(255,255,255,0.55)" : ACCENT,
}}>
{children}
</div>
);
}

function FieldLabel({ children, right }) {
return (
<div style={{
display: "flex", justifyContent: "space-between", alignItems: "baseline",
marginBottom: 10, gap: 12,
}}>
<div style={{
fontFamily: BODY, fontSize: 12, fontWeight: 700,
letterSpacing: ".12em", textTransform: "uppercase", color: MUTED,
}}>
{children}
</div>
{right}
</div>
);
}

function AnimBar({ value, max, color, label, delay = 0 }) {
const pct = Math.min((value / max) * 100, 100);
return (
<div style={{ marginBottom: 10 }}>
<div style={{
display: "flex", justifyContent: "space-between", fontSize: 12,
fontFamily: BODY, color: MUTED, marginBottom: 5, fontWeight: 500,
}}>
<span>{label}</span>
<span style={{ fontFamily: HEAD, fontWeight: 700, color }}>{fmt(value)} €</span>
</div>
<div style={{
height: 20, borderRadius: 6,
background: "rgba(13,38,63,0.06)", overflow: "hidden",
}}>
<div style={{
height: "100%", borderRadius: 6,
background: color, width: `${pct}%`,
transition: `width 0.8s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
}} />
</div>
</div>
);
}

const sliderCSS = `
.vl-range{ -webkit-appearance:none; appearance:none; width:100%; height:6px; border-radius:999px;
  background:${LINE}; outline:none; }
.vl-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:22px; height:22px;
  border-radius:50%; background:${ACCENT}; cursor:pointer; border:3px solid #fff;
  box-shadow:0 2px 6px rgba(13,38,63,.25); }
.vl-range::-moz-range-thumb{ width:22px; height:22px; border-radius:50%; background:${ACCENT};
  cursor:pointer; border:3px solid #fff; box-shadow:0 2px 6px rgba(13,38,63,.25); }

@media(max-width:600px){ div[style*="minmax(0"]{grid-template-columns:1fr !important} div[style*="minmax(0"]>div{text-align:center !important} }
`;

export default function LounasetuLaskelma() {
const [lunches, setLunches] = useState(18);
const [salaryIdx, setSalaryIdx] = useState(2);
const [employees, setEmployees] = useState(30);
const [activeMonths, setActiveMonths] = useState(ACTIVE_MONTHS_DEFAULT);
const [mealPrice, setMealPrice] = useState(MEAL_PRICE_DEFAULT);

const salary = SALARY_EXAMPLES[salaryIdx];

const handleEmployeeInput = (raw) => {
const num = Number(raw);
if (Number.isNaN(num)) return;
const clamped = Math.max(EMPLOYEES_MIN, Math.min(EMPLOYEES_MAX, Math.round(num)));
setEmployees(clamped);
};

const calc = useMemo(() => {
// Työntekijän omavastuu = 75 % aterian hinnasta, väh. 8,80 €.
const omavastuu = Math.max(0.75 * mealPrice, EMPLOYEE_MIN_SHARE);
// Työnantajan verovapaa osuus = aterian hinta − omavastuu (enintään 25 %).
const employerPerMeal = Math.max(0, mealPrice - omavastuu);

const monthlyBenefit = employerPerMeal * lunches;
const yearlyBenefit = monthlyBenefit * activeMonths;

const employerCostSalary = monthlyBenefit * (1 + SIVUKULUT_RATE);
const employeeNetSalary = monthlyBenefit * (1 - salary.marginalTax);

const employerCostBenefit = monthlyBenefit;
const employeeNetBenefit = monthlyBenefit;

const employerSavingsMonth = employerCostSalary - employerCostBenefit;
const employeeGainMonth = employeeNetBenefit - employeeNetSalary;

const totalEmployerSavingsYear = employerSavingsMonth * activeMonths * employees;
const totalCostBenefitYear = employerCostBenefit * activeMonths * employees;
const totalCostSalaryYear = employerCostSalary * activeMonths * employees;

return {
omavastuu, employerPerMeal,
monthlyBenefit, yearlyBenefit,
employerCostSalary, employeeNetSalary,
employerCostBenefit, employeeNetBenefit,
employerSavingsMonth, employeeGainMonth,
totalEmployerSavingsYear, totalCostBenefitYear, totalCostSalaryYear,
};
}, [lunches, salary, employees, activeMonths, mealPrice]);

const maxBar = Math.max(calc.employerCostSalary, calc.monthlyBenefit);

const card = {
background: WHITE, borderRadius: 12, padding: 18,
border: `1px solid ${LINE}`, boxShadow: SHADOW_SM,
};

return (
<div style={{ minHeight: "100vh", background: WHITE, fontFamily: BODY, color: INK }}>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>{sliderCSS}</style>

{/* Header */}
<div style={{
background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_2} 100%)`,
color: "#fff", padding: "34px 20px 28px",
position: "relative", overflow: "hidden",
}}>
<div style={{
position: "absolute", top: -40, right: -40,
width: 160, height: 160, borderRadius: "50%",
background: "rgba(60,114,171,0.22)",
}} />
<div style={{ position: "relative" }}>
<Eyebrow light>Verologia · Laskuri</Eyebrow>
<h1 style={{
fontFamily: HEAD, fontSize: 28, fontWeight: 800, margin: "10px 0 0",
lineHeight: 1.05, letterSpacing: "-.028em", color: "#fff",
}}>
Palkankorotus vai lounasetu?
</h1>
<p style={{
fontFamily: BODY, fontSize: 14.5, color: "rgba(255,255,255,0.72)",
margin: "10px auto 0", lineHeight: 1.55, maxWidth: 520,
}}>
Vertailu: työnantajan verovapaa osuus lounasetuna (lounaskortti) vs. sama summa bruttopalkkana.
</p>
</div>
</div>

<div style={{ padding: "20px 16px 100px", maxWidth: 720, margin: "0 auto" }}>

{/* Inputs */}
<div style={{ ...card, marginBottom: 16 }}>

{/* Meal price */}
<div style={{ marginBottom: 22 }}>
<FieldLabel right={
<span style={{ fontFamily: HEAD, fontSize: 14, fontWeight: 700, color: ACCENT }}>
Työnantajan osuus {fmt(calc.employerPerMeal)} € / lounas
</span>
}>
Aterian hinta: {fmt(mealPrice)} €
</FieldLabel>
<input className="vl-range" type="range"
min={MEAL_PRICE_MIN} max={MEAL_PRICE_MAX} step={0.10}
value={mealPrice} onChange={(e) => setMealPrice(Number(e.target.value))} />
<div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(13,38,63,0.4)", marginTop: 6 }}>
<span>8,80 €</span><span>11,00 €</span><span>14,00 €</span>
</div>
<div style={{ fontSize: 12, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>
Työntekijän omavastuu on 75 % aterian hinnasta, kuitenkin vähintään 8,80 € ({fmt(calc.omavastuu)} €). Työnantajan verovapaa osuus on loppuosa, enintään 25 %.
</div>
</div>

{/* Lunches */}
<div style={{ marginBottom: 22 }}>
<FieldLabel>Lounaita kuukaudessa: {lunches}</FieldLabel>
<input className="vl-range" type="range"
min={LUNCHES_MIN} max={LUNCHES_MAX}
value={lunches} onChange={(e) => setLunches(Number(e.target.value))} />
<div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(13,38,63,0.4)", marginTop: 6 }}>
<span>1</span><span>6</span><span>12</span><span>18</span><span>23</span>
</div>
<div style={{ fontSize: 12, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>
Ravintoetua voi käyttää kerran työssäolopäivää kohden. Verotusarvo kohdistuu vain käytettyihin lounaisiin.
</div>
</div>

{/* Active months */}
<div style={{ marginBottom: 22 }}>
<FieldLabel>Aktiiviset kuukaudet vuodessa: {activeMonths}</FieldLabel>
<input className="vl-range" type="range"
min={9} max={12}
value={activeMonths} onChange={(e) => setActiveMonths(Number(e.target.value))} />
<div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(13,38,63,0.4)", marginTop: 6 }}>
<span>9</span><span>10</span><span>11</span><span>12</span>
</div>
<div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
Esim. 11 kk vastaa ~5 viikon vuosilomaa.
</div>
</div>

{/* Salary */}
<div style={{ marginBottom: 22 }}>
<FieldLabel>Työntekijän palkkataso (marginaalivero {Math.round(salary.marginalTax * 100)} %)</FieldLabel>
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{SALARY_EXAMPLES.map((s, i) => (
<button key={s.gross} onClick={() => setSalaryIdx(i)} style={{
padding: "9px 13px", fontFamily: BODY, fontSize: 13, fontWeight: 600,
border: `1.5px solid ${i === salaryIdx ? ACCENT : LINE}`,
borderRadius: 999,
background: i === salaryIdx ? ACCENT : WHITE,
color: i === salaryIdx ? "#fff" : NAVY,
cursor: "pointer", transition: "all 0.18s",
}}>
{s.label}
</button>
))}
</div>
</div>

{/* Employees */}
<div>
<FieldLabel right={
<input type="number" min={EMPLOYEES_MIN} max={EMPLOYEES_MAX}
value={employees} onChange={(e) => handleEmployeeInput(e.target.value)}
style={{
width: 92, padding: "7px 10px", fontFamily: HEAD, fontSize: 15, fontWeight: 700,
color: NAVY, background: WHITE, border: `1.5px solid ${LINE}`,
borderRadius: 8, textAlign: "right", outline: "none",
}} />
}>
Henkilöstön määrä
</FieldLabel>
<input className="vl-range" type="range"
min={EMPLOYEES_MIN} max={EMPLOYEES_MAX}
value={employees} onChange={(e) => setEmployees(Number(e.target.value))} />
<div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(13,38,63,0.4)", marginTop: 6 }}>
<span>1</span><span>250</span><span>500</span><span>750</span><span>1000</span>
</div>
</div>
</div>

{/* Comparison cards */}
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, marginBottom: 16 }}>
{/* Salary card (neutral) */}
<div style={{ ...card, background: SAND, boxShadow: "none" }}>
<Eyebrow><span style={{ color: MUTED }}>Palkankorotus</span></Eyebrow>
<div style={{ fontSize: 12, color: MUTED, margin: "14px 0 4px" }}>Työnantaja maksaa /kk</div>
<div style={{ fontFamily: HEAD, fontSize: 26, fontWeight: 800, color: INK, letterSpacing: "-.02em" }}>
{fmt(calc.employerCostSalary)} €
</div>
<div style={{ fontSize: 12, color: MUTED, margin: "14px 0 4px" }}>Työntekijä saa käteen /kk</div>
<div style={{ fontFamily: HEAD, fontSize: 26, fontWeight: 800, color: NAVY, letterSpacing: "-.02em" }}>
{fmt(calc.employeeNetSalary)} €
</div>
</div>

{/* Benefit card (highlighted) */}
<div style={{
...card, border: `2px solid ${ACCENT}`,
boxShadow: "0 10px 30px -14px rgba(60,114,171,0.4)",
}}>
<Eyebrow>Lounasetu ✓</Eyebrow>
<div style={{ fontSize: 12, color: MUTED, margin: "14px 0 4px" }}>Työnantaja maksaa /kk</div>
<div style={{ fontFamily: HEAD, fontSize: 26, fontWeight: 800, color: ACCENT, letterSpacing: "-.02em" }}>
{fmt(calc.employerCostBenefit)} €
</div>
<div style={{ fontSize: 12, color: MUTED, margin: "14px 0 4px" }}>Työntekijä saa käteen /kk</div>
<div style={{ fontFamily: HEAD, fontSize: 26, fontWeight: 800, color: NAVY, letterSpacing: "-.02em" }}>
{fmt(calc.employeeNetBenefit)} €
</div>
</div>
</div>

{/* Bars */}
<div style={{ ...card, marginBottom: 16 }}>
<Eyebrow><span style={{ color: MUTED }}>Työnantajan kustannus / kuukausi</span></Eyebrow>
<div style={{ marginTop: 14 }}>
<AnimBar value={calc.employerCostSalary} max={maxBar} color={RED} label="Palkankorotus (brutto + sivukulut 20,5 %)" delay={0.1} />
<AnimBar value={calc.employerCostBenefit} max={maxBar} color={GREEN} label="Lounasetu (työnantajan osuus, ei sivukuluja)" delay={0.2} />
</div>
<div style={{ marginTop: 12 }}>
<Eyebrow><span style={{ color: MUTED }}>Työntekijän nettohyöty / kuukausi</span></Eyebrow>
</div>
<div style={{ marginTop: 14 }}>
<AnimBar value={calc.employeeNetSalary} max={calc.monthlyBenefit} color={RED} label={`Palkankorotus (marginaalivero ${Math.round(salary.marginalTax * 100)} %)`} delay={0.3} />
<AnimBar value={calc.employeeNetBenefit} max={calc.monthlyBenefit} color={GREEN} label="Lounasetu (veroton)" delay={0.4} />
</div>
</div>

{/* Summary (navy) */}
<div style={{
background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_2} 100%)`,
borderRadius: 12, padding: 22, color: "#fff", marginBottom: 16,
}}>
<Eyebrow light>Yhteenveto</Eyebrow>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, margin: "16px 0" }}>
<div>
<div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>Työnantaja säästää /kk</div>
<div style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 800, color: GREEN_SOFT, letterSpacing: "-.02em" }}>
{fmt(calc.employerSavingsMonth)} €
</div>
</div>
<div>
<div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>Työntekijä hyötyy /kk</div>
<div style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 800, color: GREEN_SOFT, letterSpacing: "-.02em" }}>
+{fmt(calc.employeeGainMonth)} €
</div>
</div>
</div>
<div style={{
borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 14,
fontSize: 13.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.6,
}}>
Työnantajan verovapaa osuus {fmt(calc.monthlyBenefit)} €/kk lounasetuna tuottaa työntekijälle <strong style={{ color: GREEN_SOFT }}>
{fmt(calc.employeeGainMonth)} € enemmän</strong> kuussa kuin sama summa palkankorotuksena.
Samalla työnantaja <strong style={{ color: GREEN_SOFT }}>säästää {fmt(calc.employerSavingsMonth)} €</strong> sivukuluissa.
</div>
</div>

{/* Scale */}
<div style={{ ...card, marginBottom: 16 }}>
<Eyebrow><span style={{ color: MUTED }}>Skaalattu: {employees} työntekijää / vuosi</span></Eyebrow>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, marginTop: 14 }}>
<div style={{ background: SAND, borderRadius: 10, padding: 14 }}>
<div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Palkankorotus yhteensä</div>
<div style={{ fontFamily: HEAD, fontSize: 19, fontWeight: 800, color: RED, letterSpacing: "-.02em" }}>
{fmt(calc.totalCostSalaryYear)} €
</div>
</div>
<div style={{ background: GREEN_PANEL, borderRadius: 10, padding: 14 }}>
<div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Lounasetu yhteensä</div>
<div style={{ fontFamily: HEAD, fontSize: 19, fontWeight: 800, color: GREEN, letterSpacing: "-.02em" }}>
{fmt(calc.totalCostBenefitYear)} €
</div>
</div>
</div>
<div style={{ marginTop: 14, textAlign: "center", padding: 14, borderRadius: 10, background: NAVY }}>
<div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Työnantajan kokonaissäästö vuodessa</div>
<div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: GREEN_SOFT, letterSpacing: "-.02em" }}>
{fmt(calc.totalEmployerSavingsYear)} €
</div>
</div>
</div>

{/* Footer note */}
<div style={{ fontSize: 11, color: MUTED, lineHeight: 1.65, padding: "0 4px" }}>
Laskelma perustuu lounasedun (kohdennettu maksuväline / lounaskortti) verotussääntöihin 2026. Työntekijän omavastuu aterian hinnasta on 75 %, kuitenkin vähintään 8,80 €/ateria; työnantajan verovapaa osuus on loppuosa, enintään 25 % aterian hinnasta. Ravintoedulla maksettavan aterian enimmäishinta on 14,00 €. Vertailussa työnantajan verovapaata osuutta verrataan vastaavan suuruiseen bruttopalkankorotukseen (sivukulut 20,5 %: TyEL, sairausvakuutus, työttömyysvakuutus, tapaturmavakuutus, ryhmähenkivakuutus) ja viitteellisiin marginaaliveroasteisiin. Työnantajan on täsmäytettävä ladatut saldot toteutuneiden työssäolopäivien mukaisiksi vähintään vuosittain. Marginaaliveroasteet ovat viitteellisiä, ja todelliset verovaikutukset riippuvat yksilön tilanteesta.
<br /><br />
<span style={{ fontFamily: HEAD, fontWeight: 700, color: NAVY }}>Verologia.fi</span> — Työsuhde-etujen koulutus yrityksille
</div>
</div>
</div>
);
}
