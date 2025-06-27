import React, { useState } from "react";
import { connect, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  loadingToggleAction,
  loginAction,
} from "../../../store/actions/AuthActions";
import { IMAGES } from "../../constant/theme";
// image
import logoFull from "../../../assets/images/logo-full.svg";

function Login(props) {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  let errorsObj = { email: "", password: "" };
  const [errors, setErrors] = useState(errorsObj);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle login
  function onLogin(e) {
    e.preventDefault();
    let error = false;
    const errorObj = { ...errorsObj };

    // Validation
    if (email === "") {
      errorObj.email = "Email is Required";
      error = true;
    }
    if (password === "") {
      errorObj.password = "Password is Required";
      error = true;
    }
    setErrors(errorObj);
    if (error) {
      return;
    }

    // Dispatch loading and login action
    dispatch(loadingToggleAction(true));
    dispatch(loginAction(email, password, navigate));
  }

  return (
    <>
      <div className="authincation d-flex flex-column flex-lg-row flex-column-fluid">
        <div className="login-aside text-center  d-flex flex-column flex-row-auto">
          <div className="d-flex flex-column-auto flex-column pt-lg-40 pt-15">
            <div className="text-center mb-lg-4 mb-2 pt-5 logo">
              {/* <img src={IMAGES.LogoWhite} alt="" /> */}
            </div>
            <h3 className="mb-2 text-white">Welcome back!</h3>
            <p className="mb-4">
              Streamline each step of your FX workflow
              <br />
            </p>
          </div>
          <div
            className="aside-image position-relative"
            style={{ backgroundImage: `url(${IMAGES.BgPic2})` }}
          >
            <img className="img1 move-1" src={IMAGES.BgPic3} alt="" />
            <img className="img2 move-2" src={IMAGES.BgPic4} alt="" />
            <img className="img3 move-3" src={IMAGES.BgPic5} alt="" />
          </div>
        </div>
        <div className="container flex-row-fluid d-flex flex-column justify-content-center position-relative overflow-hidden p-7 mx-auto">
          <div className="d-flex justify-content-center h-100 align-items-center">
            <div className="authincation-content style-2">
              <div className="row no-gutters">
                <div className="col-xl-12 tab-content">
                  <div
                    id="sign-uinp"
                    className="auth-form tab-pane fade show active form-validation"
                  >
                    <form onSubmit={onLogin}>
                      <div className="text-center mb-4">
                        <h3 className="text-center mb-2 text-dark">Sign In</h3>
                      </div>
                      <div className="sepertor">
                        <span className="d-block mb-4 fs-13">
                          Fill form below
                        </span>
                      </div>
                      {props.errorMessage && (
                        <div className="text-danger p-1 my-2">
                          {props.errorMessage}
                        </div>
                      )}
                      {props.successMessage && (
                        <div className="text-success p-1 my-2">
                          {props.successMessage}
                        </div>
                      )}
                      <div className="mb-3">
                        <label
                          htmlFor="exampleFormControlInput1"
                          className="form-label required"
                        >
                          Email address
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Type Your Email Address"
                        />
                        {errors.email && (
                          <div className="text-danger fs-12">
                            {errors.email}
                          </div>
                        )}
                      </div>
                      <div className="mb-3 position-relative">
                        <label className="form-label required">Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={password}
                          placeholder="Type Your Password"
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        {errors.password && (
                          <div className="text-danger fs-12">
                            {errors.password}
                          </div>
                        )}
                      </div>
                      <button className="btn btn-block btn-primary">
                        Sign In
                      </button>
                    </form>
                    <div className="new-account mt-3 text-center">
                      <p className="font-w500">
                        Create an account?{" "}
                        <Link className="text-primary" to="/page-register">
                          Sign Up
                        </Link>
                                              </p>
                      
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-end mb-3">
  <Link to="/forgot-password" className="text-primary">Forgot password?</Link>
</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Connect to Redux state
const mapStateToProps = (state) => {
  return {
    errorMessage: state.auth.errorMessage,
    successMessage: state.auth.successMessage,
    showLoading: state.auth.showLoading,
  };
};

export default connect(mapStateToProps)(Login);
