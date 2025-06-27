import React, { useEffect, useState } from "react";
import axiosInstance from "../../../services/AxiosInstance"; 


export default function AddClientModal({ show, onClose, client, onSaved }) {
  const isEdit = !!client;
  const [fields, setFields] = useState({
    name: client?.client_name || "",
    address: client?.address || "",
    matricule_fiscal: client?.matricule_fiscal || "",
    fixed_monthly_fee: client?.fixed_monthly_fee || "",
    tva_exempt: !!client?.tva_exempt,
    uses_digital_sign: !!client?.uses_digital_sign,
    netting_enabled: !!client?.netting_enabled,
    needs_references: !!client?.needs_references,
    contract_start: client?.contract_start || "",
    parent_client: client?.parent_client || "", // only if you need it!
  });
  const [error, setError] = useState("");
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (!show) return;
    axiosInstance
      .get("/invoice/clients")
      .then(({ data }) => setClients(data))
      .catch(() => setClients([]));
  }, [show]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFields((f) => ({
      ...f,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value === "" ? "" : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isEdit) {
        await axiosInstance.put(`/invoice/clients/${client.id}/invoice-settings`, fields);
      } else {
        await axiosInstance.post("/invoice/clients", fields);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement");
    }
  };

  if (!show) return null;
  return (
    <div className="modal show d-block" style={{ background: "rgba(67, 53, 53, 0.3)" }}>
      <div className="modal-dialog">
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h5 className="modal-title">
              {isEdit ? "Modifier Client" : "Ajouter un Client"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
          <label htmlFor="name" className="form-label">Nom</label>
            <select
              className="form-control mb-2"
              name="parent_client"
              value={fields.parent_client || ""}
              onChange={handleChange}
            >
              <option value="">Aucun client </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.client_name}
                </option>
              ))}
            </select>
            
            <label htmlFor="name" className="form-label">Adresse</label>
            <input name="address" className="form-control mb-2" placeholder="Adresse" value={fields.address} onChange={handleChange} required />
            <label htmlFor="name" className="form-label">Date de début du contrat</label>
            <input
              name="contract_start"
              type="date"
              className="form-control mb-2"
              placeholder="Date de début du contrat"
              value={fields.contract_start}
              onChange={handleChange}
            />
            <label htmlFor="name" className="form-label">Matricule Fiscal</label>
            <input name="matricule_fiscal" className="form-control mb-2" placeholder="Matricule Fiscal" value={fields.matricule_fiscal} onChange={handleChange} required />
            <label htmlFor="name" className="form-label">Frais mensuel fixe</label>
            <input name="fixed_monthly_fee" type="number" className="form-control mb-2" placeholder="Frais mensuel fixe" value={fields.fixed_monthly_fee} onChange={handleChange} required />
            <label className="form-label">Paramètres de facturation</label>  
            <div className="form-check mb-2">
              <input type="checkbox" className="form-check-input" name="tva_exempt" checked={fields.tva_exempt} onChange={handleChange} id="tva_exempt"/>
              <label htmlFor="tva_exempt" className="form-check-label">Exonéré de TVA</label>
            </div>
            <div className="form-check mb-2">
              <input type="checkbox" className="form-check-input" name="uses_digital_sign" checked={fields.uses_digital_sign} onChange={handleChange} id="uses_digital_sign"/>
              <label htmlFor="uses_digital_sign" className="form-check-label">Signature numérique</label>
            </div>
            <div className="form-check mb-2">
              <input type="checkbox" className="form-check-input" name="netting_enabled" checked={fields.netting_enabled} onChange={handleChange} id="netting_enabled"/>
              <label htmlFor="netting_enabled" className="form-check-label">Netting activé</label>
            </div>
            <div className="form-check mb-2">
              <input type="checkbox" className="form-check-input" name="needs_references" checked={fields.needs_references} onChange={handleChange} id="needs_references"/>
              <label htmlFor="needs_references" className="form-check-label">Références transaction</label>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-success">Enregistrer</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}
