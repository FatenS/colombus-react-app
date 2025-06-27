// // File: src/jsx/pages/dashboard/OptionsTca.jsx
import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../../services/AxiosInstance";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const API_OPTIONS = "/tca/spot-option";

// Format ticks / tooltips in TND
const fmtTND = v =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "TND",
    maximumFractionDigits: 0,
  }).format(v);
  export default function OptionsTca({ currency, clientIdOrName = null }) {
 
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------------------ */
/* OptionsTca.jsx – fetch spot-option data                            */
/* ------------------------------------------------------------------ */
useEffect(() => {
  setLoading(true);

  const params = {
    currency,
    ...(clientIdOrName && { client_id: clientIdOrName })
  };

  axiosInstance
    .get(API_OPTIONS, { params })
    .then(r => setResponse(r.data))
    .catch(console.error)
    .finally(() => setLoading(false));
}, [currency, clientIdOrName]);

  // Aggregate per‐maturity totals
  const data = useMemo(() => {
    if (!response?.deals) return [];
    const acc = {};
    response.deals.forEach(deal =>
      deal.hedging_with_options.details.forEach(d => {
        const m = d.maturity_days;
        if (!acc[m]) acc[m] = { maturity: m, premium: 0, pnl: 0 };
        acc[m].premium += d.option_prime_tnd || 0;
        acc[m].pnl     += d.pnl_tnd         || 0;
      })
    );
    return Object.values(acc).sort((a, b) => a.maturity - b.maturity);
  }, [response]);

  if (loading) return <div className="text-center mt-4">Chargement options…</div>;

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="mb-3">Performance des couvertures options</h5>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis
                dataKey="maturity"
                tickFormatter={d => `${d / 30} mois`}
                label={{ value: "Maturité (mois)", position: "insideBottom", offset: -5 }}
                
              />
              <YAxis
                label={{ value: "TND", angle: -90, position: "insideLeft" }}
                tickFormatter={v => (v / 1000).toFixed(0) + " K"}
              />
              <Tooltip formatter={fmtTND} />
              <Legend verticalAlign="top" />

              <Bar
                dataKey="premium"
                name="Coût prime"
                barSize={40}
                fill="#8db3e2"
              />
              <Bar
                dataKey="pnl"
                name="P&L sur options"
                barSize={40}
                fill="#2c3e50"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
