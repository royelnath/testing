import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, FlaskConical, IndianRupee, Tag, Search, Filter } from 'lucide-react'

const CATEGORIES = ['Haematology', 'Biochemistry', 'Microbiology', 'Immunology', 'Radiology', 'Pathology', 'Urine', 'Other']

function TestModal({ test, doctorId, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(test || {
    name: '', code: '', category: 'Other', price: '', discountedPrice: '',
    unit: '', normalRange: '', description: '', sampleType: 'Blood', turnaroundTime: '24 hours'
  })

  const mutation = useMutation({
    mutationFn: (data) => test
      ? api.put(`/tests/${test._id}`, data)
      : api.post('/tests', { ...data, doctor: doctorId }),
    onSuccess: () => {
      qc.invalidateQueries(['doctor-tests'])
      toast.success(test ? 'Test updated!' : 'Test added!')
      onClose()
    },
    onError: err => toast.error(err.response?.data?.message || 'Error')
  })

  const handle = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const submit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...form,
      price: parseFloat(form.price),
      discountedPrice: form.discountedPrice ? parseFloat(form.discountedPrice) : null
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{test ? 'Edit Test' : 'Add New Test'}</h2>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Test Name *</label>
              <input name="name" className="input" value={form.name} onChange={handle} required placeholder="e.g. Complete Blood Count" />
            </div>
            <div>
              <label className="label">Test Code</label>
              <input name="code" className="input" value={form.code} onChange={handle} placeholder="e.g. CBC" />
            </div>
            <div>
              <label className="label">Category</label>
              <select name="category" className="input" value={form.category} onChange={handle}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price (₹) *</label>
              <input name="price" type="number" min="0" step="0.01" className="input" value={form.price} onChange={handle} required placeholder="500" />
            </div>
            <div>
              <label className="label">Discounted Price (₹)</label>
              <input name="discountedPrice" type="number" min="0" step="0.01" className="input" value={form.discountedPrice || ''} onChange={handle} placeholder="Leave blank if no discount" />
            </div>
            <div>
              <label className="label">Sample Type</label>
              <input name="sampleType" className="input" value={form.sampleType} onChange={handle} placeholder="Blood" />
            </div>
            <div>
              <label className="label">Turnaround Time</label>
              <input name="turnaroundTime" className="input" value={form.turnaroundTime} onChange={handle} placeholder="24 hours" />
            </div>
            <div>
              <label className="label">Unit</label>
              <input name="unit" className="input" value={form.unit} onChange={handle} placeholder="mg/dL" />
            </div>
            <div>
              <label className="label">Normal Range</label>
              <input name="normalRange" className="input" value={form.normalRange} onChange={handle} placeholder="70-110" />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea name="description" className="input resize-none" rows={2} value={form.description} onChange={handle} placeholder="Brief description of the test..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Saving...' : test ? 'Update Test' : 'Add Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DoctorDashboardPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')

  const { data: doctorProfile } = useQuery({
    queryKey: ['my-doctor-profile'],
    queryFn: () => api.get(`/doctors/by-user/${user._id}`).then(r => r.data)
  })

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['doctor-tests', doctorProfile?._id],
    queryFn: () => api.get(`/tests?doctor=${doctorProfile._id}`).then(r => r.data),
    enabled: !!doctorProfile?._id
  })

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/tests/${id}`),
    onSuccess: () => { qc.invalidateQueries(['doctor-tests']); toast.success('Test removed') }
  })

  const filtered = tests.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || (t.code || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || t.category === catFilter
    return matchSearch && matchCat
  })

  const totalRevenue = tests.reduce((sum, t) => sum + (t.discountedPrice || t.price), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your tests and pricing</p>
        </div>
        <button onClick={() => setModal({ type: 'add' })} className="btn-primary">
          <Plus size={16} /> Add Test
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{tests.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total Tests</div>
        </div>
        {CATEGORIES.slice(0, 3).map(cat => (
          <div key={cat} className="card text-center">
            <div className="text-3xl font-bold text-purple-600">{tests.filter(t => t.category === cat).length}</div>
            <div className="text-sm text-gray-500 mt-1">{cat}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search tests by name or code..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select className="input w-auto" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tests table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">My Tests ({filtered.length})</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading tests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <FlaskConical size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tests found. Add your first test!</p>
          </div>
        ) : (
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Code</th>
                <th>Category</th>
                <th>Sample</th>
                <th>Price (₹)</th>
                <th>Disc. Price</th>
                <th>TAT</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(test => (
                <tr key={test._id}>
                  <td>
                    <div className="font-medium text-gray-800">{test.name}</div>
                    {test.normalRange && <div className="text-xs text-gray-400">Normal: {test.normalRange} {test.unit}</div>}
                  </td>
                  <td><span className="badge-gray font-mono text-xs">{test.code || '—'}</span></td>
                  <td><span className="badge-blue">{test.category}</span></td>
                  <td className="text-gray-600">{test.sampleType}</td>
                  <td className="font-semibold text-gray-800">₹{test.price}</td>
                  <td>
                    {test.discountedPrice
                      ? <span className="text-green-600 font-medium">₹{test.discountedPrice}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="text-gray-500 text-xs">{test.turnaroundTime}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setModal({ type: 'edit', test })}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => {
                        if (confirm('Remove this test?')) deleteMut.mutate(test._id)
                      }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Test modal */}
      {modal && (
        <TestModal
          test={modal.type === 'edit' ? modal.test : null}
          doctorId={doctorProfile?._id}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
