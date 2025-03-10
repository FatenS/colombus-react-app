//AuthService
import axios from 'axios';
import Swal from "sweetalert2";
import { loginConfirmedAction, Logout } from '../store/actions/AuthActions';

// AuthService.js
export function signUp(email, password, options, rating, clientName)
{
    const postData = {
      email,
      password,
      options,
      rating,
      client_name: clientName,
    };
    return axios.post('http://localhost:5001/admin/signup', postData);
  }
  
// Login function to call backend /admin/signin route
export function login(email, password) {
    const postData = {
        email,
        password,
    };
    return axios.post('http://localhost:5001/admin/signin', postData);
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

// Store the token in local storage
export function saveTokenInLocalStorage(tokenDetails) {
    localStorage.setItem('accessToken', tokenDetails.access_token); // Save access_token from backend
    localStorage.setItem('userRoles', JSON.stringify(tokenDetails.roles));  // Save roles

}

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

export function checkAutoLogin(dispatch) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        // Don't do anything if no token, just let the user stay on landing page
        return;
    }

    // If token exists, confirm login
    dispatch(loginConfirmedAction({ access_token: token }));
}

export function runLogoutTimer(dispatch, timer, navigate) {
    setTimeout(() => {
        dispatch(Logout(navigate));
    }, timer);
}



