const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Prescription = require('../models/Prescription');
const { protect } = require('../middleware/auth');
const { generatePrescriptionHTML } = require('../utils/prescriptionTemplate');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// @POST /api/email/send-prescription
router.post('/send-prescription', protect, async (req, res) => {
  const { prescriptionId, toEmail, subject, message } = req.body;

  try {
    const prescription = await Prescription.findById(prescriptionId)
      .populate('patient')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .populate('items.test');

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    const labInfo = {
      labName: process.env.LAB_NAME,
      labAddress: process.env.LAB_ADDRESS,
      labPhone: process.env.LAB_PHONE,
      labEmail: process.env.LAB_EMAIL,
    };

    const html = generatePrescriptionHTML(prescription, labInfo);
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: toEmail || prescription.patient.email,
      subject: subject || `Prescription ${prescription.prescriptionId} - ${labInfo.labName}`,
      html: message
        ? `<p>${message}</p><hr/>${html}`
        : `<p>Dear ${prescription.patient.name},</p>
           <p>Please find your prescription details below.</p>
           <p>If you have any questions, please contact us at ${labInfo.labPhone}.</p>
           <br/>
           ${html}`,
    };

    await transporter.sendMail(mailOptions);

    // Track email
    await Prescription.findByIdAndUpdate(prescriptionId, {
      $addToSet: { emailSentTo: toEmail || prescription.patient.email },
    });

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Failed to send email: ' + err.message });
  }
});

// @POST /api/email/test - test email config
router.post('/test', protect, async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    res.json({ message: 'Email configuration is valid' });
  } catch (err) {
    res.status(500).json({ message: 'Email config error: ' + err.message });
  }
});

module.exports = router;
