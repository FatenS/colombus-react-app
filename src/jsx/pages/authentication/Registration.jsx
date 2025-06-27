import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { connect, useDispatch } from "react-redux";
import {
  loadingToggleAction,
  signupAction,
} from "../../../store/actions/AuthActions";

// image
import logoFull from "../../../assets/images/logo-full.svg";

// ➡ Password must have ≥8 chars, 1 upper, 1 lower, 1 digit
const PWD_RE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

function Register({ errorMessage, successMessage, showLoading }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    roleId: "",
    rating: "",
    clientName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.clientName.trim()) e.clientName = "Client name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.password.trim()) {
      e.password = "Password is required";
    } else if (!PWD_RE.test(form.password)) {
      e.password =
        "Password must be ≥8 chars and include uppercase, lowercase and a number.";
    }
    if (!form.roleId) e.role = "Role is required";
    if (!form.rating.trim()) e.rating = "Rating is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSignUp = (e) => {
    e.preventDefault();
    if (!validate()) {
      Swal.fire({
        icon: "error",
        title: "Oops",
        text: Object.values(errors).join(", "),
      });
      return;
    }
    dispatch(loadingToggleAction(true));
    dispatch(
      signupAction(
        form.email,
        form.password,
        form.roleId,
        form.rating,
        form.clientName,
        navigate
      )
    );
  };

  return (
    <div className="fix-wrapper">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-6">
            <div className="card mb-0 h-auto">
              <div className="card-body">
                <div className="text-center mb-2">
                  <Link to="/login">
                    <img src={logoFull} alt="logo" style={{ width: 200, height: 200 }} />
                  </Link>
                </div>
                <h4 className="text-center mb-4">Sign up your account</h4>

                {errorMessage && <div className="text-danger mb-2">{errorMessage}</div>}
                {successMessage && <div className="text-success mb-2">{successMessage}</div>}

                <form onSubmit={onSignUp} noValidate>
                  {/* Role */}
                  <div className="form-group mb-3">
                    <label className="form-label">Role</label>
                    <select
                      name="roleId"
                      className="form-control"
                      value={form.roleId}
                      onChange={handleChange}
                    >
                      <option value="">Select Role</option>
                      <option value="1">Admin</option>
                      <option value="2">User</option>
                    </select>
                    {errors.role && <div className="text-danger small">{errors.role}</div>}
                  </div>

                  {/* Client Name */}
                  <div className="form-group mb-3">
                    <label className="form-label">Client Name</label>
                    <input
                      name="clientName"
                      value={form.clientName}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Enter client name"
                    />
                    {errors.clientName && (
                      <div className="text-danger small">{errors.clientName}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="form-group mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="email@example.com"
                    />
                    {errors.email && <div className="text-danger small">{errors.email}</div>}
                  </div>

                  {/* Password */}
                  <div className="form-group mb-3">
                    <label className="form-label">Password</label>
                    <div className="position-relative">
                      <input
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="form-control pe-5"
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                      />
                      <span
                        className="position-absolute top-50 end-0 translate-middle-y me-3"
                        style={{ cursor: "pointer" }}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        <i className={`fa ${showPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
                      </span>
                    </div>
                    <small className="form-text text-muted">
                      At least 8 chars, incl. uppercase, lowercase &amp; number.
                    </small>
                    {errors.password && (
                      <div className="text-danger small mt-1">{errors.password}</div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="form-group mb-4">
                    <label className="form-label">Rating</label>
                    <input
                      name="rating"
                      value={form.rating}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Enter rating"
                    />
                    {errors.rating && <div className="text-danger small">{errors.rating}</div>}
                  </div>

                  {/* Submit */}
                  <div className="text-center">
                    <button type="submit" className="btn btn-primary btn-block" disabled={showLoading}>
                      {showLoading ? "Signing up..." : "Sign me up"}
                    </button>
                  </div>
                </form>

                <div className="new-account mt-3 text-center">
                  <p>
                    Already have an account?{' '}
                    <Link className="text-primary" to="/login">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state) => ({
  errorMessage: state.auth.errorMessage,
  successMessage: state.auth.successMessage,
  showLoading: state.auth.showLoading,
});

export default connect(mapStateToProps)(Register);
