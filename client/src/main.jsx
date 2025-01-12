import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import translationEN from './locales/en.json';
import translationDA from './locales/da.json';

i18next.init({
  interpolation: { escapeValue: false }, // React already does escaping
  lng: 'da', // default language
  resources: {
      en: { translation: translationEN },
      da: { translation: translationDA }
  }
});

// Creating the root and rendering the application
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <I18nextProvider i18n={i18next}>
            <App />
        </I18nextProvider>
    </React.StrictMode>
);