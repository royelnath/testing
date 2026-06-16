const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    category: {
      type: String,
      enum: ['Haematology', 'Biochemistry', 'Microbiology', 'Immunology', 'Radiology', 'Pathology', 'Urine', 'Other'],
      default: 'Other',
    },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, default: null },
    unit: { type: String, default: '' },
    normalRange: { type: String, default: '' },
    description: { type: String, default: '' },
    sampleType: { type: String, default: 'Blood' },
    turnaroundTime: { type: String, default: '24 hours' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

testSchema.index({ doctor: 1, name: 1 });

module.exports = mongoose.model('Test', testSchema);
