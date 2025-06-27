import React, { Fragment, useEffect, useState, useRef } from "react";
import axiosInstance from "../../../services/AxiosInstance"; 
import qrcode from "../../../assets/images/signature.png";
import logoText from "../../../assets/images/CC_Original.png";
import logoWhite from "../../../assets/images/logo-white.png";
import { useParams, useNavigate } from "react-router-dom";
import n2words from 'n2words';
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";


const numberToWordsFr = (number) =>
  `${Number(number).toLocaleString("fr-FR", { minimumFractionDigits: 3 })} dinars`;
const moisFr = (month) =>
  [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ][month - 1];

const Invoice = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [pdfMode, setPdfMode] = useState(false);
  const pdfRef = useRef(null);

const handleDownloadPdf = async () => {
  setPdfMode(true);
  await new Promise((resolve) => setTimeout(resolve, 100));
  const pdf = new jsPDF("p", "mm", "a4"); // "p" for portrait, "l" for landscape
  const pages = pdfRef.current.querySelectorAll(".pdf-page");
  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  }
  pdf.save(`Facture_${invoice?.id || ""}.pdf`);
  setPdfMode(false);
};

const [statusLoading, setStatusLoading] = useState(false);
 
const formatTND3 = (value) =>
  Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
  const formatDevise2 = (val) =>
    Number((val || "0").toString().replace(/\s/g, "").replace(",", "."))
      .toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------- Fetch invoice ------------ */
useEffect(() => {
  if (!invoiceId) return;
  axiosInstance
    .get(`/invoice/${invoiceId}`)
    .then(({ data }) => setInvoice(data))
    .catch(() => setInvoice(null))
    .finally(() => setLoading(false));
}, [invoiceId]); 
/* ---------- Mark paid / confirm ------- */
const handleConfirm = async () => {
  const pdfUrl = prompt("URL du PDF");
  if (!pdfUrl) return;
  await axiosInstance.post(`/invoice/${invoiceId}/confirm`, { pdf_url: pdfUrl });
  window.location.reload();
};

const handleMarkPaid = async () => {
  await axiosInstance.patch(`/invoice/${invoiceId}/status`, { status: "paid" });
  window.location.reload();
};  
  

  if (loading) return <div>Chargement…</div>;
  if (!invoice) return <div>Facture introuvable</div>;

  // Data extraction
  const { payload, status, pdf_url, creation_date } = invoice;
  const client = payload?.client || {};
  const period = payload?.period || {};
  const fraisVariable = payload?.frais_variable || [];
  const fraisFixe = payload?.frais_fixe || {};
  const totals = payload?.totals || {};
  const totalTTC = totals?.total_ttc || 0;
  // Helper to clean and parse numbers from your data
  const cleanNumber = (numStr) =>
    parseFloat((numStr || "0").replace(/\s/g, '').replace(',', '.'));
  
