import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Search, Users, Phone, Mail, Pencil, Eye, Trash2, X } from 'lucide-react'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown']

function PatientModal({ patient, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(patient || {
    name: '', age: '', gender: 'Male', phone: '', email: '',
    address: '', bloodGroup: 'Unknown', medicalHistory: ''
  })

  const mutation = useMutation({
    mutationFn: data => patient ? api.put(`/patients/${patient._id}`, data) : api.post('/patients', data),
    onSuccess: () => {
      qc.invalidateQueries(['patients'])
      toast.success(patient ? 'Patient updated!' : 'Patient registered!')
      onClose()
    },
    onError: err => toast.error(err.response?.data?.message || 'Error')
  })

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{patient ? 'Edit Patient' : 'Register New Patient'}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate({ ...form, age: parseInt(form.age) }) }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input name="name" className="input" value={form.name} onChange={handle} required placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Age *</label>
              <input name="age" type="number" min="0" max="150" className="input" value={form.age} onChange={handle} required />
            </div>
            <div>
              <label className="label">Gender *</label>
              <select name="gender" className="input" value={form.gender} onChange={handle}>
                {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Phone *</label>
              <input name="phone" className="input" value={form.phone} onChange={handle} required placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="label">Blood Group</label>
              <select name="bloodGroup" className="input" value={form.bloodGroup} onChange={handle}>
                {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input name="email" type="email" className="input" value={form.email} onChange={handle} placeholder="patient@email.com" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <textarea name="address" className="input resize-none" rows={2} value={form.address} onChange={handle} />
            </div>
            <div className="col-span-2">
              <label className="label">Medical History</label>
              <textarea name="medicalHistory" className="input resize-none" rows={2} value={form.medicalHistory} onChange={handle} placeholder="Diabetes, Hypertension..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Saving...' : patient ? 'Update' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PatientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: () => api.get(`/patients?search=${search}&page=${page}&limit=15`).then(r => r.data),
    keepPreviousData: true
  })

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/patients/${id}`),
    onSuccess: () => { qc.invalidateQueries(['patients']); toast.success('Patient deleted') }
  })

  const patients = data?.patients || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500">{data?.total || 0} registered patients</p>
        </div>
        <button onClick={() => setModal({ type: 'add' })} className="btn-primary">
          <Plus size={16} /> New Patient
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name, phone, or patient ID..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No patients found</p>
          </div>
        ) : (
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Age/Gender</th>
                <th>Contact</th>
                <th>Blood Group</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p._id}>
                  <td><span className="font-mono text-xs badge-gray">{p.patientId}</span></td>
                  <td>
                    <div className="font-medium text-gray-800">{p.name}</div>
                    {p.medicalHistory && <div className="text-xs text-gray-400 truncate max-w-[180px]">{p.medicalHistory}</div>}
                  </td>
                  <td className="text-gray-600">{p.age} yrs / {p.gender}</td>
                  <td>
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Phone size={12} />{p.phone}</div>
                    {p.email && <div className="flex items-center gap-1 text-xs text-gray-400"><Mail size={12} />{p.email}</div>}
                  </td>
                  <td>
                    <span className={`badge ${p.bloodGroup !== 'Unknown' ? 'badge-red' : 'badge-gray'}`}>{p.bloodGroup}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link to={`/patients/${p._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye size={15} />
                      </Link>
                      <button onClick={() => setModal({ type: 'edit', patient: p })}
                        className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => { if (confirm('Delete patient?')) deleteMut.mutate(p._id) }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {page} of {data.pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline py-1 px-3">Prev</button>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="btn-outline py-1 px-3">Next</button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <PatientModal patient={modal.type === 'edit' ? modal.patient : null} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
