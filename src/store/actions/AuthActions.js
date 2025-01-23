//AuthActions.js
import {
    formatError,
    login,
    runLogoutTimer,
    saveTokenInLocalStorage,
    signUp,
} from '../../services/AuthService';
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

// Signup action
export function signupAction(email, password, options, rating, clientName, navigate) {
    return (dispatch) => {
        signUp(email, password, rating, clientName, options)
            .then((response) => {
                saveTokenInLocalStorage(response.data);
                runLogoutTimer(dispatch, response.data.expiresIn * 1000, navigate);
                dispatch(confirmedSignupAction(response.data));
                navigate('/dashboard');
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
                saveTokenInLocalStorage(response.data);  // Save the access token
                localStorage.setItem('userRoles', JSON.stringify(response.data.roles));  // Store roles in localStorage
                dispatch(loginConfirmedAction(response.data));  // Dispatch login success
                navigate('/dashboard');  // Redirect to dashboard on success
            })
            .catch((error) => {
                const errorMessage = formatError(error);  // Format and show error
                dispatch(loginFailedAction(errorMessage));  // Dispatch failure
            });
    };
}

// Logout action
export function Logout(navigate) {
    localStorage.removeItem('accessToken');  // Remove the token from local storage
    navigate('/login');  // Navigate to login
    return {
        type: LOGOUT_ACTION,
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
