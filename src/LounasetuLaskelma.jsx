import { useState, useMemo } from "react";

const BRAND = "#0D263F";
const HSL_BLUE = "#007AC9";
const ACCENT = "#2E7D6B";
const WARM = "#F5F1EC";
const RED_SOFT = "#C4584A";

// Ravintoedun verotusarvo 2026: 8,80 €/ateria, kun työnantajan kustannus 8,80–14,00 € (alv mukaan luettuna).
// Lähde: Verohallinnon päätös 2026.
const TAX_VALUE_PER_DAY = 8.80;

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
// Lounaita kuukaudessa — verotus kohdistuu vain todellisiin käyttökertoihin,
// ei automaattisesti jokaiselle työpäivälle. Range kattaa kaikki realistiset
// käyttötasot: kerran viikossa (n. 4) → lähes joka työpäivä (23).
const LUNCHES_MIN = 1;
const LUNCHES_MAX = 23;
// Käytännössä lounasetu kertyy vain työkuukausina; vuosiloman aikana ei kertymää.
// Oletus 11 kk vastaa noin 5 viikon vuosilomaa. Käyttäjä voi säätää.
const ACTIVE_MONTHS_DEFAULT = 11;

function fmt(n) {
  return n.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AnimBar({ value, max, color, label, delay = 0 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", fontSize: 11,
        color: "rgba(13,38,63,0.55)", marginBottom: 3, fontWeight: 500,
      }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color }}>{fmt(value)} €</span>
      </div>
      <div style={{
        height: 22, borderRadius: 6,
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

export default function LounasetuLaskelma() {
  const [lunches, setLunches] = useState(18);
  const [salaryIdx, setSalaryIdx] = useState(2);
  const [employees, setEmployees] = useState(30);
  const [activeMonths, setActiveMonths] = useState(ACTIVE_MONTHS_DEFAULT);

  const salary = SALARY_EXAMPLES[salaryIdx];

  const handleEmployeeInput = (raw) => {
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    const clamped = Math.max(EMPLOYEES_MIN, Math.min(EMPLOYEES_MAX, Math.round(num)));
    setEmployees(clamped);
  };

  const calc = useMemo(() => {
    // Verotehokas malli: työnantaja kustantaa täsmälleen ravintoedun verotusarvon
    // → ei sivukuluja työnantajalle, ei verotettavaa etua työntekijälle.
    // Etu lasketaan käytettyjen lounaiden mukaan, ei automaattisesti jokaiselle työpäivälle.
    const monthlyBenefit = TAX_VALUE_PER_DAY * lunches;
    const yearlyBenefit = monthlyBenefit * activeMonths;

    // Vertailu palkankorotukseen (sama euromäärä bruttopalkkana)
    const employerCostSalary = monthlyBenefit * (1 + SIVUKULUT_RATE);
    const employeeNetSalary = monthlyBenefit * (1 - salary.marginalTax);

    // Lounasetuna (verovapaa, ei sivukuluja)
    const employerCostBenefit = monthlyBenefit;
    const employeeNetBenefit = monthlyBenefit;

    const employerSavingsMonth = employerCostSalary - employerCostBenefit;
    const employerSavingsYear = employerSavingsMonth * activeMonths;
    const employeeGainMonth = employeeNetBenefit - employeeNetSalary;
    const employeeGainYear = employeeGainMonth * activeMonths;

    const totalEmployerSavingsYear = employerSavingsYear * employees;
    const totalCostBenefitYear = employerCostBenefit * activeMonths * employees;
    const totalCostSalaryYear = employerCostSalary * activeMonths * employees;

    return {
      monthlyBenefit, yearlyBenefit,
      employerCostSalary, employeeNetSalary,
      employerCostBenefit, employeeNetBenefit,
      employerSavingsMonth, employerSavingsYear,
      employeeGainMonth, employeeGainYear,
      totalEmployerSavingsYear, totalCostBenefitYear, totalCostSalaryYear,
    };
  }, [lunches, salary, employees, activeMonths]);

  const maxBar = Math.max(calc.employerCostSalary, calc.monthlyBenefit);

  return (
    <div style={{
      minHeight: "100vh", background: WARM,
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND} 0%, #1a3a5c 100%)`,
        color: "#fff", padding: "32px 20px 26px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30,
          width: 140, height: 140, borderRadius: "50%",
          background: "rgba(46,125,107,0.18)",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)", marginBottom: 6,
          }}>
            Verologia
          </div>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 26, fontWeight: 400, margin: 0, lineHeight: 1.25,
            color: "#fff",
          }}>
            Palkankorotus vai lounasetu?
          </h1>
          <p style={{
            fontSize: 14, color: "rgba(255,255,255,0.7)",
            margin: "8px 0 0", lineHeight: 1.5,
          }}>
            Vertailu: sama euromäärä bruttopalkassa vs. ravintoetuna (lounaskortti)
          </p>
        </div>
      </div>

      <div style={{ padding: "16px 16px 100px" }}>

        {/* Lunches per month selector */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 10,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: 1.2, color: "rgba(13,38,63,0.5)",
            }}>
              Lounaita kuukaudessa: {lunches}
            </div>
            <div style={{ fontSize: 12, color: "rgba(13,38,63,0.5)" }}>
              {fmt(TAX_VALUE_PER_DAY)} € / lounas
            </div>
          </div>
          <input
            type="range"
            min={LUNCHES_MIN}
            max={LUNCHES_MAX}
            value={lunches}
            onChange={(e) => setLunches(Number(e.target.value))}
            style={{ width: "100%", accentColor: ACCENT }}
          />
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 10, color: "rgba(13,38,63,0.3)",
          }}>
            <span>1</span><span>6</span><span>12</span><span>18</span><span>23</span>
          </div>
          <div style={{
            fontSize: 11, color: "rgba(13,38,63,0.45)", marginTop: 4,
          }}>
            Verotusarvo kohdistuu vain käytettyihin lounaisiin. Käyttämättä jäänyt saldo ei verota.
          </div>
        </div>

        {/* Active months selector */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: 1.2, color: "rgba(13,38,63,0.5)", marginBottom: 10,
          }}>
            Aktiiviset kuukaudet vuodessa: {activeMonths}
          </div>
          <input
            type="range"
            min={9}
            max={12}
            value={activeMonths}
            onChange={(e) => setActiveMonths(Number(e.target.value))}
            style={{ width: "100%", accentColor: ACCENT }}
          />
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 10, color: "rgba(13,38,63,0.3)",
          }}>
            <span>9</span><span>10</span><span>11</span><span>12</span>
          </div>
          <div style={{
            fontSize: 11, color: "rgba(13,38,63,0.45)", marginTop: 4,
          }}>
            Esim. 11 kk vastaa ~5 viikon vuosilomaa
          </div>
        </div>

        {/* Salary selector */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: 1.2, color: "rgba(13,38,63,0.5)", marginBottom: 10,
          }}>
            Työntekijän palkkataso (marginaalivero {Math.round(salary.marginalTax * 100)} %)
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {SALARY_EXAMPLES.map((s, i) => (
              <button key={s.gross} onClick={() => setSalaryIdx(i)} style={{
                padding: "8px 10px", fontSize: 12, fontWeight: 500,
                border: `1.5px solid ${i === salaryIdx ? ACCENT : "rgba(13,38,63,0.1)"}`,
                borderRadius: 8,
                background: i === salaryIdx ? ACCENT : "#fff",
                color: i === salaryIdx ? "#fff" : BRAND,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
              }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employee count */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 10,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: 1.2, color: "rgba(13,38,63,0.5)",
            }}>
              Henkilöstön määrä
            </div>
            <input
              type="number"
              min={EMPLOYEES_MIN}
              max={EMPLOYEES_MAX}
              value={employees}
              onChange={(e) => handleEmployeeInput(e.target.value)}
              style={{
                width: 90, padding: "6px 10px",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                color: BRAND, background: "#fff",
                border: `1.5px solid rgba(13,38,63,0.15)`,
                borderRadius: 8, textAlign: "right",
                outline: "none",
              }}
            />
          </div>
          <input
            type="range"
            min={EMPLOYEES_MIN}
            max={EMPLOYEES_MAX}
            value={employees}
            onChange={(e) => setEmployees(Number(e.target.value))}
            style={{ width: "100%", accentColor: ACCENT }}
          />
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 10, color: "rgba(13,38,63,0.3)",
          }}>
            <span>1</span><span>250</span><span>500</span><span>750</span><span>1000</span>
          </div>
        </div>

        {/* Comparison cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
          marginBottom: 16,
        }}>
          {/* Salary card */}
          <div style={{
            background: "#fff", borderRadius: 14, padding: 16,
            border: `1px solid rgba(196,88,74,0.2)`,
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: 1.5, color: RED_SOFT, marginBottom: 12,
            }}>
              Palkankorotus
            </div>
            <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
              Työnantaja maksaa /kk
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 24, color: RED_SOFT, marginBottom: 12,
            }}>
              {fmt(calc.employerCostSalary)} €
            </div>
            <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
              Työntekijä saa käteen /kk
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 24, color: BRAND,
            }}>
              {fmt(calc.employeeNetSalary)} €
            </div>
          </div>

          {/* Benefit card */}
          <div style={{
            background: "#fff", borderRadius: 14, padding: 16,
            border: `2px solid ${ACCENT}`,
            boxShadow: "0 4px 20px rgba(46,125,107,0.1)",
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: 1.5, color: ACCENT, marginBottom: 12,
            }}>
              Lounasetu ✓
            </div>
            <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
              Työnantaja maksaa /kk
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 24, color: ACCENT, marginBottom: 12,
            }}>
              {fmt(calc.employerCostBenefit)} €
            </div>
            <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
              Työntekijä saa käteen /kk
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 24, color: BRAND,
            }}>
              {fmt(calc.employeeNetBenefit)} €
            </div>
          </div>
        </div>

        {/* Visual comparison bars */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: 16,
          border: "1px solid rgba(13,38,63,0.08)",
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 1.2, color: "rgba(13,38,63,0.5)", marginBottom: 12,
          }}>
            Työnantajan kustannus / kuukausi
          </div>
          <AnimBar value={calc.employerCostSalary} max={maxBar} color={RED_SOFT} label="Palkankorotus (brutto + sivukulut 20,5 %)" delay={0.1} />
          <AnimBar value={calc.employerCostBenefit} max={maxBar} color={ACCENT} label="Lounasetu (ei sivukuluja)" delay={0.2} />

          <div style={{
            marginTop: 14, fontSize: 13, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 1.2, color: "rgba(13,38,63,0.5)", marginBottom: 12,
          }}>
            Työntekijän nettohyöty / kuukausi
          </div>
          <AnimBar value={calc.employeeNetSalary} max={calc.monthlyBenefit} color={RED_SOFT} label={`Palkankorotus (marginaalivero ${Math.round(salary.marginalTax * 100)} %)`} delay={0.3} />
          <AnimBar value={calc.employeeNetBenefit} max={calc.monthlyBenefit} color={ACCENT} label="Lounasetu (veroton)" delay={0.4} />
        </div>

        {/* Key insight */}
        <div style={{
          background: `linear-gradient(135deg, ${BRAND} 0%, #1a3a5c 100%)`,
          borderRadius: 14, padding: 20, color: "#fff",
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 2, color: "rgba(255,255,255,0.5)", marginBottom: 14,
          }}>
            Yhteenveto
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                Työnantaja säästää /kk
              </div>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22, color: "#7FDBBA",
              }}>
                {fmt(calc.employerSavingsMonth)} €
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                Työntekijä hyötyy /kk
              </div>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22, color: "#7FDBBA",
              }}>
                +{fmt(calc.employeeGainMonth)} €
              </div>
            </div>
          </div>

          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 14,
            fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6,
          }}>
            {fmt(calc.monthlyBenefit)} € lounasetuna tuottaa työntekijälle <strong style={{ color: "#7FDBBA" }}>
            {fmt(calc.employeeGainMonth)} € enemmän</strong> kuussa kuin sama summa palkankorotuksena.
            Samalla työnantaja <strong style={{ color: "#7FDBBA" }}>säästää {fmt(calc.employerSavingsMonth)} €</strong> sivukuluissa.
          </div>
        </div>

        {/* Scale card */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: 16,
          border: "1px solid rgba(13,38,63,0.08)",
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 1.5, color: "rgba(13,38,63,0.5)", marginBottom: 14,
          }}>
            Skaalattu: {employees} työntekijää / vuosi
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{
              background: "rgba(196,88,74,0.06)", borderRadius: 10, padding: 14,
            }}>
              <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
                Palkankorotus yhteensä
              </div>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 18, color: RED_SOFT,
              }}>
                {fmt(calc.totalCostSalaryYear)} €
              </div>
            </div>
            <div style={{
              background: "rgba(46,125,107,0.06)", borderRadius: 10, padding: 14,
            }}>
              <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
                Lounasetu yhteensä
              </div>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 18, color: ACCENT,
              }}>
                {fmt(calc.totalCostBenefitYear)} €
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 14, textAlign: "center",
            padding: "12px", borderRadius: 10,
            background: "rgba(46,125,107,0.08)",
          }}>
            <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
              Työnantajan kokonaissäästö vuodessa
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 26, color: ACCENT, fontWeight: 400,
            }}>
              {fmt(calc.totalEmployerSavingsYear)} €
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div style={{
          fontSize: 10, color: "rgba(13,38,63,0.35)", lineHeight: 1.6,
          padding: "0 4px",
        }}>
          Laskelma perustuu vuoden 2026 ravintoedun verotusarvoon 8,80 €/ateria, työnantajan sivukuluihin 20,5 % (TyEL, sairausvakuutus, työttömyysvakuutus, tapaturmavakuutus, ryhmähenkivakuutus) ja viitteellisiin marginaaliveroasteisiin. Laskelmassa oletetaan verotehokas malli: työnantaja kustantaa täsmälleen verotusarvon (8,80 €/lounas), jolloin etu on työntekijälle veroton ja työnantajalle vapaa sivukuluista. Verotus kohdistuu vain todellisiin käyttökertoihin, ei automaattisesti jokaiselle työpäivälle — käyttämättä jäänyt saldo ei aiheuta veroa. Jos työnantaja kustantaa enemmän kuin 8,80 €/lounas, ylittävä osa on verotettavaa palkkaa eikä laskelma sellaisenaan päde. Verotusarvo pätee kun lounaan välittömät kustannukset arvonlisäveroineen ovat 8,80–14,00 € (Verohallinnon päätös 2026). Todelliset verovaikutukset riippuvat yksilön tilanteesta.
          <br /><br />
          Verologia.fi — Työsuhde-etujen koulutus yrityksille
        </div>
      </div>
    </div>
  );
}
