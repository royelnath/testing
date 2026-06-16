import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/shared/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DoctorsPage from './pages/DoctorsPage'
import DoctorDashboardPage from './pages/DoctorDashboardPage'
import PatientsPage from './pages/PatientsPage'
import PatientDetailPage from './pages/PatientDetailPage'
import PrescriptionsPage from './pages/PrescriptionsPage'
import NewPrescriptionPage from './pages/NewPrescriptionPage'
import PrescriptionDetailPage from './pages/PrescriptionDetailPage'
import TestReportsPage from './pages/TestReportsPage'
import TestsPage from './pages/TestsPage'

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="doctors" element={<PrivateRoute roles={['admin']}><DoctorsPage /></PrivateRoute>} />
        <Route path="doctor-dashboard" element={<PrivateRoute roles={['doctor']}><DoctorDashboardPage /></PrivateRoute>} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="prescriptions/new" element={<NewPrescriptionPage />} />
        <Route path="prescriptions/:id" element={<PrescriptionDetailPage />} />
        <Route path="/reports" element={<TestReportsPage />} />
        <Route path="tests" element={<TestsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
