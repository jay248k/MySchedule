import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { store } from './redux/store'
import { queryClient } from './lib/queryClient'
import './index.css'
import App from './App.jsx'
import { purgeLegacyLocalStorage } from './utils/cookieUtils'

// Ensure browser localStorage is completely empty on boot
purgeLegacyLocalStorage();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
