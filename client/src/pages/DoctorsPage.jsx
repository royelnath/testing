import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Stethoscope, Phone, BadgeCheck, Building2, X } from 'lucide-react'

const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'ENT Specialist',
  'Gastroenterologist', 'Gynaecologist', 'Neurologist', 'Oncologist',
  'Ophthalmologist', 'Orthopaedist', 'Paediatrician', 'Psychiatrist',
  'Pulmonologist', 'Radiologist', 'Urologist', 'Pathologist', 'Other'
]

function DoctorModal({ doctor, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!doctor

  const [step, setStep] = useState(1)
  const [user, setUser] = useState({
    name: doctor?.user?.name || '',
    email: doctor?.user?.email || '',
    password: '',
    role: 'doctor',
  })
  const [profile, setProfile] = useState({
    specialization: doctor?.specialization || '',
    qualification: doctor?.qualification || '',
    registrationNumber: doctor?.registrationNumber || '',
    phone: doctor?.phone || '',
    clinic: {
      name: doctor?.clinic?.name || '',
      address: doctor?.clinic?.address || '',
      city: doctor?.clinic?.city || '',
      state: doctor?.clinic?.state || '',
      pincode: doctor?.clinic?.pincode || '',
    }
  })

  const createDoctor = useMutation({
    mutationFn: async () => {
      if (!isEdit) {
        const userRes = await api.post('/auth/register', user)
        const userId = userRes.data.user._id
        await api.post('/doctors', { ...profile, userId })
      } else {
        await api.put(`/doctors/${doctor._id}`, profile)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] })
      toast.success(isEdit ? 'Doctor updated!' : 'Doctor added!')
      onClose()
    },
    onError: e => toast.error(e.response?.data?.message || 'Error saving doctor'),
  })

  const fu = k => e => setUser(p => ({ ...p, [k]: e.target.value }))
  const fp = k => e => setProfile(p => ({ ...p, [k]: e.target.value }))
  const fc = k => e => setProfile(p => ({ ...p, clinic: { ...p.clinic, [k]: e.target.value } }))

  const canGoNext = user.name && user.email && (isEdit || user.password)
  const canSave = profile.specialization && profile.qualification && profile.registrationNumber && profile.phone

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Doctor' : 'Add New Doctor'}</h2>
            <div className="flex gap-2 mt-1">
              {[1, 2].map(s => (
                <div key={s} className={`h-1 w-12 rounded-full transition-colors ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 font-medium">Step 1: Account Details</p>
              <div>
                <label className="label">Full Name *</label>
                <input className="input" value={user.name} onChange={fu('name')} placeholder="Dr. Full Name" disabled={isEdit} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" value={user.email} onChange={fu('email')} placeholder="doctor@example.com" disabled={isEdit} />
              </div>
              {!isEdit && (
                <div>
                  <label className="label">Password *</label>
                  <input type="password" className="input" value={user.password} onChange={fu('password')} placeholder="Min. 6 characters" />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 font-medium">Step 2: Professional Profile</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Specialization *</label>
                  <select className="input" value={profile.specialization} onChange={fp('specialization')}>
                    <option value="">— Select —</option>
                    {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Qualification *</label>
                  <input className="input" value={profile.qualification} onChange={fp('qualification')} placeholder="MBBS, MD, etc." />
                </div>
                <div>
                  <label className="label">Registration No. *</label>
                  <input className="input" value={profile.registrationNumber} onChange={fp('registrationNumber')} placeholder="MCI number" />
                </div>
                <div className="col-span-2">
                  <label className="label">Phone *</label>
                  <input className="input" value={profile.phone} onChange={fp('phone')} placeholder="+91 XXXXX XXXXX" />
                </div>

                <div className="col-span-2 border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-600 mb-3">Clinic / Hospital</p>
                  <div className="space-y-3">
                    <input className="input" value={profile.clinic.name} onChange={fc('name')} placeholder="Clinic / Hospital Name" />
                    <input className="input" value={profile.clinic.address} onChange={fc('address')} placeholder="Street Address" />
                    <div className="grid grid-cols-3 gap-2">
                      <input className="input" value={profile.clinic.city} onChange={fc('city')} placeholder="City" />
                      <input className="input" value={profile.clinic.state} onChange={fc('state')} placeholder="State" />
                      <input className="input" value={profile.clinic.pincode} onChange={fc('pincode')} placeholder="PIN" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
              <button onClick={() => setStep(2)} disabled={!canGoNext} className="btn-primary flex-1 justify-center">
                Next →
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="btn-outline flex-1 justify-center">← Back</button>
              <button onClick={() => createDoctor.mutate()} disabled={!canSave || createDoctor.isPending}
                className="btn-primary flex-1 justify-center">
                {createDoctor.isPending ? 'Saving...' : isEdit ? 'Update Doctor' : 'Add Doctor'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DoctorsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.get('/doctors').then(r => r.data),
  })

  const deactivate = useMutation({
    mutationFn: id => api.delete(`/doctors/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); toast.success('Doctor deactivated') },
    onError: () => toast.error('Failed to deactivate'),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-500 text-sm mt-0.5">{doctors.length} registered doctors</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary">
          <Plus size={18} /> Add Doctor
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctors.map(doctor => (
            <div key={doctor._id} className="card p-0 overflow-hidden hover:shadow-md transition-shadow">
              {/* Card header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {doctor.user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">Dr. {doctor.user?.name}</div>
                  <div className="text-blue-200 text-xs truncate">{doctor.specialization}</div>
                  <div className="text-blue-300 text-xs font-mono">{doctor.doctorId}</div>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <BadgeCheck size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{doctor.qualification} · Reg: {doctor.registrationNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={15} className="text-green-500 flex-shrink-0" />
                  <span className="font-mono">{doctor.phone}</span>
                </div>
                {doctor.clinic?.name && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Building2 size={15} className="text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{doctor.clinic.name}{doctor.clinic.city ? `, ${doctor.clinic.city}` : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Stethoscope size={15} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate text-xs">{doctor.user?.email}</span>
                </div>
              </div>

              {/* Card footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => setModal(doctor)}
                  className="btn-outline py-1.5 px-3 text-xs">
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => { if (window.confirm(`Deactivate Dr. ${doctor.user?.name}?`)) deactivate.mutate(doctor._id) }}
                  className="btn py-1.5 px-3 text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                  <Trash2 size={13} /> Deactivate
                </button>
              </div>
            </div>
          ))}

          {doctors.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Stethoscope size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">No doctors yet</p>
              <p className="text-sm mt-1">Add your first doctor to get started</p>
            </div>
          )}
        </div>
      )}

      {modal && (
        <DoctorModal
          doctor={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
