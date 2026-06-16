const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const { protect } = require('../middleware/auth');

// @GET /api/tests - all tests (optionally filter by doctor)
router.get('/', protect, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.doctor) filter.doctor = req.query.doctor;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

    const tests = await Test.find(filter)
      .populate('doctor', 'user specialization')
      .sort({ category: 1, name: 1 });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/tests/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).populate('doctor');
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/tests
router.post('/', protect, async (req, res) => {
  try {
    const test = await Test.create(req.body);
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/tests/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/tests/:id (soft delete)
router.delete('/:id', protect, async (req, res) => {
  try {
    await Test.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Test removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/tests/bulk - bulk create
router.post('/bulk', protect, async (req, res) => {
  try {
    const tests = await Test.insertMany(req.body.tests);
    res.status(201).json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
