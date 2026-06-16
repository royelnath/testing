import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Printer, Mail, CheckCircle, X, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

function EmailModal({ prescriptionId, patientEmail, onClose }) {
  const [form, setForm] = useState({ toEmail: patientEmail || '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const send = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await api.post('/email/send-prescription', { prescriptionId, ...form })
      toast.success('Email sent successfully!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Mail size={18} /> Send Prescription via Email</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={send} className="p-6 space-y-4">
          <div>
            <label className="label">To Email *</label>
            <input type="email" className="input" value={form.toEmail} onChange={e => setForm(f => ({ ...f, toEmail: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Subject (optional)</label>
            <input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Leave blank for default subject" />
          </div>
          <div>
            <label className="label">Additional Message (optional)</label>
            <textarea className="input resize-none" rows={3} value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Add a personal message to the patient..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={sending} className="btn-primary flex-1 justify-center">
              {sending ? 'Sending...' : <><Mail size={16} /> Send Email</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PrescriptionDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [emailModal, setEmailModal] = useState(false)

  const { data: rx, isLoading } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => api.get(`/prescriptions/${id}`).then(r => r.data)
  })

  const updatePayment = useMutation({
    mutationFn: (data) => api.put(`/prescriptions/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['prescription', id]); toast.success('Updated!') }
  })

  const handlePrint = () => {
    window.open(`/api/prescriptions/${id}/print`, '_blank')
  }

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading...</div>
  if (!rx) return <div className="p-8 text-center text-gray-500">Prescription not found</div>

  const doctorName = rx.doctor?.user?.name || 'Unknown'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 flex-wrap">
        <Link to="/prescriptions" className="btn-outline py-1.5 px-3"><ArrowLeft size={16} /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{rx.prescriptionId}</h1>
          <p className="text-sm text-gray-500">
            {format(new Date(rx.visitDate), 'dd MMM yyyy, hh:mm a')} · Created by {rx.createdBy?.name}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setEmailModal(true)} className="btn-outline">
            <Mail size={16} /> Email
          </button>
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={16} /> Print / Download
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <span className={`badge ${rx.status === 'Active' ? 'badge-blue' : rx.status === 'Completed' ? 'badge-green' : 'badge-red'}`}>
                {rx.status}
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Payment</div>
              <span className={`badge ${rx.paymentStatus === 'Paid' ? 'badge-green' : rx.paymentStatus === 'Pending' ? 'badge-yellow' : 'badge-blue'}`}>
                {rx.paymentStatus}
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Method</div>
              <span className="badge-gray">{rx.paymentMethod}</span>
            </div>
          </div>
          {/* Quick payment update */}
          {rx.paymentStatus !== 'Paid' && (
            <button onClick={() => updatePayment.mutate({ paymentStatus: 'Paid', status: 'Completed' })}
              className="btn-success text-sm">
              <CheckCircle size={15} /> Mark as Paid
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient & Doctor */}
        <div className="space-y-4">
          <div className="card">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Patient</div>
            <div className="font-semibold text-gray-800">{rx.patient?.name}</div>
            <div className="text-sm text-gray-500 mt-1">{rx.patient?.patientId}</div>
            <div className="text-sm text-gray-500">{rx.patient?.age}y · {rx.patient?.gender}</div>
            <div className="text-sm text-gray-500">{rx.patient?.phone}</div>
            {rx.patient?.bloodGroup !== 'Unknown' && (
              <span className="badge-red text-xs mt-2 inline-block">{rx.patient?.bloodGroup}</span>
            )}
          </div>
          <div className="card">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Doctor</div>
            <div className="font-semibold text-gray-800">Dr. {doctorName}</div>
            <div className="text-sm text-gray-500">{rx.doctor?.specialization}</div>
            <div className="text-xs text-gray-400 mt-1">Reg: {rx.doctor?.registrationNumber}</div>
          </div>

          {rx.emailSentTo?.length > 0 && (
            <div className="card p-4 bg-green-50 border-green-200">
              <div className="text-xs font-semibold text-green-700 uppercase mb-2">Email Sent To</div>
              {rx.emailSentTo.map(e => (
                <div key={e} className="text-sm text-green-700 flex items-center gap-1"><CheckCircle size={12} />{e}</div>
              ))}
            </div>
          )}
        </div>

        {/* Tests & totals */}
        <div className="lg:col-span-2 space-y-4">
          {/* Clinical notes */}
          {rx.clinicalNotes && (
            <div className="card p-4 bg-blue-50 border-blue-100">
              <div className="text-xs font-semibold text-blue-700 uppercase mb-1">Clinical Notes</div>
              <p className="text-sm text-blue-800">{rx.clinicalNotes}</p>
            </div>
          )}

          {/* Tests */}
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-700">Prescribed Tests ({rx.items?.length})</div>
            </div>
            <table className="table-auto w-full text-sm">
              <thead><tr><th>#</th><th>Test Name</th><th className="text-center">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th><th>Notes</th></tr></thead>
              <tbody>
                {rx.items?.map((item, i) => {
                  const price = item.discountedPrice || item.price
                  return (
                    <tr key={i}>
                      <td className="text-gray-400">{i + 1}</td>
                      <td className="font-medium text-gray-800">{item.testName}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">
                        {item.discountedPrice
                          ? <><span className="line-through text-gray-400 text-xs mr-1">₹{item.price}</span><span className="text-green-600 font-medium">₹{item.discountedPrice}</span></>
                          : <span>₹{item.price}</span>}
                      </td>
                      <td className="text-right font-medium">₹{(price * item.quantity).toFixed(2)}</td>
                      <td className="text-gray-400 text-xs">{item.notes}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-end">
                <div className="w-64 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>₹{rx.subtotal?.toFixed(2)}</span></div>
                  {rx.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>- ₹{rx.discount?.toFixed(2)}</span></div>}
                  {rx.tax > 0 && <div className="flex justify-between text-sm"><span>Tax</span><span>+ ₹{rx.tax?.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                    <span>Grand Total</span><span>₹{rx.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {rx.notes && (
            <div className="card p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Additional Notes</div>
              <p className="text-sm text-gray-700">{rx.notes}</p>
            </div>
          )}
        </div>
      </div>

      {emailModal && (
        <EmailModal
          prescriptionId={id}
          patientEmail={rx.patient?.email}
          onClose={() => setEmailModal(false)}
        />
      )}
    </div>
  )
}