const getTotalTraded = () => {
  // Find all unique currencies
  const currencies = [...new Set(fraisVariable.map(row => row["Devise"]))];

  if (currencies.length === 1) {
    // Only one currency, display as usual
    const currency = currencies[0];
    const total = fraisVariable.reduce(
      (sum, row) => sum + cleanNumber(row["Montant"]),
      0
    );
    return `${total.toLocaleString("fr-FR", {minimumFractionDigits: 3})} ${currency}`;
  } else {
    // Multiple currencies: sum in TND
    const totalTND = fraisVariable.reduce((sum, row) => {
      const montant = cleanNumber(row["Montant"]);
      const taux = cleanNumber(row["Taux d’exécution"] || row["Taux d'exécution"]);
      return sum + (montant * taux);
    }, 0);
    return `${totalTND.toLocaleString("fr-FR", {minimumFractionDigits: 3})} TND`;
  }
};
// NEW – replaces the line above
const montantEnMots = (() => {
  // always keep exactly three decimals (0-999 millimes)
  const [dinStr, milliStr] = Number(totalTTC).toFixed(3).split("."); // e.g. ["8686","068"]
  const dinars   = parseInt(dinStr, 10);
  const millimes = parseInt(milliStr, 10);

  const wordsDinars   = n2words(dinars,   { lang: "fr" });
  const wordsMillimes = n2words(millimes, { lang: "fr" });

  return millimes
    ? `${wordsDinars} dinars et ${wordsMillimes} millimes`
    : `${wordsDinars} dinars`;
})();

  return (
    <Fragment>
      {/* CSS for Table Design (inline for self-containedness) */}
      <style>{`
        .btc-invoice-table {
          border-collapse: collapse;
          width: 100%;
          font-size: 15px;
        }
        .btc-invoice-table th, .btc-invoice-table td {
          border: 1px solid #dee2e6;
          padding: 7px 12px;
        }
        .btc-invoice-table th {
          background: #222d32;
          color: #fff;
          font-weight: 700;
          border-color: #222d32;
          font-size: 15px;
        }
        .btc-invoice-table td {
          background: #fff;
        }
        .btc-invoice-table tbody tr:last-child td {
          border-bottom: 2px solid #222d32;
        }
        .btc-summary-table td {
          background: #f8f9fa;
          border: none !important;
          font-size: 15px;
        }
        .btc-summary-table tr:last-child td {
          font-weight: 700;
          font-size: 15px;
          color: #222d32;
          background: #e2e5ea;
          border-top: 2px solid #222d32 !important;
        }
        .btc-invoice-label {
          color: #222d32;
          font-weight: 700;
        }
        .btc-bank-block {
          border: 1px solid #222d32;
          background: #f8f9fa;
          padding: 12px 18px;
          margin-top: 14px;
        }
          /* add these to your component’s <style> */
.table tfoot td {
  border: none !important;               /* kill all inner borders */
  background: transparent;
}
.table tfoot tr td {
  padding-top: 12px;                     /* space above the line */
}
.table tfoot tr td:first-child {
  border-top: 2px solid #222d32;        /* full-width dark line */
  text-align: right;
}
.table tfoot tr td:nth-last-child(2) {
  border-top: 2px solid #222d32;        /* above the Montant total */
}
.table tfoot tr td:last-child {
  border-top: 2px solid #222d32;        /* above the Commission total */
  text-align: right;
  white-space: nowrap;
}


      `}</style>
    
        <>
        {/* just below your <Fragment> or inside the first <div> */}
<div
  className="d-print-none"
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "16px 0"
  }}
>
  {/* “Retour à la liste” on the left */}
  <button
   className="btn btn-primary"
    onClick={() => navigate("/checkout")}
  >
    ← Retour
  </button>

  {/* “Télécharger PDF” on the right */}
  <button
    className="btn btn-primary"
    onClick={handleDownloadPdf}
  >
    📄 Télécharger PDF
  </button>
