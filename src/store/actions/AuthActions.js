//AuthActions.js
import {
    formatError,
    login,
    signUp,
} from '../../services/AuthService';
import axiosInstance from '../../services/AxiosInstance';

export const NAVTOGGLE = 'NAVTOGGLE';

export const navtoggle = () => {
    return {
        type: NAVTOGGLE,
    };
};
// Action types
export const SIGNUP_CONFIRMED_ACTION = '[signup action] confirmed signup';
export const SIGNUP_FAILED_ACTION = '[signup action] failed signup';
export const LOGIN_CONFIRMED_ACTION = '[login action] confirmed login';
export const LOGIN_FAILED_ACTION = '[login action] failed login';
export const LOADING_TOGGLE_ACTION = '[Loading action] toggle loading';
export const LOGOUT_ACTION = '[Logout action] logout action';


export const logoutRequest = () => axiosInstance.post('/admin/logout');

export function logout(navigate) {
  return async (dispatch) => {
    try {
      await logoutRequest();
    } catch (err) {
      console.warn('Logout API failed:', err);
    } finally {
      dispatch({ type: LOGOUT_ACTION });
      navigate('/', { replace: true }); // <-- go to landing page after logout
    }
  };
}

// Signup action
export function signupAction(email, password, options, rating, clientName, navigate) {
    return (dispatch) => {
        signUp(email, password, options, rating, clientName)
            .then((response) => {
                dispatch(confirmedSignupAction(response.data));
             navigate('/login', { replace: true }); // ✅ ask the user to log in
            })
            .catch((error) => {
                const errorMessage = formatError(error);
                dispatch(signupFailedAction(errorMessage));
            });
    };
}

// Login action to handle the login process
export function loginAction(email, password, navigate) {
    return (dispatch) => {
        login(email, password)
            .then((response) => {
                dispatch(loginConfirmedAction(response.data)); // response contains roles
                const roles = response.data.roles || [];
                if (roles.includes("Admin")) {
                    navigate('/order'); // redirect admin to orders (futuretrading)
                } else {
                    navigate('/dashboard');
                }
            })
            .catch((error) => {
                const errorMessage = formatError(error);
                dispatch(loginFailedAction(errorMessage));
            });
    };
}



// Helper action creators
export function loginConfirmedAction(data) {
    return {
        type: LOGIN_CONFIRMED_ACTION,
        payload: data,
    };
}

export function loginFailedAction(message) {
    return {
        type: LOGIN_FAILED_ACTION,
        payload: message,
    };
}
export function confirmedSignupAction(payload) {
    return {
        type: SIGNUP_CONFIRMED_ACTION,
        payload,
    };
}

export function signupFailedAction(message) {
    return {
        type: SIGNUP_FAILED_ACTION,
        payload: message,
    };
}

export function loadingToggleAction(status) {
    return {
        type: LOADING_TOGGLE_ACTION,
        payload: status,
    };
}
