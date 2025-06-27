import React from "react";
import "./Performance.css";           
import { useTranslation } from "react-i18next";   
/* Helper to show “25 004 K TND” or “876 %” */
const fmt = (v, unit = "", k = false) => {
  if (v == null) return "--";
  const n = +v;
  const shown = k
  ? Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n / 1000) + " K"
  : n.toLocaleString("fr-FR");
  return `${shown} ${unit}`.trim();
};

/* ↓ values coming straight from your Redux `summary` object */
export default function PerformanceBlock({ s, currency, pdf = false }) {
  const { t } = useTranslation();                

  return (
    
<section className={`pb-root${pdf ? " pb-pdf" : ""}`}>

      {/* ── TOTAL EXPOSURE ─────────────────────────────── */}
      <div className="pb-head">
        <span>{t('pb_totalExposure')}
        </span>
        <span className="pb-meta">{t('pb_tradedMtd')}
        </span>
      </div>
      <div className="pb-row">
        <span className="pb-label">TND</span>
        <span className="pb-value">{fmt(s.total_traded_tnd, "TND", true)}</span>
        <span className="pb-value pb-right">{fmt(s.total_traded_mtd_tnd, "TND", true)}</span>
        <span className="pb-label">{currency}</span>
        <span className="pb-value">{fmt(s.total_traded_fx, currency, true)}</span>
        <span className="pb-value pb-right">{fmt(s.total_traded_mtd_fx, currency, true)}</span>
      </div>

      {/* ── divider line ─────────────────────────────── */}

      {/* ── TOTAL SAVINGS ─────────────────────────────── */}
      <div className="pb-head">
        <span>{t('pb_totalSavings')}
        </span>
        <span className="pb-meta">{t('pb_savedMtd')}
        </span>
      </div>
      <div className="pb-row">
        <span className="pb-label">TND</span>
        <span className="pb-value" title={s.economies_totales_tnd + " TND"}>
  {fmt(s.economies_totales_tnd, "TND", true)}
</span>
        <span className="pb-value pb-right">{fmt(s.net_gain_tnd_mtd, "TND", true)}</span>
      </div>


      {/* ── ROI / COMMISSIONS ─────────────────────────── */}
      <div className="pb-head">{t('pb_roiTitle')}
      </div>
      <div className="pb-subhead">
        <span>Commissions</span>
        <span>{t('pb_netGain')}
        </span>
        <span className="pb-right">ROI **</span>
      </div>
      <div className="pb-row roi">
        <span className="pb-value">{fmt(s.total_commissions_tnd, "TND", true)}</span>
        <span className="pb-value">{fmt(s.net_gain_tnd, "TND", true)}</span>
        <span className="pb-value pb-right">{fmt(s.roi_percent, "%")}</span>
      </div>
      { s.has_forward_or_option && (
  <>
    {/* ── TOTAL COVERED (Only if forwards/options exist) ──────────────── */}
    {/* <div className="pb-head">
      <span>Total Couvert</span>
      <span className="pb-meta">Couvert MTD</span>
    </div>
    <div className="pb-row">
      <span className="pb-label">{currency}</span>
      <span className="pb-value">{fmt(s.total_covered_fx, currency, true)}</span>
      <span className="pb-value pb-right">{fmt(s.total_covered_mtd_fx, currency, true)}</span>
    </div> */}

    {/* ── ECONOMIES SUR COUVERTURE ───────────────────────────────────── */}
    {/* <div className="pb-head">
      <span>Économies en $**</span>
      <span className="pb-meta">Économies Totales sur Couverture*</span>
    </div>
    <div className="pb-row">
      <span className="pb-label">USD</span>
      <span className="pb-value">{fmt(s.economies_totales_couverture_fx, "USD", true)}</span>
      <span className="pb-value pb-right">{fmt(s.economies_totales_couverture_tnd, "TND", true)}</span>
    </div> */}
  </>
)}

    </section>
  );
}
