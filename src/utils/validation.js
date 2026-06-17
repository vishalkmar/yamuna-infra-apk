import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
  mobileNumber: Yup.string()
    .required('Mobile number is required')
    .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

export const otpSchema = Yup.object().shape({
  otp: Yup.string()
    .required('OTP is required')
    .matches(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const paymentSchema = Yup.object().shape({
  amount: Yup.number()
    .typeError('Amount must be a number')
    .min(1000, 'Minimum amount is ₹1,000')
    .required('Amount is required'),
  paymentMode: Yup.string()
    .oneOf(['upi', 'netbanking', 'credit', 'debit'], 'Select a valid payment mode')
    .required('Payment mode required'),
  upiId: Yup.string().when('paymentMode', {
    is: 'upi',
    then: s => s.required('UPI ID is required').matches(/^[\w.-]+@[\w.-]+$/, 'Enter a valid UPI ID'),
    otherwise: s => s.notRequired(),
  }),
  remarks: Yup.string().max(200, 'Max 200 characters'),
  consent: Yup.boolean().oneOf([true], 'You must accept the payment terms'),
});

export const siteVisitSchema = Yup.object().shape({
  visitDate: Yup.date()
    .min(new Date(Date.now() + 86400000), 'Date must be at least tomorrow')
    .required('Please select a visit date'),
  visitTime: Yup.string().required('Please select a time slot'),
  visitType: Yup.string()
    .oneOf(['personal', 'family', 'banker'], 'Invalid visit type')
    .required('Please select visit type'),
  visitorCount: Yup.number().min(1).max(6).required('Please enter visitor count'),
  preferredLang: Yup.string().required('Please select language'),
});

export const supportTicketSchema = Yup.object().shape({
  category: Yup.string().required('Please choose a category'),
  subject: Yup.string().required('Subject is required').min(10, 'Min 10 chars').max(100, 'Max 100 chars'),
  description: Yup.string().required('Description is required').min(20, 'Min 20 chars').max(1000, 'Max 1000 chars'),
  priority: Yup.string().oneOf(['normal', 'urgent']).required('Choose priority'),
});
