const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  testName: { type: String, required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number, default: null },
  quantity: { type: Number, default: 1 },
  notes: { type: String, default: '' },
});

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    items: [prescriptionItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Partial'], default: 'Pending' },
    paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Online', 'Pending'], default: 'Pending' },
    status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' },
    notes: { type: String, default: '' },
    clinicalNotes: { type: String, default: '' },
    emailSentTo: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    visitDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

prescriptionSchema.pre('save', async function (next) {
  if (!this.prescriptionId) {
    const count = await mongoose.model('Prescription').countDocuments();
    this.prescriptionId = `RX${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
