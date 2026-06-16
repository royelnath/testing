import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { Users, Stethoscope, FileText, FlaskConical, TrendingUp, Plus, ArrowRight, Clock } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, to }) {
  return (
    <Link to={to} className={`card hover:shadow-md transition-all group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
        <span>View all</span><ArrowRight size={12} />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  // Assuming user.role contains 'admin' or 'doctor'
  const isAdmin = user?.role === 'admin'
  const isDoctor = user?.role === 'doctor'

  // --- Conditional Data Fetching ---

  // Both Admins and Doctors see Patients
  const { data: patients } = useQuery({
    queryKey: ['patients-count'],
    queryFn: () => api.get('/patients?limit=1').then(r => r.data.total)
  })

  // Only Admin fetches total Doctor counts
  const { data: doctors } = useQuery({
    queryKey: ['doctors-count'],
    queryFn: () => api.get('/doctors').then(r => r.data.length),
    enabled: isAdmin // Disables execution if user is not an admin
  })

  // Admins see all recent prescriptions; Doctors see pending or their specific prescriptions
  // Adjust the API string query syntax to match what your backend expects
  const { data: rxData } = useQuery({
    queryKey: ['prescriptions-recent', user?.role],
    queryFn: () => {
      const endpoint = isAdmin
        ? '/prescriptions?limit=5'
        : '/prescriptions?status=Pending&limit=5' // Or filter by doctor id if needed
      return api.get(endpoint).then(r => r.data)
    }
  })

  // Both Admins and Doctors see Tests
  const { data: tests } = useQuery({
    queryKey: ['tests-count'],
    queryFn: () => api.get('/tests').then(r => r.data.length)
  })

  const recentRx = rxData?.prescriptions || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name}! ({user?.role})</p>
        </div>
        <Link to="/prescriptions/new" className="btn-primary">
          <Plus size={16} /> New Prescription
        </Link>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={patients} icon={Users} color="bg-blue-500" to="/patients" />

        {/* Only Admin sees the Doctor stat card */}
        {isAdmin && (
          <StatCard label="Doctors" value={doctors} icon={Stethoscope} color="bg-purple-500" to="/doctors" />
        )}

        <StatCard
          label={isAdmin ? "Prescriptions" : "Pending Prescriptions"}
          value={rxData?.total}
          icon={FileText}
          color="bg-emerald-500"
          to="/prescriptions"
        />
        <StatCard label="Tests Available" value={tests} icon={FlaskConical} color="bg-amber-500" to="/tests" />
      </div>

      {/* Recent prescriptions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={18} /> {isAdmin ? "Recent Prescriptions" : "Pending Prescriptions"}
            </h2>
            <Link to="/prescriptions" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentRx.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No prescriptions found</div>
          ) : (
            <div className="space-y-3">
              {recentRx.map(rx => (
                <Link key={rx._id} to={`/prescriptions/${rx._id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{rx.patient?.name}</div>
                    <div className="text-xs text-gray-500">{rx.prescriptionId} · Dr. {rx.doctor?.user?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-gray-900">₹{rx.total?.toFixed(2)}</div>
                    <span className={`badge text-xs ${rx.paymentStatus === 'Paid' ? 'badge-green' : 'badge-yellow'}`}>
                      {rx.paymentStatus}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={18} /> Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'New Prescription', to: '/prescriptions/new', color: 'bg-blue-600 text-white', show: true },
              { label: 'Add Patient', to: '/patients', color: 'bg-emerald-600 text-white', show: true },
              { label: 'Manage Tests', to: '/tests', color: 'bg-amber-500 text-white', show: true },
              { label: 'View Doctors', to: '/doctors', color: 'bg-purple-600 text-white', show: isAdmin }, // Hidden from doctor
            ]
              .filter(action => action.show) // Filters out actions based on authorization 
              .map(a => (
                <Link key={a.to} to={a.to}
                  className={`flex items-center justify-between p-3 rounded-lg ${a.color} font-medium text-sm hover:opacity-90 transition-opacity`}>
                  {a.label}
                  <ArrowRight size={16} />
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}