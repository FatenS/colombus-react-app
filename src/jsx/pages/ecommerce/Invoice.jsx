import React, { Fragment, useEffect, useState, useRef } from "react";
import axiosInstance from "../../../services/AxiosInstance";
import qrcode from "../../../assets/images/signature.png";
import logoText from "../../../assets/images/CC_Original.png";
import { useParams, useNavigate } from "react-router-dom";
import n2words from "n2words";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// ---------- Utils ----------
const moisFr = (month) =>
  [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ][month - 1];

const formatTND3 = (value) =>
  Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const formatDevise2 = (val) =>
  Number((val || "0").toString().replace(/\s/g, "").replace(",", ".")).toLocaleString(
    "fr-FR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

const cleanNumber = (numStr) =>
  parseFloat((numStr || "0").replace(/\s/g, "").replace(",", "."));

// get cumulative offsetTop of el relative to ancestor
const getOffsetTopWithin = (el, ancestor) => {
  let y = 0;
  let node = el;
  while (node && node !== ancestor) {
    y += node.offsetTop || 0;
    node = node.offsetParent;
  }
  return y;
};

const Invoice = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // PDF mode forces the container to exact A4 width so html2canvas renders 1:1 with pages
  const [pdfMode, setPdfMode] = useState(false);
  const pdfRef = useRef(null);
  const detailsTableRef = useRef(null);
  const avoidBreakRef = useRef(null); // the “Détail de la Facture” header block

  /* ---------- Fetch invoice ------------ */
  useEffect(() => {
    if (!invoiceId) return;
    axiosInstance
      .get(`/invoice/${invoiceId}`)
      .then(({ data }) => setInvoice(data))
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  /* ---------- Actions (optional) ------- */
  const handleConfirm = async () => {
    const pdfUrl = prompt("URL du PDF");
    if (!pdfUrl) return;
    setConfirming(true);
    try {
      await axiosInstance.post(`/invoice/${invoiceId}/confirm`, { pdf_url: pdfUrl });
      window.location.reload();
    } finally {
      setConfirming(false);
    }
  };

  const handleMarkPaid = async () => {
    setStatusLoading(true);
    try {
      await axiosInstance.patch(`/invoice/${invoiceId}/status`, { status: "paid" });
      window.location.reload();
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return <div>Chargement…</div>;
  if (!invoice) return <div>Facture introuvable</div>;

  // ---------- Data ----------
  const { payload, creation_date } = invoice;
  const client = payload?.client || {};
  const period = payload?.period || {};
  const fraisVariable = payload?.frais_variable || [];
  const fraisFixe = payload?.frais_fixe || {};
  const totals = payload?.totals || {};
  const totalTTC = totals?.total_ttc || 0;

  const getTotalTraded = () => {
    const currencies = [...new Set(fraisVariable.map((row) => row["Devise"]))];
    if (currencies.length === 1) {
      const currency = currencies[0];
      const total = fraisVariable.reduce((sum, row) => sum + cleanNumber(row["Montant"]), 0);
      return `${total.toLocaleString("fr-FR", { minimumFractionDigits: 3 })} ${currency}`;
    } else {
      const totalTND = fraisVariable.reduce((sum, row) => {
        const montant = cleanNumber(row["Montant"]);
        const taux = cleanNumber(row["Taux d’exécution"] || row["Taux d'exécution"]);
        return sum + montant * taux;
      }, 0);
      return `${totalTND.toLocaleString("fr-FR", { minimumFractionDigits: 3 })} TND`;
    }
  };

  const montantEnMots = (() => {
    const [dinStr, milliStr] = Number(totalTTC).toFixed(3).split(".");
    const dinars = parseInt(dinStr, 10);
    const millimes = parseInt(milliStr, 10);
    const wordsDinars = n2words(dinars, { lang: "fr" });
    const wordsMillimes = n2words(millimes, { lang: "fr" });
    return millimes
      ? `${wordsDinars} dinars et ${wordsMillimes} millimes`
      : `${wordsDinars} dinars`;
  })();

    // ---------- PDF: Direct Print Approach ----------
  const handleDownloadPdf = async () => {
    if (!pdfRef.current) {
      console.error("pdfRef.current is null");
      alert("Erreur: Élément PDF non trouvé");
      return;
    }

    // Show loading state
    const downloadBtn = document.querySelector('button[onClick="handleDownloadPdf"]');
    const originalText = downloadBtn?.textContent;
    if (downloadBtn) {
      downloadBtn.textContent = "⏳ Génération PDF...";
      downloadBtn.disabled = true;
    }

    try {
      // Debug instrument data
      console.log("=== INSTRUMENT DEBUGGING ===");
      console.log("Frais variable data:", fraisVariable);
      console.log("First row:", fraisVariable?.[0]);
      if (fraisVariable?.[0]) {
        const firstRow = fraisVariable[0];
        console.log("Type d'opération:", firstRow["Type d'opération"]);
        console.log("Type opération:", firstRow["Type opération"]);
      }
      console.log("===========================");

      // Force PDF mode for styling
      setPdfMode(true);

      // Create a new window for printing
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        alert("Erreur: Impossible d'ouvrir la fenêtre d'impression. Vérifiez les bloqueurs de popups.");
        return;
      }

      // Get the HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Facture</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .invoice-content {
              max-width: 100%;
              margin: 0 auto;
            }
            .btc-invoice-table {
              border-collapse: collapse;
              width: 100%;
              font-size: 14px;
              margin-bottom: 20px;
            }
            .btc-invoice-table th, .btc-invoice-table td {
              border: 1px solid #dee2e6;
              padding: 8px 12px;
              text-align: left;
            }
            .btc-invoice-table th {
              background: #222d32;
              color: #fff;
              font-weight: 700;
            }
            .btc-summary-table {
              width: 310px;
              margin-left: auto;
              margin-bottom: 20px;
            }
            .btc-summary-table td {
              border: none !important;
              padding: 4px 8px;
            }
            .btc-summary-table tr:last-child td {
              font-weight: 700;
              border-top: 2px solid #222d32 !important;
            }
            .text-end { text-align: right; }
            .fw-bold { font-weight: bold; }
            .invoice-table {
              font-size: 11px;
              border-collapse: collapse;
              width: 100%;
              margin-top: 20px;
            }
            .invoice-table th, .invoice-table td {
              border: 1px solid #dee2e6;
              padding: 4px 6px;
              text-align: left;
            }
            .invoice-table th {
              background: #f8f9fa;
              font-weight: 600;
              font-size: 10px;
            }
            /* Frais fixes table styling */
            .table.table-bordered.table-striped {
              border-collapse: collapse;
              width: 100%;
              max-width: 420px;
              margin-top: 20px;
              margin-bottom: 20px;
            }
            .table.table-bordered.table-striped th,
            .table.table-bordered.table-striped td {
              border: 1px solid #dee2e6;
              padding: 8px 12px;
              text-align: left;
            }
            .table.table-bordered.table-striped th {
              background: #f8f9fa;
              font-weight: 600;
              font-size: 12px;
              text-transform: none;
            }
            .table.table-bordered.table-striped .bg-light {
              background: #f8f9fa !important;
            }
            /* Frais fixes title styling */
            .text-primary {
              color: #0d6efd;
              font-size: 18px;
              font-weight: 700;
              margin-top: 25px;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            /* Bank block styling */
            .btc-bank-block {
              border: 2px solid #222d32;
              background: #f8f9fa;
              padding: 15px 20px;
              margin-top: 20px;
              font-size: 12px;
              line-height: 1.4;
            }
            .btc-bank-block b {
              font-size: 13px;
              color: #222d32;
            }
            /* Final amount styling */
            .mb-2 b {
              font-size: 14px;
              font-weight: 700;
              color: #222d32;
            }
            /* Column spacing */
            .col-md-8, .col-md-3 {
              padding: 0 15px;
            }
            /* Signature styling */
            .text-end {
              text-align: right;
            }
            .text-end b {
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 15px;
              display: block;
              color: #222d32;
            }
            .text-end img {
              margin-top: 0;
              max-width: 180px;
              height: auto;
              border: none;
            }
            .details-section {
              page-break-before: always !important;
              margin-top: 40px;
            }
            .pdf-page-root[style*="page-break-before"] {
              page-break-before: always !important;
            }
            .text-center { text-align: center; }
            .mt-4 { margin-top: 1.5rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-3 { margin-bottom: 1rem; }
            @media print {
              body {
                margin: 0;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .details-section {
                page-break-before: always !important;
                break-before: page !important;
              }
              .pdf-page-root {
                page-break-before: always !important;
                break-before: page !important;
              }
              /* Ensure frais fixes table looks good in print */
              .table.table-bordered.table-striped {
                border: 1px solid #000 !important;
              }
              .table.table-bordered.table-striped th,
              .table.table-bordered.table-striped td {
                border: 1px solid #000 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .table.table-bordered.table-striped th {
                background-color: #f8f9fa !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              /* Ensure signature text appears above image */
              .text-end {
                page-break-inside: avoid;
              }
              .text-end b {
                page-break-inside: avoid;
                margin-bottom: 10px !important;
                display: block;
              }
              .text-end img {
                page-break-inside: avoid;
                margin-top: 5px !important;
                max-width: 180px !important;
                height: auto !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-content">
            ${pdfRef.current.innerHTML}
          </div>
        </body>
        </html>
      `;

      // Write content to print window
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load
      printWindow.onload = () => {
        // Trigger print dialog
        printWindow.print();

        // Close window after printing
        setTimeout(() => {
          printWindow.close();
          console.log("✅ Print window opened successfully");
          alert("PDF généré avec succès! Utilisez la boîte de dialogue d'impression pour sauvegarder.");
        }, 1000);
      };

      console.log("✅ Print window created with styled content");

    } catch (err) {
      console.error("Print generation error:", err);
      alert("Erreur lors de la génération du PDF: " + err.message);
    } finally {
      // Restore UI state
      setPdfMode(false);

      // Restore button
      if (downloadBtn) {
        downloadBtn.textContent = originalText || "📄 Télécharger PDF";
        downloadBtn.disabled = false;
      }
    }
  };

  // ---------- Render ----------
  return (
    <Fragment>
      {/* Screen styles; PDF uses the live DOM so these apply too. */}
      <style>{`
        .btc-invoice-table {
          border-collapse: collapse;
          width: 100%;
          font-size: 14px;
          font-family: Arial, sans-serif;
        }
        .btc-invoice-table th, .btc-invoice-table td {
          border: 1px solid #dee2e6;
          padding: 8px 12px;
          text-align: left;
        }
        .btc-invoice-table th {
          background: #222d32;
          color: #fff;
          font-weight: 700;
          border-color: #222d32;
          font-size: 14px;
          text-align: center;
        }
        .btc-summary-table td {
          background: #f8f9fa;
          border: none !important;
          font-size: 14px;
        }
        .btc-summary-table tr:last-child td {
          font-weight: 700;
          font-size: 14px;
          color: #222d32;
          background: #e2e5ea;
          border-top: 2px solid #222d32 !important;
        }
        .btc-invoice-label {
          color: #222d32;
          font-weight: 700;
          font-size: 16px;
        }
        .btc-bank-block {
          border: 1px solid #222d32;
          background: #f8f9fa;
          padding: 12px 18px;
          margin-top: 14px;
          font-size: 13px;
        }
        .table tfoot td {
          border: none !important;
          background: transparent;
        }
        .table tfoot tr td {
          padding-top: 12px;
          font-weight: 700;
        }
        .table tfoot tr td:first-child {
          border-top: 2px solid #222d32;
          text-align: right;
        }
        .table tfoot tr td:nth-last-child(2) {
          border-top: 2px solid #222d32;
        }
        .table tfoot tr td:last-child {
          border-top: 2px solid #222d32;
          text-align: right;
          white-space: nowrap;
        }
        .invoice-table {
          font-size: 10px;
          font-family: Arial, sans-serif;
          border-collapse: collapse;
          width: 100%;
          table-layout: fixed;
        }
        .invoice-table th, .invoice-table td {
          border: 1px solid #dee2e6;
          padding: 4px 6px;
          text-align: left;
          vertical-align: middle;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .invoice-table th {
          background: #f8f9fa !important;
          font-weight: 600;
          font-size: 9px;
          text-align: center;
          border-bottom: 2px solid #dee2e6;
          color: #495057;
          padding: 6px 4px;
        }
        .invoice-table td {
          font-size: 9px;
          line-height: 1.2;
        }
        .invoice-table .text-end {
          text-align: right;
        }
        .table-responsive {
          overflow-x: visible !important;
          width: 100% !important;
          max-width: none !important;
        }
        .invoice-table td {
          white-space: normal;
          word-break: break-word;
          max-width: none;
          min-width: 40px;
        }
        /* Specific column widths for better layout */
        .invoice-table th:nth-child(1), .invoice-table td:nth-child(1) {
          width: 12%;
        }
        .invoice-table th:nth-child(2), .invoice-table td:nth-child(2) {
          width: 10%;
        }
        .invoice-table th:nth-child(3), .invoice-table td:nth-child(3) {
          width: 8%;
        }
        .invoice-table th:nth-child(4), .invoice-table td:nth-child(4) {
          width: 12%;
        }
        .invoice-table th:nth-child(5), .invoice-table td:nth-child(5) {
          width: 6%;
        }
        .invoice-table th:nth-child(6), .invoice-table td:nth-child(6) {
          width: 12%;
        }
        .invoice-table th:nth-child(7), .invoice-table td:nth-child(7) {
          width: 10%;
        }
        .invoice-table th:nth-child(8), .invoice-table td:nth-child(8) {
          width: 10%;
        }
        .invoice-table th:nth-child(9), .invoice-table td:nth-child(9) {
          width: 12%;
        }

        /* PDF mode: emulate A4 width and remove sliders to prevent crop */
        .pdf-page-root {
          background: #fff;
          margin: auto;
          padding: 28px;
          box-sizing: border-box;
          position: relative;
          max-width: 900px;
          font-family: Arial, sans-serif;
        }
        .pdf-mode .pdf-page-root {
          width: 794px;          /* 210mm @ 96 CSS dpi */
          max-width: 794px;
          padding: 36px 32px;
          box-shadow: none;
          font-family: Arial, sans-serif;
        }
        .pdf-mode .table-responsive {
          overflow-x: visible !important;
          width: 100% !important;
        }
        .pdf-mode .invoice-table th, .pdf-mode .invoice-table td {
          white-space: normal;
          max-width: none;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        .pdf-mode .invoice-table {
          table-layout: fixed;
          width: 100%;
        }
        .pdf-mode .btc-invoice-table {
          table-layout: auto;
          width: 100%;
        }
        /* Ensure consistent font rendering in PDF */
        .pdf-mode * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        /* Better text rendering for PDF */
        .pdf-mode .invoice-table td,
        .pdf-mode .btc-invoice-table td {
          line-height: 1.3;
          letter-spacing: 0.01em;
        }
        /* Ensure all table content is visible */
        .pdf-mode .table-responsive {
          overflow: visible !important;
          max-width: none !important;
          width: 100% !important;
        }
        .pdf-mode .invoice-table {
          margin: 0;
          border-spacing: 0;
        }
      `}</style>

      {/* Top bar (hidden in capture) */}
      <div
        className="d-print-none"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0" }}
      >
        <button className="btn btn-primary" onClick={() => navigate("/checkout")}>
          ← Retour
        </button>
        <button className="btn btn-primary" onClick={handleDownloadPdf}>
          📄 Télécharger PDF
        </button>
      </div>

      {/* Capture root */}
      <div ref={pdfRef} className={pdfMode ? "pdf-mode" : ""}>
        {/* PAGE 1 (visual preview = what gets rasterized) */}
        <div className="pdf-page-root">
          {/* Header */}
          <div className="row mb-4">
            <div style={{ marginBottom: 10 }}>
              <img src={logoText} width={150} style={{ marginBottom: 6 }} alt="Logo" />
            </div>
            <div className="col-sm-7">
              <div className="mt-2"><strong>Colombus Capital</strong></div>
              <div>Immeuble Aziz Appartement 3-1 Montplaisir, Tunis, 1000, Tunisie</div>
              <div>Email: contact@colombus-capital.com</div>
            </div>
            <div className="col-sm-5 text-end">
              <div><b>{client?.name}</b></div>
              <div>{client?.address}</div>
              <div>MF : {client?.matricule_fiscal}</div>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="btc-invoice-label">
                Facture N° {invoice?.invoice_number || invoice?.id} / {period?.year}
              </div>
              <div>
                Date: {creation_date ? new Date(creation_date).toLocaleDateString("fr-FR") : ""}
              </div>
              <div>Mois: {period?.month ? moisFr(period.month) : ""}</div>
            </div>
          </div>

          {/* Summary table */}
          <div className="table-responsive mb-3">
            <table className="btc-invoice-table" style={{ minWidth: 480 }}>
              <thead>
                <tr>
                  <th style={{ width: "70%" }}>Désignation</th>
                  <th>Honoraires</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    Service de conseil pour la gestion des transactions de marché d’un montant total de&nbsp;
                    <b>{getTotalTraded()} </b>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {fraisVariable && fraisVariable.length > 0
                      ? (() => {
                          const total = fraisVariable.reduce((sum, row) => {
                            const val = row["Commission CC ***"];
                            let num;
                            if (typeof val === "number") num = val;
                            else if (typeof val === "string") {
                              num = parseFloat(
                                val.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "")
                              );
                            } else num = 0;
                            return sum + (num || 0);
                          }, 0);
                          return total > 0
                            ? total.toLocaleString("fr-FR", {
                                minimumFractionDigits: 3,
                                maximumFractionDigits: 3,
                              }) + " TND"
                            : "-";
                        })()
                      : "-"}
                  </td>
                </tr>
                <tr>
                  <td>Frais mensuels pour {period?.month ? moisFr(period.month) : ""}</td>
                  <td style={{ textAlign: "right" }}>
                    {fraisFixe?.total
                      ? fraisFixe.total.toLocaleString("fr-FR", { minimumFractionDigits: 3 })
                      : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals / Summary */}
          <div className="d-flex justify-content-end mb-2">
            <table className="btc-summary-table" style={{ minWidth: 310 }}>
              <tbody>
                <tr>
                  <td>Total HT</td>
                  <td style={{ textAlign: "right" }}>{formatTND3(totals.total_ht)} TND</td>
                </tr>
                <tr>
                  <td>TVA</td>
                  <td style={{ textAlign: "right" }}>{formatTND3(totals.tva)} TND</td>
                </tr>
                <tr>
                  <td>Timbre fiscal</td>
                  <td style={{ textAlign: "right" }}>{totals?.stamp_duty?.toLocaleString("fr-FR") || ""} TND</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Total TTC</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {totals?.total_ttc?.toLocaleString("fr-FR") || ""} TND
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-2" style={{ fontSize: 13 }}>
            <b>Arrêté la présente facture à la somme de:</b> {montantEnMots}
          </div>

          <div className="row">
            <div className="col-md-8">
              <div className="btc-bank-block" style={{ width: 360 }}>
                <b>En cas de règlement par virement :</b><br />
                Titulaire : Colombus Capital<br />
                Banque : Attijari Bank<br />
                Domiciliation : Agence Mutuelle Ville<br />
                RIB : 0407616108861242182<br />
                IBAN: TN59 0407616108861242182
              </div>
            </div>
            {payload.signature && (
              <div className="col-md-3 text-end">
                <b>Signature et cachet</b>
                <img src={qrcode} alt="cachet" height={150} style={{ marginTop: 12 }} />
              </div>
            )}
          </div>
        </div>

        {/* PAGE 2 (details) */}
        <div className="pdf-page-root details-section" style={{ pageBreakBefore: "always", marginTop: 40 }}>
          <div ref={avoidBreakRef}>
            <h5 className="mb-1">Détail de la Facture</h5>
            <div className="mb-3 text-muted" style={{ fontSize: 15 }}>
              Cette section présente une répartition détaillée des transactions pour lesquelles la commission est appliquée.
            </div>
          </div>

          <h6 className="text-primary mb-2">Frais variables</h6>
          <div className="table-responsive mb-4">
            <table className="table invoice-table" id="detailsTable" ref={detailsTableRef}>
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th style={{ textAlign: "center" }}>
                    <div style={{ whiteSpace: "normal", lineHeight: 1.2 }}>Date<br />Transaction</div>
                  </th>
                  {invoice.payload?.needs_references && (
                    <th style={{ textAlign: "center" }}>Référence</th>
                  )}
                  <th style={{ textAlign: "center" }}>Type</th>
                  <th style={{ textAlign: "center" }}>Instrument</th>
                  <th style={{ textAlign: "center" }}>Devise</th>
                  <th style={{ textAlign: "center" }}>
                    <div style={{ whiteSpace: "normal", lineHeight: 1.2 }}>Montant<br />en devise</div>
                  </th>
                  <th style={{ textAlign: "center" }}>
                    <div style={{ whiteSpace: "normal", lineHeight: 1.2 }}>Taux<br />d’exécution</div>
                  </th>
                  <th style={{ textAlign: "center" }}>
                    <div style={{ whiteSpace: "normal", lineHeight: 1.2 }}>Commission<br />en %</div>
                  </th>
                  <th style={{ textAlign: "center" }}>
                    <div style={{ whiteSpace: "normal", lineHeight: 1.2 }}>Commission<br />en TND</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {fraisVariable.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row["Date Transaction"] || row["Date de Transaction"] || "—"}</td>
                    {invoice.payload?.needs_references && <td>{row["Référence"] || row["Reference"] || "—"}</td>}
                    <td>
                      {row.Type?.toLowerCase() === "buy"
                        ? "Import"
                        : row.Type?.toLowerCase() === "sell"
                        ? "Export"
                        : row.Type || "—"}
                    </td>
                    <td>{row["Type d'opération"] || row["Type opération"]}</td>
                    <td>{row.Devise || row["Devise"] || "—"}</td>
                    <td className="text-end">{formatDevise2(row.Montant || row["Montant en devise"] || 0)}</td>
                    <td className="text-end">{row["Taux d’exécution"] || row["Taux d'exécution"] || row["Taux"] || "—"}</td>
                    <td className="text-end">{row["Commission Percent"] || row["Commission %"] || row["Commission en %"] || "—"}</td>
                    <td className="text-end">{formatTND3(row["Commission CC ***"] || row["Commission TND"] || row["Commission en TND"] || 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  {invoice.payload?.needs_references ? (
                    <>
                      <td colSpan={5}></td>
                      <td className="text-end fw-bold">
                        {fraisVariable
                          .reduce((sum, row) => {
                            const montant = parseFloat(
                              ((row["Montant"] || row["Montant en devise"] || "0").toString().replace(/\s/g, "").replace(",", "."))
                            );
                            return sum + (isNaN(montant) ? 0 : montant);
                          }, 0)
                          .toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                      <td></td>
                      <td className="text-end fw-bold">
                        {fraisVariable
                          .reduce((sum, row) => {
                            const val = row["Commission CC ***"] || row["Commission TND"] || row["Commission en TND"] || row["Commission"];
                            const num =
                              typeof val === "number"
                                ? val
                                : parseFloat(
                                    (val || "0").toString().replace(" TND", "").replace(/\s/g, "").replace(",", ".")
                                  );
                            return sum + (isNaN(num) ? 0 : num);
                          }, 0)
                          .toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " TND"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td colSpan={4}></td>
                      <td className="text-end fw-bold">
                        {fraisVariable
                          .reduce((sum, row) => {
                            const montant = parseFloat(
                              ((row["Montant"] || row["Montant en devise"] || "0").toString().replace(/\s/g, "").replace(",", "."))
                            );
                            return sum + (isNaN(montant) ? 0 : montant);
                          }, 0)
                          .toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                      <td></td>
                      <td className="text-end fw-bold">
                        {fraisVariable
                          .reduce((sum, row) => {
                            const val = row["Commission CC ***"] || row["Commission TND"] || row["Commission en TND"] || row["Commission"];
                            const num =
                              typeof val === "number"
                                ? val
                                : parseFloat(
                                    (val || "0").toString().replace(" TND", "").replace(/\s/g, "").replace(",", ".")
                                  );
                            return sum + (isNaN(num) ? 0 : num);
                          }, 0)
                          .toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " TND"}
                      </td>
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>

          <h6 className="text-primary mt-4 mb-2">Frais fixes</h6>
          <div className="table-responsive" style={{ maxWidth: 420 }}>
            <table className="table table-bordered table-striped">
              <thead className="bg-light">
                <tr>
                  <th style={{ textTransform: "none" }}>Frais mensuel fixe</th>
                  <th style={{ textTransform: "none" }}>Nombre de mois à payer</th>
                  <th style={{ textTransform: "none" }}>Total dû</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-end">{fraisFixe.frais_mensuel}</td>
                  <td className="text-center">{fraisFixe.nb_mois}</td>
                  <td className="text-end">{fraisFixe.total}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-muted" style={{ fontSize: 13 }}>
            <i>* Spot / Terme / Option / Swap</i>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Invoice;