</div>

        <div ref={pdfRef}>
        <div className="pdf-page"
          style={{
            background: "#fff",
            maxWidth: pdfMode ? "794px" : "900px",
            width: pdfMode ? "794px" : "100%",
            height: pdfMode ? "1123px" : "auto",
            margin: pdfMode ? "0" : "auto",
            boxShadow: pdfMode ? "none" : "0 0 8px #eee",
            padding: pdfMode ? "40px 36px" : 28,
            boxSizing: "border-box",
            position: "relative",
          }}
        >
      {/* PAGE 1 */}
      <div style={{ background: "#fff", maxWidth: 900, margin: "auto",  padding: 28 }}>
        {/* Header */}
        <div className="row mb-4">
        <div style={{ marginBottom: 10 }}>
              <img src={logoText} width={150} style={{ marginBottom: 6 }} alt="Logo" />
              {/* In your header */}
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
              Facture N° {invoice?.id} / {period?.year}
            </div>
            <div>
              Date: {creation_date ? new Date(creation_date).toLocaleDateString("fr-FR") : ""}
            </div>
            <div>
              Mois: {period?.month ? moisFr(period.month) : ""}
            </div>
          </div>
        
        </div>

        <div className="table-responsive mb-3">
  <table className="btc-invoice-table" style={{minWidth: 480}}>
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
        <td style={{textAlign: "right"}}>
          {
            // Sum all commission TND for the month
            fraisVariable && fraisVariable.length > 0
              ? (
                (() => {
                  const total = fraisVariable.reduce((sum, row) => {
                    const val = row["Commission CC ***"];
                    let num;
                
                    if (typeof val === "number") {
                      num = val; // ✅ already a number, use directly
                    } else if (typeof val === "string") {
                      num = parseFloat(
                        val.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '')
                      );
                    } else {
                      num = 0;
                    }
                
                    return sum + (num || 0);
                  }, 0);
                
                  return total > 0
                    ? total.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " TND"
                    : "-";
                })()
                
              )
              : "-"
          }
        </td>
      </tr>
      <tr>
        <td>Frais mensuels pour {period?.month ? moisFr(period.month) : ""}</td>
        <td style={{textAlign: "right"}}>{fraisFixe?.total ? fraisFixe.total.toLocaleString("fr-FR", {minimumFractionDigits: 3}) : "-"}</td>
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
                <td style={{ textAlign: "right" }}>
                {formatTND3(totals.total_ht)} TND
                </td>
              </tr>
              <tr>
                <td>TVA</td>
                <td style={{ textAlign: "right" }}>
                {formatTND3(totals.tva)} TND
                </td>
              </tr>
              <tr>
                <td>Timbre fiscal</td>
                <td style={{ textAlign: "right" }}>{totals?.stamp_duty?.toLocaleString("fr-FR") || ""} TND</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Total TTC</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{totals?.total_ttc?.toLocaleString("fr-FR") || ""} TND</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-2" style={{ fontSize: 13}}>
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

        {/* Actions */}
        {/* <div className="mt-3 d-print-none">
          {status === "draft" && (
            <button className="btn btn-warning" onClick={handleConfirm} disabled={confirming}>
              Confirmer & verrouiller
            </button>
          )}
          {status === "sent" && (
            <button className="btn btn-success" onClick={handleMarkPaid} disabled={statusLoading}>
              Marquer comme payée
            </button>
          )}
          {pdf_url && <a href={pdf_url} className="btn btn-link ms-3" target="_blank" rel="noopener noreferrer">Voir PDF</a>}
        </div> */}
      </div>
      </div>
      <div className="pdf-page" style={{ pageBreakBefore: "always", marginTop: 40 }}>

      {/* PAGE BREAK */}
      <div style={{ pageBreakBefore: "always", marginTop: 40 }}></div>

      {/* PAGE 2: Details */}
      {/* PAGE 2: Details (Styled with Bootstrap) */}
      
      <div className="container my-4">
  <div className="card shadow" style={{maxWidth: 900, margin: "auto"}}>
    <div className="card-body" style={{padding: 28}}>

      <h5 className="mb-0">Détail de la Facture</h5>
    </div>
    <div className="card-body">
      <div className="mb-3 text-muted" style={{ fontSize: 15 }}>
        Cette section présente une répartition détaillée des transactions pour lesquelles la commission est appliquée.
      </div>
      <h6 className="text-primary mb-2">Frais variables</h6>
      <div className="table-responsive mb-4">
  <table className="table">
  <thead style={{ background: "#f8f9fa" }}>
  <tr>
    <th style={{ textAlign: "center" }}>
      <div style={{ whiteSpace: "normal", lineHeight: 1.2 , textTransform: "none"}}>
        Date<br/>Transaction
      </div>
    </th>
    {invoice.payload?.needs_references && (
      <th style={{ textAlign: "center",  textTransform: "none" }}>Référence</th>
    )}
    <th style={{ textAlign: "center" }}>
      <div style={{ whiteSpace: "normal", lineHeight: 1.2  , textTransform: "none"}}>
        Type
      </div>
    </th>
    <th style={{ textAlign: "center" }}>
      <div style={{ whiteSpace: "normal", lineHeight: 1.2  , textTransform: "none" }}>
        Instrument
      </div>
    </th>
    <th style={{ textAlign: "center"  , textTransform: "none" }}>Devise</th>
    <th style={{ textAlign: "center"  , textTransform: "none"}}>
      <div style={{ whiteSpace: "normal", lineHeight: 1.2  , textTransform: "none"}}>
        Montant<br/>en devise
      </div>
    </th>
    <th style={{ textAlign: "center"  }}>
      <div style={{ whiteSpace: "normal", lineHeight: 1.2  , textTransform: "none"}}>
        Taux<br/>d’exécution
      </div>
    </th>
    <th style={{ textAlign: "center" }}>
      <div style={{ whiteSpace: "normal", lineHeight: 1.2  , textTransform: "none"}}>
        Commission<br/>en %
      </div>
    </th>
    <th style={{ textAlign: "center" }}>
      <div style={{ whiteSpace: "normal", lineHeight: 1.2 , textTransform: "none" }}>
        Commission<br/>en TND
      </div>
    </th>
  </tr>
