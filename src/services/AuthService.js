//AuthService
import axios from 'axios';
import Swal from "sweetalert2";
import { loginConfirmedAction, logout } from '../store/actions/AuthActions';
import axiosInstance from './AxiosInstance';

// AuthService.js
export function login(email, password) {
    return axiosInstance.post('/admin/signin', { email, password });
}

export function signUp(email, password, options, rating, clientName) {
    return axiosInstance.post('/admin/signup', { email, password, options, rating, client_name: clientName });
}

export function formatError(errorResponse) {
    const msg = errorResponse.response?.data?.msg;
    switch (msg) {
        case 'Invalid email or password':
            Swal.fire({
                icon: 'error',
                title: 'Oops',
                text: 'Invalid email or password',
            });
            break;
        default:
            Swal.fire({
                icon: 'error',
                title: 'Oops',
                text: 'An unknown error occurred',
            });
            break;
    }
}
export const logoutRequest = () => axiosInstance.post('/admin/logout');

// // Store the token in local storage
// export function saveTokenInLocalStorage(tokenDetails) {
//     localStorage.setItem('accessToken', tokenDetails.access_token); // Save access_token from backend
//     localStorage.setItem('userRoles', JSON.stringify(tokenDetails.roles));  // Save roles

// }

// Function to check and handle automatic login
// export function checkAutoLogin(dispatch, navigate) {
//     const token = localStorage.getItem('accessToken');
//     if (!token) {
//         dispatch(Logout(navigate)); // If no token, log out
//         return;
//     }

//     // Token is present, confirm login
//     dispatch(loginConfirmedAction({ access_token: token }));
// }

export async function checkAutoLogin(dispatch) {
    // Only check on protected routes
    const path = window.location.pathname;
    if (path === '/login' || path === '/page-register') {
      return; // Don't check auth here!
    }
    try {
      const { data } = await axiosInstance.get("/admin/me");
      dispatch(loginConfirmedAction(data));       // {email, roles}
    } catch {
      // not logged in – ignore
    }
  }
  
  

export function runLogoutTimer(dispatch, timer, navigate) {
    setTimeout(() => {
        dispatch(logout(navigate));
    }, timer);
}



