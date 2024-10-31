//AuthReducer 
import {
    LOADING_TOGGLE_ACTION,
    LOGIN_CONFIRMED_ACTION,
    LOGIN_FAILED_ACTION,
    LOGOUT_ACTION,
    SIGNUP_CONFIRMED_ACTION,
    SIGNUP_FAILED_ACTION,
} from '../actions/AuthActions';

const initialState = {
    auth: {
        email: '',
        idToken: '',
        localId: '',
        expiresIn: '',
        refreshToken: '',
        roles: [],  // Add roles to the initial state
    },
    errorMessage: '',
    successMessage: '',
    showLoading: false,
};

export function AuthReducer(state = initialState, action) {
    switch (action.type) {
        case SIGNUP_CONFIRMED_ACTION:
            return {
                ...state,
                auth: {
                    ...state.auth,
                    ...action.payload,  // Include all fields in the auth object
                    roles: action.payload.roles || [],  // Handle roles if present
                },
                errorMessage: '',
                successMessage: 'Signup Successfully Completed',
                showLoading: false,
            };

        case LOGIN_CONFIRMED_ACTION:
            return {
                ...state,
                auth: {
                    ...state.auth,
                    ...action.payload,  // Spread all the payload data into auth
                    roles: action.payload.roles || [],  // Handle roles from the login response
                },
                errorMessage: '',
                successMessage: 'Login Successfully Completed',
                showLoading: false,
            };

        case LOGOUT_ACTION:
            return {
                ...state,
                errorMessage: '',
                successMessage: '',
                auth: {
                    email: '',
                    idToken: '',
                    localId: '',
                    expiresIn: '',
                    refreshToken: '',
                    roles: [],  // Clear roles on logout
                },
            };

        case SIGNUP_FAILED_ACTION:
        case LOGIN_FAILED_ACTION:
            return {
                ...state,
                errorMessage: action.payload,
                successMessage: '',
                showLoading: false,
            };

        case LOADING_TOGGLE_ACTION:
            return {
                ...state,
                showLoading: action.payload,
            };

        default:
            return state;
    }
}
