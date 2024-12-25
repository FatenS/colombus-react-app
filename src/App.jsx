import { lazy, Suspense, useEffect } from "react";
import Index from "./jsx/router/index";
import { connect, useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { checkAutoLogin } from "./services/AuthService";
import { isAuthenticated } from "./store/selectors/AuthSelectors";
import "rsuite/dist/rsuite-no-reset.min.css";
import "./assets/css/style.css";

const SignUp = lazy(() => import("./jsx/pages/authentication/Registration"));
const Login = lazy(() => import("./jsx/pages/authentication/Login"));

function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    let location = useLocation();
    let navigate = useNavigate();
    let params = useParams();
    return <Component {...props} router={{ location, navigate, params }} />;
  }
  return ComponentWithRouterProp;
}

function App(props) {
  const dispatch = useDispatch();

  useEffect(() => {
    checkAutoLogin(dispatch);
  }, [dispatch]);

  // Always show Index so that "/" route (LandingPage) is accessible.
  // If user is authenticated, Index routes will handle redirecting them to the dashboard.
  // If user is not authenticated, they will see landing page or navigate to login/register from there.
  return (
    <Suspense
      fallback={
        <div id="preloader">
          <div className="sk-three-bounce">
            <div className="sk-child sk-bounce1"></div>
            <div className="sk-child sk-bounce2"></div>
            <div className="sk-child sk-bounce3"></div>
          </div>
        </div>
      }
    >
      <Index />
    </Suspense>
  );
}

const mapStateToProps = (state) => {
  return {
    isAuthenticated: isAuthenticated(state),
  };
};

export default withRouter(connect(mapStateToProps)(App));
