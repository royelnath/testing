import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Search, Plus, Minus, Trash2, ArrowLeft, FlaskConical, CheckCircle } from 'lucide-react'

export default function NewPrescriptionPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const prePatientId = params.get('patient')

  const [step, setStep] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [testSearch, setTestSearch] = useState('')
  const [cart, setCart] = useState([])
  const [form, setForm] = useState({
    discount: 0, tax: 0, paymentStatus: 'Pending',
    paymentMethod: 'Pending', clinicalNotes: '', notes: ''
  })

  // Load pre-selected patient
  const { data: prePatient } = useQuery({
    queryKey: ['patient', prePatientId],
    queryFn: () => api.get(`/patients/${prePatientId}`).then(r => r.data),
    enabled: !!prePatientId
  })
  useEffect(() => { if (prePatient) { setSelectedPatient(prePatient); setStep(2) } }, [prePatient])

  const { data: patientResults } = useQuery({
    queryKey: ['patient-search', patientSearch],
    queryFn: () => api.get(`/patients?search=${patientSearch}&limit=8`).then(r => r.data.patients),
    enabled: patientSearch.length > 1
  })

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.get('/doctors').then(r => r.data)
  })

  const { data: tests = [] } = useQuery({
    queryKey: ['tests-for-rx', selectedDoctor],
    queryFn: () => api.get(`/tests?${selectedDoctor ? `doctor=${selectedDoctor._id}` : ''}`).then(r => r.data),
    enabled: !!selectedDoctor
  })

  const filteredTests = tests.filter(t =>
    t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
    (t.code || '').toLowerCase().includes(testSearch.toLowerCase())
  )

  const addToCart = (test) => {
    setCart(prev => {
      const exists = prev.find(i => i.test._id === test._id)
      if (exists) return prev.map(i => i.test._id === test._id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { test, testName: test.name, price: test.price, discountedPrice: test.discountedPrice, quantity: 1, notes: '' }]
    })
    toast.success(`${test.name} added`)
  }

  const removeFromCart = (testId) => setCart(prev => prev.filter(i => i.test._id !== testId))
  const updateQty = (testId, delta) => setCart(prev =>
    prev.map(i => i.test._id === testId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
  )

  const subtotal = cart.reduce((sum, item) => {
    const price = item.discountedPrice || item.price
    return sum + price * item.quantity
  }, 0)
  const total = subtotal - parseFloat(form.discount || 0) + parseFloat(form.tax || 0)

  const createMut = useMutation({
    mutationFn: (data) => api.post('/prescriptions', data),
    onSuccess: (res) => {
      toast.success('Prescription created!')
      navigate(`/prescriptions/${res.data._id}`)
    },
    onError: err => toast.error(err.response?.data?.message || 'Error creating prescription')
  })

  const handleSubmit = () => {
    if (!selectedPatient) return toast.error('Select a patient')
    if (!selectedDoctor) return toast.error('Select a doctor')
    if (cart.length === 0) return toast.error('Add at least one test')

    createMut.mutate({
      patient: selectedPatient._id,
      doctor: selectedDoctor._id,
      items: cart.map(i => ({
        test: i.test._id,
        testName: i.testName,
        price: i.price,
        discountedPrice: i.discountedPrice,
        quantity: i.quantity,
        notes: i.notes
      })),
      discount: parseFloat(form.discount) || 0,
      tax: parseFloat(form.tax) || 0,
      paymentStatus: form.paymentStatus,
      paymentMethod: form.paymentMethod,
      clinicalNotes: form.clinicalNotes,
      notes: form.notes,
    })
  }

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3, 4].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step > s ? 'bg-green-500 text-white' : step === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {step > s ? <CheckCircle size={16} /> : s}
          </div>
          {s < 4 && <div className={`h-0.5 w-12 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
        </div>
      ))}
      <div className="ml-2 text-sm text-gray-500">
        {['Select Patient', 'Select Doctor', 'Add Tests', 'Review & Submit'][step - 1]}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-outline py-1.5 px-3"><ArrowLeft size={16} /></button>
        <h1 className="text-2xl font-bold text-gray-900">New Prescription</h1>
      </div>

      <div className="card">
        <StepIndicator />

        {/* Step 1: Select Patient */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Select Patient</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" placeholder="Search patient by name, phone, or ID..."
                value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
            </div>
            {patientResults?.map(p => (
              <button key={p._id} onClick={() => { setSelectedPatient(p); setStep(2) }}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left">
                <div>
                  <div className="font-medium text-gray-800">{p.name}</div>
                  <div className="text-sm text-gray-500">{p.patientId} · {p.age}y · {p.gender} · {p.phone}</div>
                </div>
                <span className={`badge ${p.bloodGroup !== 'Unknown' ? 'badge-red' : 'badge-gray'}`}>{p.bloodGroup}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Select Doctor */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              ✓ Patient: <strong>{selectedPatient?.name}</strong> ({selectedPatient?.patientId})
            </div>
            <h2 className="font-semibold text-gray-800">Select Referring Doctor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctors.map(doc => (
                <button key={doc._id} onClick={() => { setSelectedDoctor(doc); setStep(3) }}
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left">
                  <div className="font-medium text-gray-800">Dr. {doc.user?.name}</div>
                  <div className="text-sm text-gray-500">{doc.specialization}</div>
                  <div className="text-xs text-gray-400 mt-1">Reg: {doc.registrationNumber}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="btn-outline text-sm">← Back</button>
          </div>
        )}

        {/* Step 3: Add Tests */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                ✓ {selectedPatient?.name}
              </div>
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                ✓ Dr. {selectedDoctor?.user?.name}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Test list */}
              <div>
                <h2 className="font-semibold text-gray-800 mb-3">Available Tests</h2>
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="input pl-9" placeholder="Search tests..." value={testSearch} onChange={e => setTestSearch(e.target.value)} />
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredTests.map(test => (
                    <div key={test._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200">
                      <div>
                        <div className="font-medium text-sm text-gray-800">{test.name}</div>
                        <div className="text-xs text-gray-500">{test.category} · {test.sampleType}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          {test.discountedPrice
                            ? <><div className="text-xs line-through text-gray-400">₹{test.price}</div><div className="text-sm font-bold text-green-600">₹{test.discountedPrice}</div></>
                            : <div className="text-sm font-bold text-gray-800">₹{test.price}</div>}
                        </div>
                        <button onClick={() => addToCart(test)} className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart */}
              <div>
                <h2 className="font-semibold text-gray-800 mb-3">Selected Tests ({cart.length})</h2>
                {cart.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    <FlaskConical size={30} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Add tests from the list</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.test._id} className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm text-gray-800 truncate flex-1">{item.testName}</div>
                          <button onClick={() => removeFromCart(item.test._id)} className="text-red-400 hover:text-red-600 ml-2">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.test._id, -1)} className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.test._id, 1)} className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="text-sm font-bold text-gray-800">
                            ₹{((item.discountedPrice || item.price) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cart.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-outline">← Back</button>
              <button onClick={() => cart.length > 0 && setStep(4)} disabled={cart.length === 0} className="btn-primary">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-gray-800">Review & Submit</h2>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Patient</div>
                <div className="font-medium text-gray-800">{selectedPatient?.name}</div>
                <div className="text-sm text-gray-500">{selectedPatient?.age}y · {selectedPatient?.gender} · {selectedPatient?.phone}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Doctor</div>
                <div className="font-medium text-gray-800">Dr. {selectedDoctor?.user?.name}</div>
                <div className="text-sm text-gray-500">{selectedDoctor?.specialization}</div>
              </div>
            </div>

            {/* Tests summary */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="table-auto w-full text-sm">
                <thead><tr><th>Test</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.test._id}>
                      <td>{item.testName}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">₹{(item.discountedPrice || item.price).toFixed(2)}</td>
                      <td className="text-right font-medium">₹{((item.discountedPrice || item.price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment & extras */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Discount (₹)</label>
                <input type="number" min="0" className="input" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tax / GST (₹)</label>
                <input type="number" min="0" className="input" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} />
              </div>
              <div>
                <label className="label">Payment Status</label>
                <select className="input" value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}>
                  {['Pending', 'Paid', 'Partial'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select className="input" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                  {['Pending', 'Cash', 'Card', 'UPI', 'Online'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Clinical Notes</label>
                <textarea className="input resize-none" rows={2} value={form.clinicalNotes}
                  onChange={e => setForm(f => ({ ...f, clinicalNotes: e.target.value }))}
                  placeholder="Symptoms, diagnosis, instructions..." />
              </div>
              <div className="col-span-2">
                <label className="label">Additional Notes</label>
                <textarea className="input resize-none" rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional remarks..." />
              </div>
            </div>

            {/* Total */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between text-sm mb-1"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
              {parseFloat(form.discount) > 0 && <div className="flex justify-between text-sm mb-1 text-green-600"><span>Discount:</span><span>- ₹{parseFloat(form.discount).toFixed(2)}</span></div>}
              {parseFloat(form.tax) > 0 && <div className="flex justify-between text-sm mb-1"><span>Tax:</span><span>+ ₹{parseFloat(form.tax).toFixed(2)}</span></div>}
              <div className="flex justify-between text-lg font-bold text-blue-800 border-t border-blue-200 pt-2 mt-2">
                <span>Grand Total:</span><span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn-outline">← Back</button>
              <button onClick={handleSubmit} disabled={createMut.isPending} className="btn-primary flex-1 justify-center">
                {createMut.isPending ? 'Creating...' : '✓ Create Prescription'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
