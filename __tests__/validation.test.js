import { loginSchema, otpSchema, paymentSchema } from '../src/utils/validation';

describe('loginSchema', () => {
  it('accepts a valid 10-digit Indian mobile starting with 6-9', async () => {
    await expect(loginSchema.validate({ mobileNumber: '9876543210' })).resolves.toBeTruthy();
  });

  it.each([
    ['too short',    '987654321'],
    ['too long',     '98765432100'],
    ['bad prefix',   '5876543210'],
    ['non-digits',   '987abc3210'],
  ])('rejects: %s', async (_, mobile) => {
    await expect(loginSchema.validate({ mobileNumber: mobile })).rejects.toBeTruthy();
  });
});

describe('otpSchema', () => {
  it('accepts 6 digits', async () => {
    await expect(otpSchema.validate({ otp: '123456' })).resolves.toBeTruthy();
  });
  it('rejects letters', async () => {
    await expect(otpSchema.validate({ otp: '12a456' })).rejects.toBeTruthy();
  });
  it('rejects wrong length', async () => {
    await expect(otpSchema.validate({ otp: '12345' })).rejects.toBeTruthy();
  });
});

describe('paymentSchema', () => {
  const valid = {
    amount: 5000,
    paymentMode: 'upi',
    upiId: 'piyush@upi',
    remarks: '',
    consent: true,
  };

  it('accepts a complete UPI payment', async () => {
    await expect(paymentSchema.validate(valid)).resolves.toBeTruthy();
  });

  it('rejects amount under 1000', async () => {
    await expect(paymentSchema.validate({ ...valid, amount: 500 })).rejects.toBeTruthy();
  });

  it('requires UPI ID only when mode is UPI', async () => {
    await expect(
      paymentSchema.validate({ ...valid, paymentMode: 'upi', upiId: '' }),
    ).rejects.toBeTruthy();

    await expect(
      paymentSchema.validate({ ...valid, paymentMode: 'netbanking', upiId: '' }),
    ).resolves.toBeTruthy();
  });

  it('requires consent', async () => {
    await expect(paymentSchema.validate({ ...valid, consent: false })).rejects.toBeTruthy();
  });
});
