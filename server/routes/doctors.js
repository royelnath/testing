const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/doctors - get all doctors
router.get('/', protect, async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true }).populate('user', 'name email avatar');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/doctors/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email avatar');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/doctors/by-user/:userId
router.get('/by-user/:userId', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.params.userId }).populate('user', 'name email avatar');
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/doctors - create doctor profile
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    // Update user role to doctor
    await User.findByIdAndUpdate(req.body.userId, { role: 'doctor' });
    const doctor = await Doctor.create({ ...req.body, user: req.body.userId });
    const populated = await doctor.populate('user', 'name email avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/doctors/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('user', 'name email avatar');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/doctors/:id (soft delete)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Doctor.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Doctor deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
