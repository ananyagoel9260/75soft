import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { isConfigured } from './firebase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Feed from './pages/Feed'
import Squads from './pages/Squads'
import History from './pages/History'

function Spinner() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function SetupRequired() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">⚙️</div>
      <h1 className="text-2xl font-black text-white mb-2">Firebase Setup Required</h1>
      <p className="text-zinc-400 text-sm max-w-xs mb-6">
        Copy <code className="text-violet-400 bg-zinc-900 px-1 py-0.5 rounded">.env.example</code> to{' '}
        <code className="text-violet-400 bg-zinc-900 px-1 py-0.5 rounded">.env</code> and fill in your
        Firebase credentials, then restart the dev server.
      </p>
      <a
        href="https://console.firebase.google.com"
        target="_blank"
        rel="noreferrer"
        className="bg-violet-600 text-white font-bold px-5 py-3 rounded-xl text-sm hover:bg-violet-500 transition-colors"
      >
        Open Firebase Console →
      </a>
      <p className="text-zinc-600 text-xs mt-4">See SETUP.md for step-by-step instructions</p>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (!isConfigured) return <SetupRequired />
  if (loading) return <Spinner />

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#27272a',
            color: '#fff',
            border: '1px solid #3f3f46',
            borderRadius: '14px',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/squad"
          element={
            <ProtectedRoute>
              <Squads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
