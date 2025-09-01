import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../store/selectors/AuthSelectors";
import { checkAutoLogin } from "../../services/AuthService";

const AdminRoute = ({ children }) => {
  const dispatch = useDispatch();
  const auth = useSelector(isAuthenticated);
  const [checking, setChecking] = useState(true);
  
  // Get user roles from Redux state
  const { roles = [] } = useSelector((state) => state.auth.auth || {});
  const isAdmin = roles.includes("Admin");

  useEffect(() => {
    checkAutoLogin(dispatch).finally(() => setChecking(false));
  }, [dispatch]);

  if (checking) return <div>Loading...</div>;
  
  // Check if user is authenticated and has admin role
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default AdminRoute;



