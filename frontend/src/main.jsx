import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import './index.css'
import App from './App.jsx'
import { purgeLegacyLocalStorage } from './utils/cookieUtils'

// Ensure browser localStorage is completely empty on boot
purgeLegacyLocalStorage();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
