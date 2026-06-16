const generatePrescriptionHTML = (prescription, labInfo = {}) => {
  const { patient, doctor, items, prescriptionId, visitDate, subtotal, discount, tax, total, paymentStatus, paymentMethod, clinicalNotes, notes } = prescription;
  const doctorName = doctor?.user?.name || 'Dr. Unknown';
  const date = new Date(visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const itemRows = items.map((item, i) => {
    const price = item.discountedPrice || item.price;
    const lineTotal = price * (item.quantity || 1);
    return `
      <tr style="background:${i % 2 === 0 ? '#f8f9fa' : '#ffffff'}">
        <td style="padding:10px 12px;border-bottom:1px solid #e9ecef">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;font-weight:500">${item.testName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;text-align:center">${item.quantity || 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;text-align:right">₹${item.price.toFixed(2)}</td>
        ${item.discountedPrice ? `<td style="padding:10px 12px;border-bottom:1px solid #e9ecef;text-align:right;color:#28a745">₹${item.discountedPrice.toFixed(2)}</td>` : `<td style="padding:10px 12px;border-bottom:1px solid #e9ecef;text-align:right">—</td>`}
        <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;text-align:right;font-weight:600">₹${lineTotal.toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;color:#6c757d;font-size:12px">${item.notes || ''}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Prescription ${prescriptionId}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
      .print-btn { display: none !important; }
    }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #212529; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1a3c6e 0%, #2563eb 100%); color: white; padding: 32px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
    .lab-name { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }
    .lab-info { font-size: 13px; opacity: 0.85; line-height: 1.6; }
    .rx-badge { background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.5); border-radius: 8px; padding: 12px 20px; text-align: center; min-width: 160px; }
    .rx-id { font-size: 20px; font-weight: 700; }
    .rx-label { font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
    .rx-date { font-size: 13px; margin-top: 6px; opacity: 0.9; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 2px solid #e9ecef; }
    .info-section { padding: 24px 40px; }
    .info-section:first-child { border-right: 1px solid #e9ecef; }
    .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6c757d; margin-bottom: 12px; }
    .info-row { display: flex; margin-bottom: 6px; font-size: 14px; }
    .info-key { color: #6c757d; width: 100px; flex-shrink: 0; }
    .info-val { font-weight: 600; color: #212529; }
    .table-section { padding: 0 40px 24px; }
    .table-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6c757d; padding: 20px 0 12px; border-top: 2px solid #e9ecef; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    thead tr { background: #1a3c6e; color: white; }
    thead th { padding: 12px; text-align: left; font-weight: 600; font-size: 13px; }
    thead th:last-child { text-align: left; }
    .totals { padding: 20px 40px; background: #f8f9fa; border-top: 2px solid #e9ecef; display: flex; justify-content: flex-end; }
    .totals-box { min-width: 260px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #e9ecef; }
    .total-row.grand { font-size: 18px; font-weight: 700; color: #1a3c6e; border-bottom: none; padding-top: 12px; }
    .payment-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px; }
    .paid { background: #d4edda; color: #155724; }
    .pending { background: #fff3cd; color: #856404; }
    .notes-section { padding: 20px 40px; border-top: 1px solid #e9ecef; }
    .footer { padding: 20px 40px; background: #f8f9fa; border-top: 2px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #6c757d; }
    .signature-area { text-align: center; }
    .sig-line { width: 180px; border-top: 2px solid #212529; margin: 0 auto 6px; }
    .print-btn { position: fixed; top: 20px; right: 20px; background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(37,99,235,0.4); }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Print Prescription</button>
  <div class="container">
    <div class="header">
      <div>
        <div class="lab-name">${labInfo.labName || 'Laboratory Management System'}</div>
        <div class="lab-info">
          📍 ${labInfo.labAddress || ''}<br/>
          📞 ${labInfo.labPhone || ''} &nbsp;|&nbsp; ✉️ ${labInfo.labEmail || ''}
        </div>
      </div>
      <div class="rx-badge">
        <div class="rx-label">Prescription</div>
        <div class="rx-id">${prescriptionId}</div>
        <div class="rx-date">📅 ${date}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-section">
        <div class="section-label">Patient Information</div>
        <div class="info-row"><span class="info-key">Name</span><span class="info-val">${patient?.name || 'N/A'}</span></div>
        <div class="info-row"><span class="info-key">Patient ID</span><span class="info-val">${patient?.patientId || 'N/A'}</span></div>
        <div class="info-row"><span class="info-key">Age / Gender</span><span class="info-val">${patient?.age || '—'} yrs / ${patient?.gender || '—'}</span></div>
        <div class="info-row"><span class="info-key">Phone</span><span class="info-val">${patient?.phone || '—'}</span></div>
        <div class="info-row"><span class="info-key">Blood Group</span><span class="info-val">${patient?.bloodGroup || '—'}</span></div>
      </div>
      <div class="info-section">
        <div class="section-label">Referring Doctor</div>
        <div class="info-row"><span class="info-key">Doctor</span><span class="info-val">Dr. ${doctorName}</span></div>
        <div class="info-row"><span class="info-key">Specialization</span><span class="info-val">${doctor?.specialization || '—'}</span></div>
        <div class="info-row"><span class="info-key">Reg. No.</span><span class="info-val">${doctor?.registrationNumber || '—'}</span></div>
        <div class="info-row"><span class="info-key">Clinic</span><span class="info-val">${doctor?.clinic?.name || '—'}</span></div>
        <div class="info-row"><span class="info-key">Payment</span><span class="info-val">
          ${paymentMethod}
          <span class="payment-badge ${paymentStatus === 'Paid' ? 'paid' : 'pending'}">${paymentStatus}</span>
        </span></div>
      </div>
    </div>

    ${clinicalNotes ? `
    <div style="padding:16px 40px;background:#eff6ff;border-bottom:1px solid #bfdbfe">
      <div class="section-label" style="color:#1d4ed8">Clinical Notes</div>
      <div style="font-size:14px;color:#1e40af">${clinicalNotes}</div>
    </div>` : ''}

    <div class="table-section">
      <div class="table-title">Prescribed Tests</div>
      <table>
        <thead>
          <tr>
            <th style="width:40px">#</th>
            <th>Test Name</th>
            <th style="text-align:center;width:60px">Qty</th>
            <th style="text-align:right;width:100px">Price (₹)</th>
            <th style="text-align:right;width:110px">Disc. Price</th>
            <th style="text-align:right;width:100px">Total (₹)</th>
            <th style="width:120px">Notes</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <div class="totals">
      <div class="totals-box">
        <div class="total-row"><span>Subtotal</span><span>₹${(subtotal || 0).toFixed(2)}</span></div>
        ${discount > 0 ? `<div class="total-row" style="color:#28a745"><span>Discount</span><span>- ₹${discount.toFixed(2)}</span></div>` : ''}
        ${tax > 0 ? `<div class="total-row"><span>Tax / GST</span><span>+ ₹${tax.toFixed(2)}</span></div>` : ''}
        <div class="total-row grand"><span>Grand Total</span><span>₹${(total || 0).toFixed(2)}</span></div>
      </div>
    </div>

    ${notes ? `
    <div class="notes-section">
      <div class="section-label">Additional Notes</div>
      <div style="font-size:14px;color:#495057;background:#f8f9fa;padding:12px;border-radius:6px;border-left:4px solid #2563eb">${notes}</div>
    </div>` : ''}

    <div class="footer">
      <div>
        <div style="font-weight:600;margin-bottom:4px">${labInfo.labName}</div>
        <div>This is a computer-generated prescription</div>
        <div>Generated on: ${new Date().toLocaleString('en-IN')}</div>
      </div>
      <div class="signature-area">
        ${doctor?.signature ? `<img src="${doctor.signature}" style="height:50px;margin-bottom:6px" alt="Signature"/>` : '<div style="height:50px"></div>'}
        <div class="sig-line"></div>
        <div style="font-weight:600;font-size:13px">Dr. ${doctorName}</div>
        <div style="font-size:12px;color:#6c757d">${doctor?.qualification || ''}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

module.exports = { generatePrescriptionHTML };
