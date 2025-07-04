// // File: src/jsx/pages/dashboard/ForwardTca.jsx
// ---------------------------------------------------------------
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import axiosInstance from "../../../services/AxiosInstance";
import "./TCATableForward.css";
import "./TCAReportPrint.css";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

// ─── HELPER FUNCTIONS ───
const sum = arr => arr.reduce((a, b) => a + b, 0);
const average = arr => (arr.length ? sum(arr) / arr.length : 0);

// ─────── CONFIG ───────
const API_FORWARD = "/tca/spot-forward";
const MATURITIES = [30, 90, 180, 270, 360];
const HORIZONS = MATURITIES;
const fmtTND = v =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v) + " TND";
const COLORS = {
  bar: ["#c6d9f1", "#8db3e2", "#548dd4", "#305496", "#17375e"],
  line: ["#2c3e50", "#e67e22", "#27ae60", "#9b59b6", "#3498db"],
};

const labelMonths = d => `${d / 30} mois`;

// ─────── COMPONENT ───────
export default function ForwardTca({ currency, clientIdOrName = null }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearToPlot, setYearToPlot] = useState("all");  // "all" or "2024", "2025", …

// ─── FETCH ───
 
useEffect(() => {
  setLoading(true);

  const params = {
    currency,                         
    ...(clientIdOrName && { client_id: clientIdOrName })
  };

  axiosInstance
    .get(API_FORWARD, { params })
    .then(r => setData(Array.isArray(r.data) ? r.data : []))
    .catch(console.error)
    .finally(() => setLoading(false));
}, [currency, clientIdOrName]);

  // ─── DATA TRANSFORMATIONS ───
  // 1. Monthly aggregated P&L by maturity (still used in stacked chart)
  const aggregatedData = useMemo(() => {
    const months = {};
    data.forEach(tx => {
      const month = dayjs(tx.transaction_date).format("MMM");
      if (!months[month]) months[month] = { month };

      tx.hedging_with_forward.details.forEach(d => {
        if (d.forward_rate > 0) {
          months[month][`${d.maturity_days}`] = (months[month][`${d.maturity_days}`] || 0) + d.pnl_tnd;
        }
      });
    });
    return Object.values(months);
  }, [data]);

  // 2. FX trend (execution vs forward curves)
  const monthlyTrend = useMemo(() => {
    const months = {};
    data.forEach(tx => {
      const month = dayjs(tx.transaction_date).format("MMM");
      if (!months[month]) {
        months[month] = {
          month,
          execution: [],
          ...Object.fromEntries(MATURITIES.map(m => [m, []])),
        };
      }
      months[month].execution.push(tx.execution_rate);
      tx.hedging_with_forward.details.forEach(d => {
        if (d.forward_rate > 0) months[month][d.maturity_days].push(d.forward_rate);
      });
    });
    return Object.values(months).map(m => ({
      month: m.month,
      execution: average(m.execution),
      ...Object.fromEntries(MATURITIES.map(h => [h, average(m[h])])),
    }));
  }, [data]);

  // 3. Annual P&L summary (min/max/avg/total) – kept for the big table
  const annualSummary = useMemo(() => {
    const years = {};
    data.forEach(tx => {
      const year = dayjs(tx.transaction_date).year();
      if (!years[year]) years[year] = { year, details: [] };
      years[year].details.push(...tx.hedging_with_forward.details);
    });
    return Object.values(years).map(y => ({
      year: y.year,
      ...MATURITIES.reduce((acc, m) => {
        const vals = y.details.filter(d => d.maturity_days === m).map(d => d.pnl_tnd);
        return {
          ...acc,
          [m]: {
            total: sum(vals),
            avg: average(vals),
            max: Math.max(...vals),
            min: Math.min(...vals),
          },
        };
      }, {}),
    }));
  }, [data]);

  // 4. P&L + traded + spread (%) per year & maturity (for the dual‑axis chart)
  const perYearSummary = useMemo(() => {
    const years = {};

    data.forEach(tx => {
      const yr = dayjs(tx.transaction_date).year();
      if (!years[yr]) years[yr] = {};

      const tradedTx = (tx.amount || 0) * (tx.execution_rate || 0); // TND traded in this tx

      tx.hedging_with_forward.details.forEach(d => {
        if (d.forward_rate > 0) {
          if (!years[yr][d.maturity_days]) years[yr][d.maturity_days] = { pnl: 0, traded: 0 };
          years[yr][d.maturity_days].pnl += d.pnl_tnd;
          years[yr][d.maturity_days].traded += tradedTx;
        }
      });
    });

    return Object.entries(years).map(([year, obj]) => {
      const record = { year: +year };
      MATURITIES.forEach(m => {
        const { pnl = 0, traded = 0 } = obj[m] || {};
        record[m] = {
          pnl,
          spread: traded ? (pnl / traded) * 100 : 0,
        };
      });
      return record;
    });
  }, [data]);

  // 5. Data for the bar + line chart (single selected year)
  const chartData = useMemo(() => {
    // -----  ALL YEARS  -----
    if (yearToPlot === "all") {
      // { 30: { pnl, traded }, 90: … }
      const agg = {};
  
      data.forEach(tx => {
        const tradedTx = (tx.amount || 0) * (tx.execution_rate || 0);
        tx.hedging_with_forward.details.forEach(d => {
          if (d.forward_rate > 0) {
            if (!agg[d.maturity_days]) agg[d.maturity_days] = { pnl: 0, traded: 0 };
            agg[d.maturity_days].pnl    += d.pnl_tnd;
            agg[d.maturity_days].traded += tradedTx;
          }
        });
      });
  
      return MATURITIES.map(m => {
        const { pnl = 0, traded = 0 } = agg[m] || {};
        return {
          label: labelMonths(m),
          pnl,
          spread: traded ? (pnl / traded) * 100 : 0,
        };
      });
    }
  
    // -----  SINGLE YEAR  -----
    const y = perYearSummary.find(obj => obj.year === +yearToPlot);
    if (!y) return [];
  
    return MATURITIES.map(m => ({
      label: labelMonths(m),
      pnl: y[m].pnl,
      spread: y[m].spread,
    }));
  }, [data, perYearSummary, yearToPlot]);
  
  // ———  Annual Spread summary  ———
  const annualSpreadSummary = useMemo(() => {
    const years = {};
  
    data.forEach(tx => {
      const y = dayjs(tx.transaction_date).year();
      if (!years[y]) years[y] = {};
  
      // value of the whole transaction in TND
      const tradedTx = (tx.amount || 0) * (tx.execution_rate || 0);
  
      tx.hedging_with_forward.details.forEach(d => {
        if (d.forward_rate > 0) {
          const spr = tradedTx ? (d.pnl_tnd / tradedTx) * 100 : 0;
  
          if (!years[y][d.maturity_days]) {
            years[y][d.maturity_days] = {
              max: -Infinity,
              min:  Infinity,
              pnl:  0,
              traded: 0,
            };
          }
  
          const bucket = years[y][d.maturity_days];
          bucket.max    = Math.max(bucket.max, spr);
          bucket.min    = Math.min(bucket.min, spr);
          bucket.pnl   += d.pnl_tnd;
          bucket.traded += tradedTx;
        }
      });
    });
  
    // build the array for the table
    return Object.entries(years).map(([year, obj]) => ({
      year: +year,
      ...MATURITIES.reduce((acc, m) => {
        const { max = 0, min = 0, pnl = 0, traded = 0 } = obj[m] || {};
        return {
          ...acc,
          [m]: {
            max,
            min,
            // volume‑weighted average
            avg: traded ? (pnl / traded) * 100 : 0,
          },
        };
      }, {}),
    }));
  }, [data]);
  

  if (loading) return <div className="text-center mt-4">Chargement...</div>;

  // ─── RENDER ───
  return (
    <div style={{ width: "100%", maxWidth: "1440px", margin: "0 auto" }}>
      {/* 1. P&L + Spread chart */}
      <div className="row mb-4">
      <div className="col-md-6 d-flex">
<div className="card shadow-sm mb-4 flex-fill">
  <div className="card-body d-flex flex-column">
        <h5 className="mb-3">
  Performance des couvertures forward —{" "}
   {yearToPlot === "all" ? "toutes années" : yearToPlot}
 </h5>
          <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
  <ComposedChart   data={chartData}>
    <XAxis dataKey="label" />

    {/* axe gauche = P&L TND */}
    <YAxis
      yAxisId="left"
      label={{ value: "P&L (TND)", angle: -90, position: "insideLeft" 
      }}
      tickFormatter={v => `${(v / 1000).toFixed(0)} K`} // Format in 'K TND'

    />
    {/* axe droit = spread % */}
    <YAxis
      yAxisId="right"
      orientation="right"
      label={{ value: "Spread %", angle: 90, position: "insideRight" 
      }} 
      tickFormatter={v => v.toFixed(2) }
    />

    <Tooltip
    formatter={(v, n) => (n === "Spread (%)" ? v.toFixed(2) + " %" : fmtTND(v))}
    />
    <Legend />

    {/* BARRES – affichées d’abord */}
    <Bar
      yAxisId="left"
      dataKey="pnl"
      name="P&L total"
      fill="#8db3e2"
      barSize={60}
    />

    {/* LIGNE – déclarée APRÈS ⇒ apparaît au‑dessus */}
    <Line
      yAxisId="right"
      dataKey="spread"
      name="Spread (%)"
      type="monotone"
      stroke="#e67e22"
      strokeWidth={3}
      dot={{ r: 4 }}
    />
  </ComposedChart>
</ResponsiveContainer>

          </div>

          {/* Year selector */}
          <div className="mt-2">
            <label className="me-2">Sélectionner l’année:</label>
            <select value={yearToPlot} onChange={e => setYearToPlot(+e.target.value)}>
            <option value="all">Tous</option>
              {perYearSummary
                .map(y => y.year)
                .sort((a, b) => b - a)
                .map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div> </div> 

      {/* 2. FX rates trend (unchanged) */}
      <div className="col-md-6 d-flex">
          <div className="card shadow-sm flex-fill d-flex flex-column">
            <div className="card-body d-flex flex-column flex-fill">
          <h5 className="mb-3">Évolution des taux FX</h5>
          <div style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                <XAxis dataKey="month" />
                <YAxis
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={v => v.toFixed(4)}
                  tick={{ fontSize: 12, fill: "#333" }}
                  axisLine={{ stroke: "#666" }}
                  tickLine={{ stroke: "#666" }}
                />
                <Tooltip formatter={v => v.toFixed(4)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="execution"
                  stroke={COLORS.line[0]}
                  strokeWidth={2}
                  name="Taux d'execution"
                />
                {MATURITIES.map((m, idx) => (
                  <Line
                    key={m}
                    type="monotone"
                    dataKey={m}
                    stroke={COLORS.line[idx + 1]}
                    strokeDasharray="4 4"
                    name={`Forward ${labelMonths(m)}`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      </div>
      </div>
      {/* 3. Annual summary table – unchanged except source */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h6 className="mb-3">Résumé annuel des P&L à travers différents horizons de couverture</h6>
          <div className="table-responsive">
            <table className="annual-summary-table">
              <thead>
                <tr>
                  <th>Année</th>
                  <th></th>
                  {HORIZONS.map(d => (
                    <th key={d}>{d / 30} mois</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {annualSummary.map(yearObj => (
                  <React.Fragment key={yearObj.year}>
                    {/* Max loss */}
                   {/* Max Perte */}
<tr>
  <td rowSpan={4} className="year-cell">
    {yearObj.year}
  </td>
  <td>Max Perte</td>

  {HORIZONS.map(d => {
    const val = yearObj[d]?.min;                // the most negative P&L
    return (
      <td key={d} className="text-danger">
        {val !== undefined && val < 0           // show it only if < 0
          ? `${val.toFixed(0)} TND`
          : "__"}                               
      </td>
    );
  })}
</tr>

                    {/* Max gain */}
                    <tr>
                      <td>Max Gain</td>
                      {HORIZONS.map(d => (
                        <td key={d} className="text-success">
                          {yearObj[d]?.max.toFixed(0) ?? "-"} TND
                        </td>
                      ))}
                    </tr>
                    {/* Avg P&L */}
                    <tr>
                      <td>P&L moyen</td>
                      {HORIZONS.map(d => (
                        <td key={d}>{yearObj[d]?.avg.toFixed(0) ?? "-"} TND</td>
                      ))}
                    </tr>
                    {/* Total P&L */}
                    <tr className="total-row">
                      <td>P&L total</td>
                      {HORIZONS.map(d => (
                        <td key={d} className="fw-bold">
                          {yearObj[d]?.total.toFixed(0) ?? "-"} TND
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* ——  Tableau annuel des Spreads (%)  —— */}
<div className="card shadow-sm mb-4">
  <div className="card-body">
    <h6 className="mb-3">Résumé annuel des Spreads (%)</h6>
    <div className="table-responsive">
      <table className="annual-summary-table">
        <thead>
          <tr>
            <th>Année</th>
            <th></th>
            {MATURITIES.map(d => (
              <th key={d}>{d / 30} mois</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {annualSpreadSummary.map(y => (
            <React.Fragment key={y.year}>
              <tr>
                <td rowSpan={3} className="year-cell">{y.year}</td>
                <td>Max</td>
                {MATURITIES.map(d => (
                  <td key={d}>{y[d]?.max.toFixed(2) ?? "-"} %</td>
                ))}
              </tr>
              <tr>
                <td>Min</td>
                {MATURITIES.map(d => (
                  <td key={d}>{y[d]?.min.toFixed(2) ?? "-"} %</td>
                ))}
              </tr>
              <tr className="total-row">
                <td>Moyenne</td>
                {MATURITIES.map(d => (
                  <td key={d}>{y[d]?.avg.toFixed(2) ?? "-"} %</td>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>

    </div>
  );
}
