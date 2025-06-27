// File: src/jsx/pages/dashboard/AdminTcaPage.jsx
import React, { useState } from "react";
import axiosInstance from "../../../services/AxiosInstance";
import { Button, Form, Alert, Spinner } from "react-bootstrap";
import SpotTCA from './Portofolio';
import ForwardTca from './ForwardTca';
import OptionsTca from './OptionsTca';

const TEMPLATE_CHOICES = [
  { value: "spot",               label: "Spot" },
  { value: "spot-forward",       label: "Spot + Forward" },
  { value: "spot-option",        label: "Spot + Option" },
  { value: "spot-forward-option",label: "Spot + Forward + Option" },
];

export default function AdminTcaPage() {
  const [clientName, setClientName] = useState("");
  const [template,   setTemplate]   = useState(TEMPLATE_CHOICES[0].value);
  const [file,       setFile]       = useState(null);
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState("");
  const [ok,         setOk]         = useState(false);

  // single source of truth for currency (defaults to USD)
const [currency, setCurrency] = useState({ label: "USD", value: "USD" });

  // ───── file upload ─────
  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setOk(false);

    if (!clientName.trim() || !file) {
      setError("Pick a client and an Excel file."); return;
    }

 const url   = "/admin/api/tca/inputs";


    const fd = new FormData();
    fd.append("file", file);
    fd.append("client_name", clientName.trim());

    try {
      setBusy(true);
      await axiosInstance.post(url, fd, {
            params: { client_name: clientName.trim() },
              headers: { "Content-Type": "multipart/form-data" }
            });
      setOk(true);                     // show the widgets
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Admin · TCA generator</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ─── upload form ─── */}
      <Form onSubmit={onSubmit} className="mb-5">
        <Form.Group className="mb-3">
          <Form.Label>Client name</Form.Label>
          <Form.Control value={clientName}
                        onChange={e => setClientName(e.target.value)} />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Template</Form.Label>
          <Form.Select value={template}
                       onChange={e => setTemplate(e.target.value)}>
            {TEMPLATE_CHOICES.map(o =>
              <option key={o.value} value={o.value}>{o.label}</option>
            )}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Excel file (.xls / .xlsx)</Form.Label>
          <Form.Control type="file"
                        accept=".xls,.xlsx"
                        onChange={e => setFile(e.target.files[0])}/>
        </Form.Group>

        <Button type="submit" disabled={busy}>
          {busy ? <Spinner animation="border" size="sm"/> : "Upload & display"}
        </Button>
      </Form>

      {/* ─── live report ─── */}
      {ok && (
        <>
          {/* Spot is ALWAYS rendered → it contains the currency picker */}
          <SpotTCA
  clientName       = {clientName}          // unchanged – used by Spot widget
  clientIdOrName   = {clientName}          // ➜ goes into ?client_id=
  currency         = {currency}            // object {label,value}
  onCurrencyChange = {setCurrency}         // lift state up
/>

{(template === "spot-forward" || template === "spot-forward-option") &&
  <ForwardTca
    clientIdOrName = {clientName}
    currency       = {currency.value}      // string → endpoint
  />
}

{(template === "spot-option"  || template === "spot-forward-option") &&
  <OptionsTca
    clientIdOrName = {clientName}
    currency       = {currency.value}
  />
}

        </>
      )}
    </div>
  );
}
