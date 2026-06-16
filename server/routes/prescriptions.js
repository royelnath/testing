const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const { generatePrescriptionHTML } = require('../utils/prescriptionTemplate');

// @GET /api/prescriptions
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.doctor) filter.doctor = req.query.doctor;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.visitDate = {};
      if (req.query.dateFrom) filter.visitDate.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.visitDate.$lte = new Date(req.query.dateTo);
    }

    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter)
        .populate('patient', 'name patientId age gender phone')
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
        .populate('createdBy', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Prescription.countDocuments(filter),
    ]);

    res.json({ prescriptions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/prescriptions/:id
router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .populate('items.test')
      .populate('createdBy', 'name');
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/prescriptions
router.post('/', async (req, res) => {
  try {
    const { items, discount = 0, tax = 0 } = req.body;
    const subtotal = items.reduce((sum, item) => {
      const price = item.discountedPrice || item.price;
      return sum + price * (item.quantity || 1);
    }, 0);
    const total = subtotal - discount + tax;

    const prescription = await Prescription.create({
      ...req.body,
      subtotal,
      total,
      // NOTE: req.user._id will be undefined without auth middleware. 
      // If you are passing the creator ID, make sure it is sent in req.body.createdBy instead.
      createdBy: req.body.createdBy || null,
    });

    const populated = await Prescription.findById(prescription._id)
      .populate('patient')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/prescriptions/:id
router.put('/:id', async (req, res) => {
  try {
    if (req.body.items) {
      const { items, discount = 0, tax = 0 } = req.body;
      req.body.subtotal = items.reduce((sum, item) => {
        const price = item.discountedPrice || item.price;
        return sum + price * (item.quantity || 1);
      }, 0);
      req.body.total = req.body.subtotal - discount + tax;
    }
    const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('patient')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/prescriptions/:id/print - returns HTML for printing
router.get('/:id/print', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .populate('items.test');

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    const html = generatePrescriptionHTML(prescription, {
      labName: process.env.LAB_NAME,
      labAddress: process.env.LAB_ADDRESS,
      labPhone: process.env.LAB_PHONE,
      labEmail: process.env.LAB_EMAIL,
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/prescriptions/:id
router.delete('/:id', async (req, res) => {
  try {
    await Prescription.findByIdAndUpdate(req.params.id, { status: 'Cancelled' });
    res.json({ message: 'Prescription cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;