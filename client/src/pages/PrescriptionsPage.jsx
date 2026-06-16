import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { Plus, Search, FileText, Eye, Filter } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS = {
  Paid: 'bg-green-100 text-green-700',
  Pending: 'bg-amber-100 text-amber-700',
  Partial: 'bg-blue-100 text-blue-700',
}

export default function PrescriptionsPage() {
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', page, paymentFilter],
    queryFn: () =>
      api.get(`/prescriptions?page=${page}&limit=15${paymentFilter ? `&paymentStatus=${paymentFilter}` : ''}`).then(r => r.data),
  })

  const prescriptions = data?.prescriptions || []
  const filtered = search
    ? prescriptions.filter(rx =>
        rx.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        rx.prescriptionId?.toLowerCase().includes(search.toLowerCase()) ||
        rx.patient?.patientId?.toLowerCase().includes(search.toLowerCase())
      )
    : prescriptions

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-500 text-sm mt-0.5">{data?.total || 0} total prescriptions</p>
        </div>
        <Link to="/prescriptions/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
          <Plus size={18} /> New Prescription
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient name or Rx ID..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select
          value={paymentFilter}
          onChange={e => { setPaymentFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Payments</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Rx ID', 'Patient', 'Doctor', 'Date', 'Tests', 'Total', 'Payment', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(rx => (
                    <tr key={rx._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{rx.prescriptionId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{rx.patient?.name}</div>
                        <div className="text-xs text-gray-400">{rx.patient?.patientId}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        Dr. {rx.doctor?.user?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {rx.visitDate ? format(new Date(rx.visitDate), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {rx.items?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        ₹{rx.total?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[rx.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {rx.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/prescriptions/${rx._id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors">
                          <Eye size={13} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={40} className="mx-auto mb-2 opacity-30" />
                  No prescriptions found
                </div>
              )}
            </div>

            {/* Pagination */}
            {data?.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">Page {data.page} of {data.pages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                    Previous
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
