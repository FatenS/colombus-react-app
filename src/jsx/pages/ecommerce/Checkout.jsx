import React, { Fragment, useEffect, useState } from "react";
import axios from "axios";
import AddClientModal from "./AddClientModal";
import { FaMoneyBill, FaCheckCircle, FaTimesCircle, FaPercent, FaReceipt, FaFileInvoice,   FaBalanceScale,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import axiosInstance from "../../../services/AxiosInstance"; 

const Checkout = () => {
  const { roles = [], name = "" } = useSelector((state) => state.auth.auth || {});
  const isAdmin = roles.includes("Admin");
  
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({ client: "", year: "", month: "" });
  const [showCreate, setShowCreate] = useState(false);
   const [showClientModal, setShowClientModal] = useState(false);
   const [editClient, setEditClient] = useState(null);
   const [clients, setClients] = useState([]);
   const formatTND3 = (val) =>
    Number((val || "0").toString().replace("TND", "").replace(/\s/g, "").replace(",", "."))
      .toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " TND";
  const [createFields, setCreateFields] = useState({
    client_name: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [error, setError] = useState("");

  const kpis = [
    { title: "Total Factures", value: summary.total_facture, unit: "TND", icon: <FaFileInvoice /> },
    { title: "Payées", value: summary.paid, unit: "TND", icon: <FaCheckCircle /> },
    { title: "Impayées", value: summary.unpaid, unit: "TND", icon: <FaTimesCircle /> },
    { title: "TVA", value: summary.total_tva, unit: "TND", icon:  <FaBalanceScale /> },
    { title: "HT", value: summary.total_ht, unit: "TND", icon: <FaMoneyBill /> },
    { title: "% Impayé", value: summary.unpaid_ratio_pct?.toFixed(1) || 0, unit: "%", icon: <FaPercent /> }
  ];
  
  /* ------------------------------------------------------------------ */
  /*                 FETCH  LIST  - Invoices (with filters)             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const params = new URLSearchParams();

    if (!isAdmin) params.append("client_name", name);
    else {
      if (filters.client) params.append("client_name", filters.client);
      if (filters.year)   params.append("year",        filters.year);
      if (filters.month)  params.append("month",       filters.month);
    }

    axiosInstance
      .get(`/invoice/invoices?${params.toString()}`)
      .then(({ data }) => setInvoices(data))
      .catch(() => setInvoices([]));
  }, [filters, showCreate, isAdmin, name]);
  

  /* ------------------------------------------------------------------ */
  /*                       FETCH  KPI  SUMMARY                          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.year)  params.append("year",  filters.year);
    if (filters.month) params.append("month", filters.month);

    axiosInstance
      .get(`/invoice/summary?${params.toString()}`)
      .then(({ data }) => setSummary(data))
      .catch(() => setSummary({}));
  }, [filters, showCreate]);


  /* ------------------------------------------------------------------ */
  /*                     FETCH  CLIENT  LIST  (admin)                   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!isAdmin) return;
    axiosInstance
      .get("/invoice/clients")
      .then(({ data }) => setClients(data))
      .catch(() => setClients([]));
  }, [showClientModal, isAdmin]);
  /* ------------------------------------------------------------------ */
  /*               CHANGE INVOICE STATUS  (draft → sent …)              */
  /* ------------------------------------------------------------------ */
  const handleStatusChange = async (invId, newStatus) => {
    try {
      await axiosInstance.patch(`/invoice/${invId}/status`, { status: newStatus });
      // refresh list
      const { data } = await axiosInstance.get("/invoice/invoices");
      setInvoices(data);
    } catch (err) {
      console.error(err);
      alert("Impossible de modifier le statut.");
    }
  };

   /* ------------------------------------------------------------------ */
  /*                       CREATE  NEW  INVOICE                         */
  /* ------------------------------------------------------------------ */
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await axiosInstance.post("/invoice/draft", createFields);
      setShowCreate(false);
      window.location = `/invoice/${data.invoice_id}`;
    } catch (err) {
      const msg = err.response?.data?.error || "";
      if (msg.toLowerCase().includes("already exists")) {
        setError("Une facture existe déjà pour ce client et cette période.");
      } else {
        setError(msg || "Erreur inconnue");
      }
    }
  };
  return (
    <Fragment>
      <div className="row">
        <div className="col-xl-12">
          <div className="card mt-3">
            <div className="card-body">
{/* KPI SUMMARY */}
              {isAdmin && (
 <div className="row g-3 mb-4">
  {kpis.map((card, idx) => (
    <div className="col-md-4" key={idx}>
      <div className="d-flex align-items-center p-3 shadow-sm rounded bg-white">
        <div
          className="me-3 d-flex align-items-center justify-content-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "#f1f3f5",
            fontSize: 18,
            color: "#007bff"
          }}
        >
          {card.icon}
        </div>
        <div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "#6c757d",
              textTransform: "uppercase"
            }}
          >
            {card.title}
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>
            {card.unit === "TND"
              ? formatTND3(card.value)
              : `${Number(card.value).toLocaleString("fr-FR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1
                })} %`}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

)}

             
{/* CLIENTS LIST (below filters, above invoice table) */}
{isAdmin && (           
<div className="row mb-4">
  <div className="col">
    <h5>Clients</h5>
    {/* <button
      className="btn btn-primary mb-2"
      onClick={() => {
        setEditClient(null);         // null means create mode (if you implement)
        setShowClientModal(true);
      }}
    >
      Ajouter un client
    </button> */}
    <table className="table table-striped">
      <thead>
      <tr>
         <th >Nom</th>
         <th >Actions</th>
      </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client.id}>
            <td>{client.client_name}</td>
          
            <td>
              <button
                className="btn btn-link"
                onClick={() => {
                  setEditClient(client);
                  setShowClientModal(true);
                }}
              >
                Modifier
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>)}
 {/* FILTERS + CREATE */}
 {isAdmin && (
 <div className="row mb-3">
 <p>Filters </p>
                <div className="col">
                  
              <input
                    placeholder="Client"
                    className="form-control d-inline w-auto me-2"
                    style={{ width: 150 }}
                    onChange={e => setFilters(f => ({ ...f, client: e.target.value }))}
                  />
                  <input
                    placeholder="Année"
                    type="number"
                    className="form-control d-inline w-auto me-2"
                    style={{ width: 100 }}
                    onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
                  />
                  <input
                    placeholder="Mois"
                    type="number"
                    className="form-control d-inline w-auto me-2"
                    style={{ width: 80 }}
                    onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
                  />
               
                  <button       className="btn btn-primary mb-2"
                   onClick={() => setShowCreate(true)}>
                    Créer une facture
                  </button>
                  
                </div>
              </div>)}
              {/* INVOICE LIST */}
              <h5>Factures</h5> <br />
              <div className="row">
                <div className="col">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>#</th>
                        {isAdmin && (
                        <th>Client</th>)}
                        <th>Période</th>
                        <th>Montant TTC</th>
                        <th>Status</th>
                
                        <th>Actions</th>    
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id}>
                          <td>{inv.id}</td>
                          {isAdmin && (
                          <td>{inv.client}</td>)}
                          <td>{inv.year}/{inv.month}</td>
                          <td>{formatTND3(inv.total_ttc)} </td>                          
                          <td>{inv.status}</td> 
                                                   <td>
  <div className="d-flex flex-column gap-1">
    <button
      className="btn btn-sm btn-outline-primary"
      onClick={() => window.location = `/invoice/${inv.id}`}
    >
      Voir
    </button>
    {isAdmin && inv.status === "draft" && (
      <button
        className="btn btn-sm btn-outline-warning"
        onClick={() => handleStatusChange(inv.id, "sent")}
      >
        Marquer comme envoyée
      </button>
    )}

    {isAdmin && inv.status === "sent" && (
        
          <button
        className="btn btn-sm btn-outline-success"
        onClick={() => handleStatusChange(inv.id, "paid")}
      >
        Marquer comme payée
      </button>
    )} 

    {isAdmin && inv.pdf_url && (
      <a
        className="btn btn-sm btn-outline-secondary"
        href={inv.pdf_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        PDF
      </a>
    )}
  </div>   
</td> 
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* CREATION MODAL */}
              {showCreate && (
                <div className="modal show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <form onSubmit={handleCreate}>
                        <div className="modal-header">
                          <h5 className="modal-title">Créer une facture</h5>
                          <button type="button" className="btn-close" onClick={() => setShowCreate(false)}></button>
                        </div>
                        <div className="modal-body">
                        <label htmlFor="name" className="form-label">client</label>
                        <select
                           className="form-control mb-2"
                           value={createFields.client_name}
                           onChange={e => setCreateFields(f => ({ ...f, client_name: e.target.value }))}
                           required
                           >
                           <option value="">Sélectionner un client</option>
                           {clients.map((client) => (
                              <option key={client.id} value={client.client_name}>
                                 {client.client_name}
                              </option>
                           ))}
                           </select>
                           <label htmlFor="name" className="form-label">Année</label>
                          <input className="form-control mb-2" type="number" placeholder="Année" value={createFields.year} onChange={e => setCreateFields(f => ({ ...f, year: e.target.value }))} required />
                          <label htmlFor="name" className="form-label">Mois</label>
                          <input className="form-control mb-2" type="number" placeholder="Mois" value={createFields.month} onChange={e => setCreateFields(f => ({ ...f, month: e.target.value }))} required />
                           <label htmlFor="name" className="form-label">Date de paiement</label>
                          <input
                                 type="date"
                                 className="form-control mb-2"
                                 value={createFields.creation_date || ""}
                                 onChange={e => setCreateFields(f => ({ ...f, creation_date: e.target.value }))}
                                 placeholder="Date de création (optionnel)"
                              />

                          {error && <div className="alert alert-danger">{error}</div>}
                        </div>
                        <div className="modal-footer">
                          <button type="submit" className="btn btn-success">Créer</button>
                          <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Annuler</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AddClientModal
  show={showClientModal}
  onClose={() => setShowClientModal(false)}
  client={editClient}  
  onSaved={() => {
    setShowClientModal(false);
  }}
/>

    </Fragment>
  );
};

export default Checkout;
