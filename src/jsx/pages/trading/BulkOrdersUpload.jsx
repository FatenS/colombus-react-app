import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { uploadOrderAction } from "../../../store/actions/OrderActions";

export default function BulkOrdersUpload() {
  const [file, setFile] = useState(null);
  const dispatch = useDispatch();

  const handleChange = (e) => setFile(e.target.files.item(0));

  const handleUpload = async () => {
    if (!file) {
      Swal.fire("Select a file first", "", "warning");
      return;
    }
    if (!/\.(xls|xlsx)$/i.test(file.name)) {
      Swal.fire("Invalid format", "Upload .xls or .xlsx files only", "error");
      return;
    }

    const data = new FormData();
    data.append("file", file);

    try {
      await dispatch(uploadOrderAction(data)); // <- thunk already exists
      Swal.fire("Upload complete", "Orders were imported", "success");
      setFile(null);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Upload failed, check console";
      console.error(err);
      Swal.fire("Upload failed", msg, "error");
    }
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label className="fw-semibold">Bulk-upload orders (Excel)</Form.Label>
      <div className="d-flex gap-2">
        <Form.Control
          type="file"
          accept=".xls,.xlsx"
          onChange={handleChange}
          style={{ maxWidth: "320px" }}
        />
        <Button variant="primary" onClick={handleUpload}>
          Upload
        </Button>
      </div>
      {file && <small className="text-muted">{file.name}</small>}
    </Form.Group>
  );
}
