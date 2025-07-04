// File: src/jsx/pages/dashboard/AdminTcaPage.jsx
import React, { useState } from "react";
import axiosInstance from "../../../services/AxiosInstance";
import { Button, Form, Alert, Spinner } from "react-bootstrap";
import SpotTCA     from "./TcaSpot";
import ForwardTca  from "./ForwardTca";
import OptionsTca  from "./OptionsTca";

/* ── config ─────────────────────────────────────────────── */
const TEMPLATE_CHOICES = [
  { value: "spot",                label: "Spot" },
  { value: "spot-forward",        label: "Spot + Forward" },
  { value: "spot-option",         label: "Spot + Option" },
  { value: "spot-forward-option", label: "Spot + Forward + Option" },
];

// 🚩 No /user prefix — endpoints are at the root
const TEMPLATE_DOWNLOAD_MAP = {
  spot:                  "/download-tca-inputs-template",
  "spot-forward":        "/download-orders-template",
  "spot-option":         "/download-orders-template",
  "spot-forward-option": "/download-orders-template",
};

/* ── component ──────────────────────────────────────────── */
export default function AdminTcaPage() {
  const [clientName, setClientName] = useState("");
  const [template,   setTemplate]   = useState(TEMPLATE_CHOICES[0].value);
  const [file,       setFile]       = useState(null);
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState("");
  const [ok,         setOk]         = useState(false);
  const [currency,   setCurrency]   = useState({ label: "USD", value: "USD" });

  /* ── ⬇️ simplest download (lets browser handle it) ────── */
  function downloadTemplate() {
    const endpoint = TEMPLATE_DOWNLOAD_MAP[template];
    const baseURL  = axiosInstance.defaults.baseURL?.replace(/\/$/, "") || "";
    window.location.href = baseURL + endpoint;   // forces a file download
  }

  /* ── 📤 upload handling ───────────────────────────────── */
  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setOk(false);

    if (!clientName.trim() || !file) {
      setError("Pick a client name and an Excel file.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("client_name", clientName.trim());

    try {
      setBusy(true);
      await axiosInstance.post("/admin/api/tca/inputs", fd, {
        params:  { client_name: clientName.trim() },
        headers: { "Content-Type": "multipart/form-data" },
      });
      setOk(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  /* ── UI ─────────────────────────────────────────────── */
  return (
    <div className="container py-4">
      <h2 className="mb-4">Admin · TCA generator</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Button variant="secondary" className="mb-3" onClick={downloadTemplate}>
        Download&nbsp;{template === "spot" ? "TCA" : "Orders"} Template
      </Button>

      {/* upload form */}
      <Form onSubmit={onSubmit} className="mb-5">
        <Form.Group className="mb-3">
          <Form.Label>Client name</Form.Label>
          <Form.Control
            value={clientName}
            onChange={e => setClientName(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Template</Form.Label>
          <Form.Select
            value={template}
            onChange={e => setTemplate(e.target.value)}
          >
            {TEMPLATE_CHOICES.map(o =>
              <option key={o.value} value={o.value}>{o.label}</option>
            )}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Excel file (.xls / .xlsx)</Form.Label>
          <Form.Control
            type="file"
            accept=".xls,.xlsx"
            onChange={e => setFile(e.target.files[0])}
          />
        </Form.Group>

        <Button type="submit" disabled={busy}>
          {busy ? <Spinner animation="border" size="sm" /> : "Upload & display"}
        </Button>
      </Form>

      {ok && (
        <>
          <SpotTCA
            clientName       = {clientName}
            clientIdOrName   = {clientName}
            currency         = {currency}
            onCurrencyChange = {setCurrency}
          />

          {(template === "spot-forward" || template === "spot-forward-option") &&
            <ForwardTca clientIdOrName={clientName} currency={currency.value} />
          }

          {(template === "spot-option"  || template === "spot-forward-option") &&
            <OptionsTca clientIdOrName={clientName} currency={currency.value} />
          }
        </>
      )}
    </div>
  );
}
