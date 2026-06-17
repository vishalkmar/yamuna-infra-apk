import { profileCompletion, KYC_STATUS, RELATION_LABEL } from '../src/utils/profile';

describe('profileCompletion', () => {
  it('returns 0 for an empty profile', () => {
    expect(profileCompletion({}, {}, [])).toBe(0);
  });

  it('returns 100 when everything is filled', () => {
    const personal = {
      name: 'A', email: 'a@b.com', dob: '1990-01-01', gender: 'male',
      occupation: 'Service', addressLine: 'X', city: 'Y', pincode: '281121',
    };
    expect(profileCompletion(personal, { status: 'verified' }, [{ id: 1 }])).toBe(100);
  });

  it('counts pending KYC as complete for that check', () => {
    expect(profileCompletion({}, { status: 'pending' }, [])).toBe(10);
  });

  it('handles null inputs without throwing', () => {
    expect(profileCompletion(null, null, null)).toBe(0);
  });
});

describe('KYC_STATUS + RELATION_LABEL', () => {
  it('maps statuses to chip variants', () => {
    expect(KYC_STATUS.verified.variant).toBe('success');
    expect(KYC_STATUS.pending.variant).toBe('warning');
    expect(KYC_STATUS.rejected.variant).toBe('error');
  });
  it('capitalises relations', () => {
    expect(RELATION_LABEL('spouse')).toBe('Spouse');
    expect(RELATION_LABEL('')).toBe('');
  });
});
