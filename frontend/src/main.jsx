import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AppProvider } from './store/AppContext.jsx'
import { ThemeProvider } from './store/ThemeContext.jsx'
import { ToastProvider } from './store/ToastContext.jsx'

// Team Identifier
sessionStorage.setItem('teamName', 'NightOwls');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
