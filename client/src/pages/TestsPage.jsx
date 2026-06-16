import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { Search, FlaskConical, Filter } from 'lucide-react'

const CATEGORIES = ['Haematology', 'Biochemistry', 'Microbiology', 'Immunology', 'Radiology', 'Pathology', 'Urine', 'Other']

export default function TestsPage() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['tests', catFilter, doctorFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (catFilter) params.set('category', catFilter)
      if (doctorFilter) params.set('doctor', doctorFilter)
      return api.get(`/tests?${params}`).then(r => r.data)
    }
  })

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.get('/doctors').then(r => r.data)
  })

  const filtered = tests.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.code || '').toLowerCase().includes(search.toLowerCase())
  )

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(t => t.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tests Directory</h1>
        <p className="text-sm text-gray-500">{filtered.length} tests available</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search tests by name or code..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <select className="input w-auto" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="input w-auto" value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}>
              <option value="">All Doctors</option>
              {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.user?.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-400">Loading tests...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <FlaskConical size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tests found</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="card p-0 overflow-hidden">
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
              <FlaskConical size={16} className="text-blue-500" />
              <span className="font-semibold text-blue-800">{cat}</span>
              <span className="badge-blue ml-auto">{items.length} tests</span>
            </div>
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Code</th>
                  <th>Doctor</th>
                  <th>Sample</th>
                  <th>Normal Range</th>
                  <th>Price (₹)</th>
                  <th>TAT</th>
                </tr>
              </thead>
              <tbody>
                {items.map(test => (
                  <tr key={test._id}>
                    <td>
                      <div className="font-medium text-gray-800">{test.name}</div>
                      {test.description && <div className="text-xs text-gray-400 truncate max-w-xs">{test.description}</div>}
                    </td>
                    <td><span className="font-mono text-xs badge-gray">{test.code || '—'}</span></td>
                    <td className="text-sm text-gray-600">Dr. {test.doctor?.user?.name || '—'}</td>
                    <td className="text-sm text-gray-600">{test.sampleType}</td>
                    <td className="text-sm text-gray-600">{test.normalRange ? `${test.normalRange} ${test.unit}` : '—'}</td>
                    <td>
                      {test.discountedPrice ? (
                        <div>
                          <div className="text-xs line-through text-gray-400">₹{test.price}</div>
                          <div className="font-semibold text-green-600">₹{test.discountedPrice}</div>
                        </div>
                      ) : (
                        <div className="font-semibold text-gray-800">₹{test.price}</div>
                      )}
                    </td>
                    <td className="text-xs text-gray-500">{test.turnaroundTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
