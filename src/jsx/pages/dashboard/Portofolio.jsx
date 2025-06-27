// File: src/jsx/pages/dashboard/SpotTCA.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import axiosInstance from "../../../services/AxiosInstance";
import dayjs from "dayjs";
import ForwardTca from "./ForwardTca";
import OptionsTca from "./OptionsTca";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "react-bootstrap";
import "./TCATableForward.css";
import Select from "react-select";

import {
    ResponsiveContainer,
    ComposedChart, Bar, Line,LineChart,
    XAxis, YAxis,Brush ,                  
    CartesianGrid, Tooltip, Legend 
  } from "recharts";
import AdminTcaPage from "./AdminTcaPage";

const API_SPOT = "/tca/spot";
const monthLabels = [
  "janv", "févr", "mars", "avr", "mai", "juin",
  "juil", "août", "sept", "oct", "nov", "déc"
];

// Helper functions declared before component
const average = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const sum = arr => arr.reduce((a, b) => a + b, 0);
// right under the monthLabels array
const currencySigns = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };

/** 123 456 789  →  "124 K$" (or "124 K€", …) */
const toK = (v, sign = "") =>
  `${Math.round(v / 1_000).toLocaleString("fr-FR")} K${sign}`;

const withSymbol = (vInThousands, sign = "") =>
  `${Math.round(vInThousands).toLocaleString("fr-FR")} K${sign}`;
// export default function SpotTCA({ clientIdOrName = null, currency, onCurrencyChange }) {
  // const [rows, setRows] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [currency, setCurrency] = useState({ label: "USD", value: "USD" });
  export default function SpotTCA({
    clientIdOrName = null,                  
    currency:   controlledCurrency,         
    onCurrencyChange: controlledSetter     
     }) {
  
    
     const usingControlled = Boolean(controlledSetter);
     const [localCurrency, setLocalCurrency] = React.useState(
      controlledCurrency ?? { label: "USD", value: "USD" }
     );
    
     // use the right source everywhere in the component
   const currency         = usingControlled ? controlledCurrency : localCurrency;
   const setCurrency      = usingControlled ? controlledSetter  : setLocalCurrency;
    
      const [rows, setRows] = useState([]);
   const [loading, setLoading] = useState(true);
  const [pdfMode, setPdfMode] = useState(false); // Correct placement
  const pdfRef = useRef(null);

  const pdfPageStyle = pdfMode
    ? { 
        height: "198mm", 
        overflow: "hidden", 
        pageBreakAfter: "always", 
        padding: "10mm", 
        boxSizing: "border-box" 
      }
    : {};
    /* ------------------------------------------------------------------ */
/* SpotTCA.jsx – fetch spot transactions                              */
/* ------------------------------------------------------------------ */
useEffect(() => {
  setLoading(true);

  const params = {
    currency: currency.value,           // "USD", "EUR"…
    ...(clientIdOrName && { client_id: clientIdOrName })
  };

  axiosInstance
    .get(API_SPOT, { params })
    .then(r => setRows(Array.isArray(r.data) ? r.data : []))
    .catch(console.error)
    .finally(() => setLoading(false));
}, [currency, clientIdOrName]);


    const fmtTND = v =>
      new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v) + " TND";
    
    const handleDownloadPdf = async () => {
      setPdfMode(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pages = pdfRef.current.querySelectorAll(".pdf-page");
    
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
    
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
      }
    
      pdf.save(`TCA_${new Date().toISOString().slice(0, 10)}.pdf`);
      setPdfMode(false);
    };
    
  
  // Data transformations
  const exposureData = useMemo(() => {
    const years = {};
    rows.forEach(r => {
      const y = dayjs(r.transaction_date).year();
      years[y] = (years[y] || 0) + (r.amount || 0);
    });
    return Object.entries(years).map(([year, val]) => ({
      year,
      value: Math.round(val / 1000)
    }));
  }, [rows]);

  const spreadMetrics = useMemo(() => {
    const spreads = rows.flatMap(r => [
      r.spread_interbank_pct || 0,
      // r.spread_fixing_morning_pct || 0,
      // r.spread_fixing_afternoon_pct || 0
    ]);
    return {
      avg: average(spreads),
      max: Math.max(...spreads)
    };
  }, [rows]);

  //  • Total traded in TND = Σ amount × execution_rate
