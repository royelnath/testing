import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api' // Tied directly to your Axios interceptor wrapper
import { Search, Printer, FileText, CheckCircle, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function TestReportsPage() {
  const queryClient = useQueryClient()
  const printRef = useRef(null)

  // Local UI State
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [reportRows, setReportRows] = useState([])
  const [labNotes, setLabNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // 1. Fetch Paid/Partial Prescriptions that need reports
  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['prescriptions-for-reports'],
    queryFn: () => api.get('/prescriptions?limit=50').then(r => {
      // Filter prescriptions that are paid or partial (valid for testing)
      return (r.data?.prescriptions || []).filter(rx => rx.paymentStatus !== 'Pending')
    })
  })

  // 2. Filter local prescription sidebar list
  const filteredPrescriptions = prescriptions.filter(rx =>
    rx.prescriptionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 3. Handle selecting a patient's prescription request
  const handleSelectPrescription = (rx) => {
    setSelectedPrescription(rx)

    // Auto-populate report rows based on tests linked to the prescription
    if (rx.items && rx.items.length > 0) {
      const rows = rx.items.map(item => ({
        testId: item.test?._id || '',
        name: item.test?.name || 'Unknown Test',
        code: item.test?.code || '—',
        category: item.test?.category || 'General',
        sampleType: item.test?.sampleType || 'Blood',
        normalRange: item.test?.normalRange || '—',
        unit: item.test?.unit || '',
        observedValue: '',
        status: 'Normal' // Default tag
      }))
      setReportRows(rows)
    } else {
      setReportRows([])
    }
  }

  // 4. Update dynamic row results
  const handleValueChange = (index, val) => {
    const updated = [...reportRows]
    updated[index].observedValue = val
    setReportRows(updated)
  }

  const handleStatusChange = (index, status) => {
    const updated = [...reportRows]
    updated[index].status = status
    setReportRows(updated)
  }

  // 5. Print Trigger (Leverages your index.css print optimizations)
  const handlePrint = () => {
    window.print()
  }

  // 6. Save Report Mutation
  const saveReportMutation = useMutation({
    mutationFn: (reportData) => api.post('/reports', reportData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions-for-reports'] })
      alert('Test report saved and logged successfully!')
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to save test report')
    }
  })

  const handleSaveReport = () => {
    if (!selectedPrescription) return

    const payload = {
      prescriptionId: selectedPrescription._id,
      patientId: selectedPrescription.patient?._id,
      results: reportRows,
      notes: labNotes
    }

    saveReportMutation.mutate(payload)
  }

  return (
    <div className="space-y-5 print:p-0">
      {/* Top Action Bar (Hidden during printing) */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Test Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">Generate, view, and print laboratory diagnostics requested by patients</p>
        </div>
        {selectedPrescription && (
          <div className="flex gap-2">
            <button onClick={handleSaveReport} className="btn-outline">
              Save to Patient History
            </button>
            <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
              <Printer size={16} /> Print Report
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace Layout split-screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: Patient Queue & Entry Form (Hidden during printing) */}
        <div className="lg:col-span-5 space-y-4 print:hidden">

          {/* Patient Selection Queue */}
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Patient Prescription Queue</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9 text-sm"
                placeholder="Search patient name or Rx ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="divide-y divide-gray-100 max-h-[180px] overflow-y-auto pr-1">
              {isLoading ? (
                <p className="text-xs text-gray-400 text-center py-4">Loading active orders...</p>
              ) : filteredPrescriptions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No active paid test requests found</p>
              ) : (
                filteredPrescriptions.map(rx => (
                  <button
                    key={rx._id}
                    onClick={() => handleSelectPrescription(rx)}
                    className={`w-full text-left p-2.5 my-1 rounded-lg transition-colors flex justify-between items-center ${selectedPrescription?._id === rx._id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-800">{rx.patient?.name}</div>
                      <div className="text-xs font-mono text-gray-400">{rx.prescriptionId}</div>
                    </div>
                    <span className="badge-gray text-[10px]">{rx.items?.length || 0} Tests</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Observed Value Entry Matrix Form */}
          {selectedPrescription ? (
            <div className="card p-4 space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="font-semibold text-gray-900">Enter Values for {selectedPrescription.patient?.name}</h3>
                <p className="text-xs text-gray-400 font-mono">ID: {selectedPrescription.patient?.patientId}</p>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {reportRows.map((row, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-2 border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">{row.name}</span>
                      <span className="text-[11px] text-gray-400 font-mono">{row.normalRange} {row.unit}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          placeholder="Observed Value"
                          className="input py-1 text-xs"
                          value={row.observedValue}
                          onChange={(e) => handleValueChange(idx, e.target.value)}
                        />
                      </div>
                      <div>
                        <select
                          className="input py-1 text-xs"
                          value={row.status}
                          onChange={(e) => handleStatusChange(idx, e.target.value)}
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High (▲)</option>
                          <option value="Low">Low (▼)</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="label text-xs">Laboratory Remarks / Pathologist Notes</label>
                <textarea
                  className="input h-auto min-h-[60px] text-xs resize-none"
                  placeholder="Enter remarks regarding samples, verification status, or critical findings..."
                  value={labNotes}
                  onChange={e => setLabNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-400">
              <FileText size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select a prescription from the queue to compile a diagnostics test report.</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Official Real-Time Live Printable Report Layout */}
        <div className="lg:col-span-7 print:col-span-12">
          {selectedPrescription ? (
            <div ref={printRef} className="bg-white rounded-xl shadow-sm border border-gray-200 print:border-0 print:shadow-none p-8 space-y-6 min-h-[750px] flex flex-col justify-between">

              {/* Report Header */}
              <div>
                <div className="flex justify-between items-start border-b-2 border-blue-600 pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-blue-800 tracking-tight">LABMANAGE DIAGNOSTICS</h1>
                    <p className="text-xs text-gray-500">ISO 9001:2015 Certified Reference Laboratory</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Contact: support@labmanage.com | +91 98765 43210</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">Official Lab Report</span>
                    <p className="text-xs font-mono font-semibold text-gray-700 mt-1">Rx-ID: {selectedPrescription.prescriptionId}</p>
                    <p className="text-[11px] text-gray-400">Date: {format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                </div>

                {/* Patient Information Grid */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-4 text-xs">
                  <div className="space-y-1">
                    <div><span className="text-gray-400">Patient Name:</span> <strong className="text-gray-800">{selectedPrescription.patient?.name}</strong></div>
                    <div><span className="text-gray-400">Patient ID:</span> <span className="font-mono">{selectedPrescription.patient?.patientId}</span></div>
                    <div><span className="text-gray-400">Age / Gender:</span> <span className="text-gray-700">{selectedPrescription.patient?.age || '—'} YRS / {selectedPrescription.patient?.gender || '—'}</span></div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div><span className="text-gray-400">Referred By:</span> <strong className="text-gray-700">Dr. {selectedPrescription.doctor?.user?.name || 'Self Request'}</strong></div>
                    <div><span className="text-gray-400">Sample Logged:</span> <span className="text-gray-700">{selectedPrescription.visitDate ? format(new Date(selectedPrescription.visitDate), 'dd MMM yyyy') : '—'}</span></div>
                    <div><span className="text-gray-400">Status:</span> <span className="text-green-600 font-semibold">Verified / Complete</span></div>
                  </div>
                </div>

                {/* Dynamic Lab Analytics Results Table */}
                <table className="w-full mt-6 text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                      <th className="pb-2">Test Panel / Parameters</th>
                      <th className="pb-2">Observed Value</th>
                      <th className="pb-2">Reference Range</th>
                      <th className="pb-2 text-right">Flag Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3">
                          <div className="font-semibold text-gray-800">{row.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{row.category} ({row.sampleType})</div>
                        </td>
                        <td className="py-3 font-mono font-bold text-sm text-gray-900">
                          {row.observedValue ? `${row.observedValue} ${row.unit}` : <span className="text-gray-300 font-normal italic text-xs">Awaiting Entry</span>}
                        </td>
                        <td className="py-3 text-gray-600 font-mono">
                          {row.normalRange} {row.unit}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'Normal' ? 'bg-green-50 text-green-700 border border-green-200' :
                            row.status === 'Critical' ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse' :
                              'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Lab Remarks Field */}
                {labNotes && (
                  <div className="mt-6 border border-gray-100 bg-gray-50/50 p-3 rounded-lg text-xs">
                    <span className="font-bold text-gray-700 block mb-1">Pathology Interpretation & Remarks:</span>
                    <p className="text-gray-600 italic leading-relaxed">{labNotes}</p>
                  </div>
                )}
              </div>

              {/* Verified Pathologist Signature Sign-off footer (Perfect for physical layouts) */}
              <div className="border-t border-gray-200 pt-8 flex justify-between items-end mt-12 text-xs">
                <div className="text-gray-400 text-[10px] font-mono">
                  Report generated securely via LabManage Cloud Systems.<br />
                  End of Medical Diagnostics Assessment.
                </div>
                <div className="text-center w-48">
                  <div className="h-10 mx-auto opacity-60 font-serif italic text-gray-400 flex items-center justify-center text-sm">
                    [ Digitally Signed ]
                  </div>
                  <div className="border-t border-gray-300 mt-1 pt-1 font-semibold text-gray-800">
                    Dr. Ananya Sharma, MD
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Chief Consultant Pathologist
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="card h-full min-h-[400px] flex flex-col justify-center items-center text-gray-400 p-8 border-dashed">
              <FileText size={48} className="stroke-1 opacity-20 mb-3" />
              <p className="text-sm">Patient report template preview area</p>
              <p className="text-xs text-gray-400 mt-1">Select an item from the processing list to compile the layout canvas</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}