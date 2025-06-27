import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import ThemeContext from "./context/ThemeContext";
import "./i18n";                 
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";       
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter basename='/'>
      <I18nextProvider i18n={i18n}>
          <ThemeContext>
           <App />
          </ThemeContext>
        </I18nextProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
