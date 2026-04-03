import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { getSubdomain } from './hooks/usePortalBranding'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PortalLogin from './components/auth/PortalLogin'

const subdomain = getSubdomain()

export default function App() {
  // White-label portal subdomain — show branded login
  if (subdomain) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<PortalLogin slug={subdomain} />} />
        </Routes>
      </BrowserRouter>
    )
  }

  // Main site routes
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </BrowserRouter>
  )
}
