// Registration.jsx
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

function Register(props) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [rating, setRating] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    role: "",
    rating: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  function onSignUp(e) {
    e.preventDefault();
    let error = false;
    const errorObj = { email: "", password: "", role: "", rating: "" };

    if (email === "") {
      errorObj.email = "Email is Required";
      error = true;
    }
    if (password === "") {
      errorObj.password = "Password is Required";
      error = true;
    }
    if (roleId === "") {
      // Validate role
      errorObj.role = "Role is Required";
      error = true;
    }
    if (rating === "") {
      errorObj.rating = "Rating is Required"; // Validation for rating
      error = true;
    }

    setErrors(errorObj);
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Oops",
        text: Object.values(errorObj).join(", "), // Show all error messages
      });
      return;
    }

    dispatch(loadingToggleAction(true));
    dispatch(signupAction(email, password, roleId, rating, navigate)); // Pass rating to action
  }

  return (
    <div className="fix-wrapper">
      <div className="container ">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-6">
            <div className="card mb-0 h-auto">
              <div className="card-body">
                <div className="text-center mb-2">
                  <Link to="/login">
                    <img
                      src={logoFull}
                      alt=""
                      style={{ width: "200px", height: "200px" }}
                    />
                  </Link>
                </div>
                <h4 className="text-center mb-4 ">Sign up your account</h4>
                {props.errorMessage && (
                  <div className="text-danger">{props.errorMessage}</div>
                )}
                {props.successMessage && (
                  <div className="text-danger">{props.successMessage}</div>
                )}
                <form onSubmit={onSignUp}>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      className="form-control"
                      onChange={(e) => setRoleId(e.target.value)}
                    >
                      <option value="">Select Role</option>
                      {/* Add more roles as needed */}
                      <option value="1">Admin</option>
                      <option value="2">User</option>
                    </select>
                    {errors.role && (
                      <div className="text-danger">{errors.role}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control"
                      placeholder="email"
                    />
                    {errors.email && (
                      <div className="text-danger">{errors.email}</div>
                    )}
                  </div>
                  <div className="mb-4 position-relative">
                    <label className="form-label">Password</label>
                    <input
                      value={password}
                      className="form-control"
                      placeholder="password"
                      type={showPassword ? "text" : "password"}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      className={`show-pass eye ${
                        showPassword ? "active" : ""
                      }`}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className="fa fa-eye-slash" />
                      <i className="fa fa-eye" />
                    </span>
                    {errors.password && (
                      <div className="text-danger">{errors.password}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <input
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="form-control"
                      placeholder="Enter rating"
                    />
                    {errors.rating && (
                      <div className="text-danger">{errors.rating}</div>
                    )}
                  </div>
                  <div className="text-center mt-4">
                    <button type="submit" className="btn btn-primary btn-block">
                      Sign me up
                    </button>
                  </div>
                </form>
                <div className="new-account mt-3">
                  <p className="">
                    Already have an account?{" "}
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

const mapStateToProps = (state) => {
  return {
    errorMessage: state.auth.errorMessage,
    successMessage: state.auth.successMessage,
    showLoading: state.auth.showLoading,
  };
};

export default connect(mapStateToProps)(Register);
