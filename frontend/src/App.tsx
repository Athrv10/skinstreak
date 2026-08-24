import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import PageTransition from './components/PageTransition'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ToastProvider } from './components/Toast'
import { AuthProvider } from './context/AuthContext'
import CalendarPage from './pages/Calendar'
import Checkin from './pages/Checkin'
import Dashboard from './pages/Dashboard'
import Journal from './pages/Journal'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Signup from './pages/Signup'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PageTransition>
                  <Login />
                </PageTransition>
              }
            />
            <Route
              path="/signup"
              element={
                <PageTransition>
                  <Signup />
                </PageTransition>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <CalendarPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkin"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Checkin />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Journal />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Profile />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

