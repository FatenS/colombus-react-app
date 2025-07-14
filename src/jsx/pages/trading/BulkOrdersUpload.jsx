import React, { useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import axiosInstance from "../../../services/AxiosInstance";
import { fetchOrdersAction } from "../../../store/actions/OrderActions";

/* ---------- REST endpoints ---------- */
const ADMIN_UPLOAD_URL    = "/admin/upload-orders";
const ADMIN_TEMPLATE_URL  = "/admin/download-orders-template";

const CLIENT_UPLOAD_URL   = "/upload-orders";
const CLIENT_TEMPLATE_URL = "/download-orders-template";

export default function BulkOrdersUpload({ isAdmin, onSuccess = () => {} }) {
  /* -------- basic role check -------- */
  const dispatch = useDispatch();

  /* -------- component state --------- */
  const [clients, setClients]   = useState([]);
  const [clientId, setClientId] = useState("");
  const [file, setFile]         = useState(null);

  const [loadingClients, setLoadingClients] = useState(false);
  const [uploading, setUploading]           = useState(false);

  /* ------- load clients for admins ------- */
  useEffect(() => {
    if (!isAdmin) return;

    (async () => {
      setLoadingClients(true);
      try {
        const { data } = await axiosInstance.get("/admin/api/clients");
        setClients(data);
      } catch {
        Swal.fire("Error", "Unable to load client list.", "error");
      } finally {
        setLoadingClients(false);
      }
    })();
  }, [isAdmin]);

  /* ------ download template helper ----- */
  const downloadTemplate = async () => {
    const url  = isAdmin ? ADMIN_TEMPLATE_URL : CLIENT_TEMPLATE_URL;
    const name = isAdmin ? "OrdersTemplate_Admin.xlsx"
                         : "OrdersTemplate_Client.xlsx";
    try {
      const resp = await axiosInstance.get(url, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = name;
      link.click();
    } catch {
      Swal.fire("Error", "Could not download template.", "error");
    }
  };

  /* -------- upload handler ------------- */
  const handleUpload = async () => {
    if (!file || (isAdmin && !clientId)) {
      Swal.fire(
        "Missing information",
        isAdmin ? "Choose a client and select a file." : "Select a file.",
        "warning"
      );
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    if (isAdmin) fd.append("client_id", clientId);

    try {
      setUploading(true);
      const url = isAdmin ? ADMIN_UPLOAD_URL : CLIENT_UPLOAD_URL;
      await axiosInstance.post(url, fd);

      Swal.fire("Success", "Orders uploaded.", "success");
      dispatch(fetchOrdersAction(isAdmin));
     Swal.fire("Success", "Orders uploaded.", "success");
      onSuccess();    
      /* reset local UI */
      setFile(null);
      setClientId("");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Upload failed.";
      Swal.fire("Error", msg, "error");
    } finally {
      setUploading(false);
    }
  };

  /* ------------- UI ------------------- */
  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
      {/* ---- admin-only client dropdown ---- */}
      {isAdmin && (
        <Form.Select
          value={clientId}
          disabled={loadingClients}
          onChange={(e) => setClientId(e.target.value)}
          style={{ maxWidth: 260 }}
        >
          <option value="">— Select client —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.client_name}
            </option>
          ))}
        </Form.Select>
      )}

      {/* ---- file picker ---- */}
      <Form.Control
        type="file"
        accept=".xls,.xlsx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ maxWidth: 260 }}
      />

      {/* ---- upload button ---- */}
      <Button
        variant="primary"
        disabled={uploading}
        onClick={handleUpload}
      >
        {uploading ? (
          <>
            <Spinner animation="border" size="sm" className="me-1" />
            Uploading…
          </>
        ) : (
          "Upload Orders"
        )}
      </Button>

      {/* ---- universal template button ---- */}
      <Button variant="primary" onClick={downloadTemplate}>
       {isAdmin ? "Download Admin Template" : "Download Client Template"}
      </Button>
    </div>
  );
}
