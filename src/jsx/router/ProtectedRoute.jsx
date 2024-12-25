// ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../store/selectors/AuthSelectors";
import { checkAutoLogin } from "../../services/AuthService";

const ProtectedRoute = ({ children }) => {
  const auth = useSelector(isAuthenticated);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Force a quick check for token in localStorage
    checkAutoLogin(/* dispatch from Redux store if needed */);
    // Wait one tick, then mark checking done
    setCheckingAuth(false);
  }, []);

  if (checkingAuth) {
    // Show spinner or blank screen while we check
    return <div>Loading...</div>;
  }

  return auth ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
