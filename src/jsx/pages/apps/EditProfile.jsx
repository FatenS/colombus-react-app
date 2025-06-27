// src/jsx/pages/account/EditProfile.jsx
import React, { useEffect, useState } from "react";
import { Link }      from "react-router-dom";
import axiosInstance from "../../../services/AxiosInstance";
import { IMAGES }    from "../../constant/theme";

export default function EditProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");

  /* ========== fetch once =================================================== */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get("/profile/me");
        setProfile(data);
      } catch (err) {
        console.error(err);
        setMsg("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ========== helpers ====================================================== */
  const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  /** returns a full URL no matter what the backend sent */
  const fullAvatarUrl = (url) =>
    !url
      ? IMAGES.tab1
      : url.startsWith("http")
        ? url
        : `${API_ROOT}${url}`;

  /* ========== change / save ================================================= */
  const handleChange = (e) =>
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setSaving(true);
      await axiosInstance.put("/profile/me", {
        client_name : profile.client_name,
        phone_number: profile.phone_number,
        address     : profile.address,
      });
      setMsg("Profile updated ✔");
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await axiosInstance.post("/profile/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      /* cache-bust & make absolute */
      setProfile((p) => ({
        ...p,
        avatar_url: fullAvatarUrl(`${data.avatar_url}?v=${Date.now()}`),
      }));
      setMsg("Avatar updated ✔");
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Avatar upload failed.");
    }
  };

  /* ========== render ======================================================= */
  if (loading)  return <div className="text-center mt-4">Loading…</div>;
  if (!profile) return <div className="text-danger">Profile unavailable.</div>;

  return (
    <>
      {msg && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          {msg}
          <button type="button" className="btn-close" onClick={() => setMsg("")} />
        </div>
      )}

      <div className="row">
        {/* ──────────── SIDEBAR ──────────── */}
        <div className="col-xl-3 col-lg-4">
          <div className="card card-bx profile-card author-profile mb-3">
            <div className="card-body pb-0 text-center">
              <div className="position-relative d-inline-block">
                <img
                  src={fullAvatarUrl(profile.avatar_url)}
                  alt="avatar"
                  className="rounded-circle"
                  style={{ width: 120, height: 120, objectFit: "cover" }}
                  onError={(e) => (e.currentTarget.src = IMAGES.tab1)}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                  onChange={handleAvatarUpload}
                  title="Upload new avatar"
                />
                <i className="fa fa-camera position-absolute bottom-0 end-0 bg-white rounded-circle p-1" />
              </div>

              <h5 className="mt-3 mb-1">{profile.client_name || "—"}</h5>

              <ul className="list-unstyled small mt-3 text-start d-inline-block">
                {profile.email && (
                  <li className="mb-1">
                    <i className="fa fa-envelope me-2" /> {profile.email}
                  </li>
                )}
                {profile.phone_number && (
                  <li className="mb-1">
                    <i className="fa fa-phone me-2" /> {profile.phone_number}
                  </li>
                )}
                {profile.address && (
                  <li className="mb-1">
                    <i className="fa fa-map-marker-alt me-2" /> {profile.address}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* ──────────── MAIN FORM ──────────── */}
        <div className="col-xl-9 col-lg-8">
          <div className="card profile-card card-bx">
            <div className="card-header">
              <h6 className="card-title mb-0">Account&nbsp;setup</h6>
            </div>

            <form onSubmit={handleSave}>
              <div className="card-body">
                <div className="row">
                  <div className="col-sm-6 mb-3">
                    <label className="form-label">Entity name</label>
                    <input
                      name="client_name"
                      className="form-control"
                      value={profile.client_name || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-sm-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      name="phone_number"
                      className="form-control"
                      value={profile.phone_number || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Address</label>
                    <input
                      name="address"
                      className="form-control"
                      value={profile.address || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="card-footer d-flex align-items-center">
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? "Saving…" : "UPDATE"}
                </button>
                <Link to="/forgot-password" className="btn-link ms-auto">
                  Forgot your password?
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