const totalTradedTND = useMemo(() => {
  return rows.reduce(
    (acc, { amount = 0, execution_rate = 0 }) =>
      acc + amount * execution_rate,
    0
  );
}, [rows]);

//  • FX Loss in TND = Σ pnl_interbank_tnd, plus % of totalTraded
const fxLossTND = useMemo(() => {
  const loss = rows.reduce(
    (acc, { pnl_interbank_tnd = 0 }) => acc + pnl_interbank_tnd,
    0
  );
  return {
    loss,
    pct: totalTradedTND ? (loss / totalTradedTND) * 100 : 0
  };
}, [rows, totalTradedTND]);

//  • Simple formatter
const formatTND = v =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "TND", maximumFractionDigits: 0 }).format(v);
  const historicalTableData = useMemo(() => {
    const monthly = {};
    rows.forEach(r => {
      const key = dayjs(r.transaction_date).format("YYYY-MM");
      if (!monthly[key]) {
        monthly[key] = {
          year: dayjs(r.transaction_date).year(),
          month: monthLabels[dayjs(r.transaction_date).month()],
          spreads: []
        };
      }
      monthly[key].spreads.push({
        interbank: r.spread_interbank_pct || 0,
        fixingAM: r.spread_fixing_morning_pct || 0,
        fixingPM: r.spread_fixing_afternoon_pct || 0
      });
    });
    return Object.values(monthly)
      .map(m => ({
        ...m,
        interbank: average(m.spreads.map(s => s.interbank)),
        fixingAM: average(m.spreads.map(s => s.fixingAM)),
        fixingPM: average(m.spreads.map(s => s.fixingPM))
      }))
      .sort((a,b) => a.year - b.year || monthLabels.indexOf(a.month) - monthLabels.indexOf(b.month));
  }, [rows]);

  //  • P&L total cumulé
const totalPnl = useMemo(() => {
  return sum(rows.map(r =>
    (r.pnl_interbank_tnd || 0)
    + (r.pnl_fixing_morning_tnd || 0)
    + (r.pnl_fixing_afternoon_tnd || 0)
  ));
}, [rows]);

//  • P&L par année
const annualPnl = useMemo(() => {
  const byYear = {};
  rows.forEach(r => {
    const y = dayjs(r.transaction_date).year();
    const pnl = (r.pnl_interbank_tnd || 0)
              + (r.pnl_fixing_morning_tnd || 0)
              + (r.pnl_fixing_afternoon_tnd || 0);
    byYear[y] = (byYear[y] || 0) + pnl;
  });
  // trier par année croissante
  return Object.entries(byYear)
    .map(([year, pnl]) => ({ year, pnl: Math.round(pnl/1000) }))
    .sort((a,b) => a.year - b.year);
}, [rows]);

