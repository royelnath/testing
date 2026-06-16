import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'
import { ArrowLeft, User, Phone, Mail, MapPin, FileText, Plus, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function PatientDetailPage() {
  const { id } = useParams()

  const { data: patient, isLoading: pLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/patients/${id}`).then(r => r.data)
  })

  const { data: rxData } = useQuery({
    queryKey: ['patient-prescriptions', id],
    queryFn: () => api.get(`/prescriptions?patient=${id}&limit=20`).then(r => r.data)
  })

  if (pLoading) return <div className="p-8 text-center text-gray-400">Loading...</div>
  if (!patient) return <div className="p-8 text-center text-gray-500">Patient not found</div>

  const prescriptions = rxData?.prescriptions || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/patients" className="btn-outline py-1.5 px-3"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
          <p className="text-sm text-gray-500">{patient.patientId}</p>
        </div>
        <Link to={`/prescriptions/new?patient=${id}`} className="btn-primary ml-auto">
          <Plus size={16} /> New Prescription
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient info */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
              {patient.name[0]}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{patient.name}</h2>
              <p className="text-sm text-gray-500">{patient.age} years • {patient.gender}</p>
              <span className={`badge mt-1 ${patient.bloodGroup !== 'Unknown' ? 'badge-red' : 'badge-gray'}`}>{patient.bloodGroup}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100">
            {[
              { icon: Phone, label: patient.phone },
              { icon: Mail, label: patient.email || 'No email' },
              { icon: MapPin, label: patient.address || 'No address' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <Icon size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {patient.medicalHistory && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Medical History</div>
              <p className="text-sm text-gray-700">{patient.medicalHistory}</p>
            </div>
          )}
        </div>

        {/* Prescription history */}
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={18} /> Prescription History ({prescriptions.length})
          </h2>
          {prescriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No prescriptions yet</div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map(rx => (
                <Link key={rx._id} to={`/prescriptions/${rx._id}`}
                  className="block p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{rx.prescriptionId}</div>
                      <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                        <Calendar size={13} />
                        {format(new Date(rx.visitDate), 'dd MMM yyyy')}
                        {rx.doctor?.user?.name && ` · Dr. ${rx.doctor.user.name}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{rx.items?.length} test(s)</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">₹{rx.total?.toFixed(2)}</div>
                      <span className={`badge text-xs mt-1 ${rx.paymentStatus === 'Paid' ? 'badge-green' : rx.paymentStatus === 'Pending' ? 'badge-yellow' : 'badge-blue'}`}>
                        {rx.paymentStatus}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
