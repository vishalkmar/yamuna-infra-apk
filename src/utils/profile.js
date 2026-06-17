// Pure helpers for the Profile module (Module 27).

export const KYC_STATUS = {
  not_started: { label: 'Not started', variant: 'neutral' },
  pending: { label: 'Under review', variant: 'warning' },
  verified: { label: 'Verified', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
};

export const RELATION_LABEL = r => (r ? r.charAt(0).toUpperCase() + r.slice(1) : '');

export const LANGUAGE_LABEL = { en: 'English', hi: 'हिन्दी' };
export const DIETARY_LABEL = { veg: 'Vegetarian', nonveg: 'Non-vegetarian', jain: 'Jain', vegan: 'Vegan' };

// Percentage of the key profile fields the user has filled in.
export function profileCompletion(personal = {}, kyc = {}, family = []) {
  const p = personal || {};
  const checks = [
    !!p.name, !!p.email, !!p.dob, !!p.gender, !!p.occupation,
    !!p.addressLine, !!p.city, !!p.pincode,
    (family || []).length > 0,
    kyc?.status === 'verified' || kyc?.status === 'pending',
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