const fxTrendData = useMemo(() => {
  const monthly = {};
  rows.forEach(r => {
    const date = dayjs(r.transaction_date).startOf("month");
    const key = date.format("YYYY-MM"); // Unique key per month
    
    if (!monthly[key]) {
      monthly[key] = {
        timestamp: date.valueOf(),
        execution: [],
        interbank: [],
        fixingAM: [],
        fixingPM: []
      };
    }
    monthly[key].execution.push(r.execution_rate || 0);
    monthly[key].interbank.push(r.interbank_rate || 0);
    monthly[key].fixingAM.push(r.fix_mid_morning || 0);
    monthly[key].fixingPM.push(r.fix_mid_afternoon || 0);
  });

  return Object.values(monthly)
    .map(item => ({
      timestamp: item.timestamp,
      Execution: average(item.execution),
      Interbank: average(item.interbank),
      FixingAM: average(item.fixingAM),
      FixingPM: average(item.fixingPM),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}, [rows]);

  // const fxTrendData = useMemo(() => {
  //   return rows
  //     .map(r => ({
  //       ts:  new Date(r.transaction_date).getTime(),      // ← nombre (ms)
  //       Execution:  r.execution_rate      ?? null,
  //       Interbank:  r.interbank_rate      ?? null,
  //       FixingAM:   r.fix_mid_morning     ?? null,
  //       FixingPM:   r.fix_mid_afternoon   ?? null,
  //     }))
  //     .sort((a, b) => a.ts - b.ts);                       // ordre chronologique
  // }, [rows]);
  
  // — P&L sum & spread moyen pour Interbank / Fixing AM / Fixing PM
const summaryChartData = useMemo(() => {
  // somme des P&L TND
  const totalInter = sum(rows.map(r => r.pnl_interbank_tnd || 0));
  const totalAM   = sum(rows.map(r => r.pnl_fixing_morning_tnd || 0));
  const totalPM   = sum(rows.map(r => r.pnl_fixing_afternoon_tnd || 0));
  
  // spread moyen en pourcentage
  const avgInter = average(rows.map(r => (r.spread_interbank_pct || 0) ));
  const avgAM    = average(rows.map(r => (r.spread_fixing_morning_pct || 0) ));
  const avgPM    = average(rows.map(r => (r.spread_fixing_afternoon_pct || 0) ));
  
  return [
    { name: "Interbank", pnl: totalInter, spread: avgInter },
    { name: "Fixing 10h", pnl: totalAM,   spread: avgAM    },
    { name: "Fixing 15h", pnl: totalPM,   spread: avgPM    },
  ];
}, [rows]);


  if (loading) {
    return <div className="text-center mt-4">Chargement des données spot...</div>;
  }

  const containerStyle = pdfMode
  ? { backgroundColor: '#fff', padding: '20px', fontFamily: 'Calibri, sans-serif' }
  : { maxWidth: 1440, margin: '0 auto' };


  return (
    <>
      <div className="text-end me-3 mt-2">
        <Button variant="primary" onClick={handleDownloadPdf}>
          Télécharger PDF
        </Button>
      </div>
      <div ref={pdfRef} className="container-fluid" style={containerStyle}>
        {/* 0. Sélecteur de devise */}
<div className="row mb-3">
  <div className="col-md-2">
    <Select
      options={[
        { label: "USD", value: "USD" },
        { label: "EUR", value: "EUR" },
        { label: "GBP", value: "GBP" },
        { label: "JPY", value: "JPY" },
      ]}
      value={currency}
      onChange={setCurrency}
      isSearchable={false}
    />
  </div>
</div>

        {/* KPI CARDS */}
        {/* ─── Top KPI Banner ─── */}
<div className="card mb-4 shadow-sm">
  <div className="card-body">
    <h5 className=" text-center mb-3">
      Transactional cost analysis: Transforming treasury from a cost center to a source of financing
    </h5>

    <div className="row text-center gx-0">
      {/* Total Traded */}
      <div className="col-md-3">
        <small className="text-muted">Total Traded</small>
        <div className="h4 fw-bold">{toK(totalTradedTND, " TND")}</div>
      </div>

      {/* Exposition Totale */}
      <div className="col-md-3">
        <small className="text-muted">Exposition Totale</small>
        <div className="h4 fw-bold text-primary">
         
          {withSymbol(
  exposureData.reduce((sum, e) => sum + e.value, 0),
   currencySigns[currency.value])
 }
        </div>
        <div className="small text-muted">
        {exposureData
      .map(e => `${e.year}: ${withSymbol(e.value)}`)
      .join(" • ")
    }
        </div>
      </div>

      {/* Spread Moyen */}
      <div className="col-md-3">
        <small className="text-muted">Spread Moyen</small>
        <div className="h4 fw-bold ">{spreadMetrics.avg.toFixed(2)}%</div>
        <div className="small text-muted">sur toutes les transactions</div>
      </div>

      {/* Spread Max */}
      <div className="col-md-3">
        <small className="text-muted">Max Spread</small>
        <div className="h4 fw-bold ">{spreadMetrics.max.toFixed(2)}%</div>
        <div className="small text-muted">Pic historique</div>
      </div>
    </div>
  </div>
</div>

{/* <div className="card mb-4 shadow-sm">
  <div className="card-body">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div>
        <div className="text-muted small">P&L total <span className="fst-italic">Depuis 2021</span></div>
        <div className="h2 fw-bold">{Math.round(totalPnl/1000)} K TND</div>
      </div>
      <div className="text-end">
        <div className="small text-muted">Spread moyen</div>
        <div className="fw-bold">{(spreadMetrics.avg).toFixed(2)} %</div>
        <div className="small text-muted mt-1">Max spread</div>
        <div className="fw-bold">{(spreadMetrics.max).toFixed(2)} %</div>
      </div>
    </div>

           <div style={{ height: 80 }}>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart
            data={annualPnl}
          margin={{ top: 10, right: 20, bottom: 20, left: 20 }}
          >
            <XAxis
              dataKey="year"
            axisLine={{ stroke: "#ccc" }}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#666" }}
            padding={{ left: 20, right: 20 }}
              interval={0}
            />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v} K`}
            width={40}
            domain={["dataMin", "dataMax"]}
          />
            <Tooltip
              formatter={val => `${val} K TND`}
              labelFormatter={year => `Année ${year}`}
            />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke="#2c3e50"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2c3e50" }}
              activeDot={{ r: 6 }}
            label={{ position: "top", formatter: v => `${v} K` }}
            />
          </LineChart>

                </ResponsiveContainer>
              </div>
              
  </div>
</div> */}  
<div className="pdf-page" style={pdfPageStyle}>
 {/* HISTORICAL SPREAD TABLE */}
<div className="card shadow-sm mb-4">
  <div className="card-body">
    <h5 className=" mb-3">Historique des spreads</h5>
    <div className="table-responsive">
      <table className="annual-summary-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Interbancaire BCT</th>
            <th>Fixing 10h</th>
            <th>Fixing 15h</th>
          </tr>
        </thead>
        <tbody>
          {historicalTableData.map((row, idx) => (
            <tr key={idx}>
              <td>{row.month} {row.year}</td>
              <td className={row.interbank < 0 ? 'text-danger' : 'text-success'}>
                {row.interbank.toFixed(2)}%
              </td>
              <td className={row.fixingAM < 0 ? 'text-danger' : 'text-success'}>
                {row.fixingAM.toFixed(2)}%
              </td>
              <td className={row.fixingPM < 0 ? 'text-danger' : 'text-success'}>
                {row.fixingPM.toFixed(2)}%
              </td>
            </tr>
          ))}
          <tr className="total-row fw-bold">
            <td>Moyenne</td>
            <td>
              {average(
                  rows
                    .map(r => r.spread_interbank_pct)
                    .filter(v => v !== undefined && v !== null)   // on ignore les manquants
                ).toFixed(2)}%
            </td>
            <td>
              {average(
                  rows
                    .map(r => r.spread_fixing_morning_pct)
                    .filter(v => v !== undefined && v !== null)   // on ignore les manquants
                ).toFixed(2)}%
            </td> <td>
              {average(
                  rows
                    .map(r => r.spread_fixing_afternoon_pct)
                    .filter(v => v !== undefined && v !== null)   // on ignore les manquants
                ).toFixed(2)}%
            </td>
            
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>


        {/* FX RATES TREND */}
<div className="row mb-4">
        <div className="col-md-6 d-flex">
        <div className=" card shadow-sm mb-4 flex-fill">
          <div className="card-body d-flex flex-column">
            <h5 className=" mb-3">Évolution des taux FX</h5>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fxTrendData}>
                  {/* <CartesianGrid strokeDasharray="3 3" /> */}
                  <XAxis 
  dataKey="timestamp"
  type="number"
  scale="time" // Correct scale for time-based values
  domain={['auto', 'auto']}
  tickFormatter={ts => dayjs(ts).format("MMM YYYY")}
  tick={{ fontSize: 12 }}
/>

                                   <YAxis domain={[ 'auto', 'auto' ]} tickFormatter={v=>v.toFixed(3)} />
                  <Tooltip formatter={v=>v.toFixed(4)} />
                        

                  <Legend />
                  {/* <Brush
                    dataKey="ts"                  // same numeric key
                    height={20}                   // height of the slider
                    travellerWidth={8}            // handle width
                    tickFormatter={t => dayjs(t).format('DD/MM')}
                  /> */}
                                 
<Line
  type="monotone"
  dataKey="Execution"
  name="Taux d'exécution"
  stroke="#2c3e50"
  strokeWidth={3}          // plus épais, sans tirets
/>

{/* 2. INTERBANK – tirets longs */}
<Line
  type="monotone"
  dataKey="Interbank"
  name="Taux interbancaire"
  stroke="#e74c3c"
  strokeWidth={2}
  strokeDasharray="8 4"    // 8 px plein, 4 px vide
/>

{/* 3. FIXING 10 h – tirets moyens */}
<Line
  type="monotone"
  dataKey="FixingAM"
  name="Fixing 10 h"
  stroke="#27ae60"
  strokeWidth={2}
  strokeDasharray="4 2"    // 4 px plein, 2 px vide
/>

{/* 4. FIXING 15 h – pointillé */}
<Line
  type="monotone"
  dataKey="FixingPM"
  name="Fixing 15 h"
  stroke="#9b59b6"
  strokeWidth={2}
  strokeDasharray="1 3"    // 1 px plein, 3 px vide → pointillé
/>

                </LineChart>
              </ResponsiveContainer>
            
            </div>
            </div>            </div>


{/* P&L vs Spread Chart */}
<div className="col-md-6 d-flex">
<div className="card shadow-sm mb-4 flex-fill">
  <div className="card-body d-flex flex-column">
    <h5 className=" mb-3">P&L (TND) & spread moyen (%)</h5>
    <div style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={summaryChartData}>
          {/* <CartesianGrid strokeDasharray="3 3" /> */}
          <XAxis dataKey="name" />
          
          {/* Axe gauche pour les montants TND */}
          <YAxis
            yAxisId="left"
            label={{ value: "P&L (TND)", angle: -90, position: "insideLeft" }}
            tickFormatter={v => `${(v / 1000).toFixed(0)} K`} // Format in 'K TND'

          />
          
          {/* Axe droit pour les spreads (%) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: "Spread %", angle: 90, position: "insideRight" }}
            tickFormatter={v => v.toFixed(1) }
          />
          
          <Tooltip
            // formatter={(value, name) =>
            //   name === "Spread moyen"
            //     ? value.toFixed(2) + "%"
            //     : value.toFixed(0) + " TND"
            // }
            formatter={(value, name) =>
                 name === "Spread moyen" ? value.toFixed(2) + " %" : fmtTND(value)
                }
          />
          <Legend />
          
          {/* Barres PnL */}
          <Bar
            yAxisId="left"
            dataKey="pnl"
            name="P&L Total"
            barSize={50}
            fill="#8db3e2"
          />
          
          {/* Ligne spread moyen avec points */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="spread"
            name="Spread moyen"
            stroke="#e67e22"
            strokeWidth={2}
            dot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </div>
</div>
</div></div>   </div>

        {/* Forward TCA Chart */}
        {/* <div className="pdf-page" style={pdfPageStyle}>
        <ForwardTca currency={currency.value} />   
           </div>

        <div className="pdf-page" style={pdfPageStyle}>
        <OptionsTca currency={currency.value} />
        </div> */}

      </div>
    </>
  );
}