</thead>


    <tbody>
      {fraisVariable.map((row, idx) => (
        <tr key={idx}>
          <td>{row["Date Transaction"] || row["Date de Transaction"]}</td>
          {invoice.payload?.needs_references && <td>{row["Référence"]}</td>}
          <td>
            {row.Type?.toLowerCase() === "buy" ? "Import"
              : row.Type?.toLowerCase() === "sell" ? "Export"
              : row.Type}
          </td>
          <td>{row["Type d’opération"] || row["Type opération"]}</td>
          <td>{row.Devise}</td>
          <td className="text-end">{formatDevise2(row.Montant)}</td>
          <td className="text-end">{row["Taux d’exécution"]}</td>
          <td className="text-end">{row["Commission Percent"]}</td>
          <td className="text-end">{formatTND3(row["Commission CC ***"])}</td>

        </tr>
      ))}
    </tbody>
    
<tfoot>
  <tr>
    {/* Skip to the "Montant en devise" column */}
    {invoice.payload?.needs_references ? (
      <>
        <td colSpan={5}></td>
        <td className="text-end fw-bold">
          {
            fraisVariable.reduce((sum, row) => {
              const montant = parseFloat((row["Montant"] || "0").replace(/\s/g, "").replace(",", "."));
              return sum + (isNaN(montant) ? 0 : montant);
            }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        </td>
        <td></td>
        <td></td>
        <td className="text-end fw-bold">
          {
            fraisVariable.reduce((sum, row) => {
              const val = row["Commission CC ***"];
              const num = typeof val === "number" ? val
                        : parseFloat(val.replace(" TND", "").replace(/\s/g, "").replace(",", "."));
              return sum + (isNaN(num) ? 0 : num);
            }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " TND"
          }
        </td>
      </>
    ) : (
      <>
        <td colSpan={4}></td>
        <td className="text-end fw-bold">
          {
            fraisVariable.reduce((sum, row) => {
              const montant = parseFloat((row["Montant"] || "0").replace(/\s/g, "").replace(",", "."));
              return sum + (isNaN(montant) ? 0 : montant);
            }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        </td>
        <td></td>
        <td></td>
        <td className="text-end fw-bold">
          {
            fraisVariable.reduce((sum, row) => {
              const val = row["Commission CC ***"];
              const num = typeof val === "number" ? val
                        : parseFloat(val.replace(" TND", "").replace(/\s/g, "").replace(",", "."));
              return sum + (isNaN(num) ? 0 : num);
            }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " TND"
          }
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
              <th style= {{ textTransform: "none" }} >Frais mensuel fixe</th>
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
</div>
  </div>
  </div>
</>
    </Fragment>
  );
};

export default Invoice;
