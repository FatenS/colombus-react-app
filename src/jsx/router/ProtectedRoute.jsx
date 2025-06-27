import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../store/selectors/AuthSelectors";
import { checkAutoLogin } from "../../services/AuthService";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const auth = useSelector(isAuthenticated);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAutoLogin(dispatch).finally(() => setChecking(false));
  }, [dispatch]);

  if (checking) return <div>Loading...</div>;
  return auth ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
