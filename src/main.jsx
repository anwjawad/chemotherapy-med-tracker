import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('%cMedTracker\n%cProduced by Jawad A. Sabha', 'color:#0d9488;font-size:14px;font-weight:700', 'color:#64748b;font-size:11px')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
