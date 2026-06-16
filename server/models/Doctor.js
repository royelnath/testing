const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: String, unique: true },
    specialization: { type: String, required: true },
    qualification: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    phone: { type: String, required: true },
    clinic: {
      name: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    signature: { type: String, default: '' }, // base64 or URL
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate doctorId
doctorSchema.pre('save', async function (next) {
  if (!this.doctorId) {
    const count = await mongoose.model('Doctor').countDocuments();
    this.doctorId = `DR${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);
