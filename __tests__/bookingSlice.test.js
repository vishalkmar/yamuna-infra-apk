// Pure-reducer tests for the booking slice. No native deps needed.

jest.mock('../src/api/bookingApi', () => ({
  bookingApi: {},
}));

import reducer, {
  resetEsign,
  loadBooking,
  loadWelcomeKit,
  initiateEsign,
  completeEsign,
} from '../src/store/slices/bookingSlice';

const initial = {
  details: null,
  documents: [],
  welcomeKit: null,
  welcomeKitLoading: false,
  loading: false,
  error: null,
  esign: {
    envelopeId: null,
    signingUrl: null,
    docId: null,
    busy: false,
    error: null,
  },
};

describe('bookingSlice', () => {
  it('returns initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('loadBooking.fulfilled writes details + documents', () => {
    const state = reducer(initial, {
      type: loadBooking.fulfilled.type,
      payload: {
        details: { bookingId: 'BK-1', unitNumber: 'A-1' },
        documents: [{ id: 1, name: 'a.pdf' }],
      },
    });
    expect(state.loading).toBe(false);
    expect(state.details.bookingId).toBe('BK-1');
    expect(state.documents).toHaveLength(1);
  });

  it('loadWelcomeKit stores the project and items', () => {
    const state = reducer(initial, {
      type: loadWelcomeKit.fulfilled.type,
      payload: { project: { id: 1, name: 'VH' }, items: [{ id: 1, kind: 'image' }] },
    });
    expect(state.welcomeKit.project.name).toBe('VH');
    expect(state.welcomeKit.items).toHaveLength(1);
  });

  it('initiateEsign.fulfilled puts envelopeId + signingUrl into esign slice', () => {
    const pending = reducer(initial, {
      type: initiateEsign.pending.type,
      meta: { arg: { docId: 3 } },
    });
    expect(pending.esign.busy).toBe(true);
    expect(pending.esign.docId).toBe(3);

    const state = reducer(pending, {
      type: initiateEsign.fulfilled.type,
      payload: { envelopeId: 'ENV-1', signingUrl: 'https://sign.example/x' },
    });
    expect(state.esign.busy).toBe(false);
    expect(state.esign.envelopeId).toBe('ENV-1');
    expect(state.esign.signingUrl).toBe('https://sign.example/x');
  });

  it('completeEsign.fulfilled marks the matching document as signed', () => {
    const docs = [
      { id: 1, name: 'one.pdf', status: 'available', signedAt: null },
      { id: 3, name: 'sale.pdf', status: 'pending_signature', signedAt: null, requiresSignature: 1 },
    ];
    const state = reducer(
      { ...initial, documents: docs },
      {
        type: completeEsign.fulfilled.type,
        payload: { id: 3, name: 'sale.pdf', signedAt: '2026-06-05T10:00:00Z' },
      },
    );
    expect(state.documents[1].signedAt).toBe('2026-06-05T10:00:00Z');
    expect(state.documents[1].status).toBe('signed');
    // unrelated doc untouched
    expect(state.documents[0].status).toBe('available');
  });

  it('resetEsign clears all esign fields', () => {
    const state = reducer(
      {
        ...initial,
        esign: { envelopeId: 'X', signingUrl: 'Y', docId: 1, busy: true, error: 'old' },
      },
      resetEsign(),
    );
    expect(state.esign).toEqual({
      envelopeId: null, signingUrl: null, docId: null, busy: false, error: null,
    });
  });
});
