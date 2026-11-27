// Regression tests for the two bugs behind "Couldn't load progress (404)":
// a property selection left over from a previous account was never corrected,
// and logging out only cleared the `auth` slice.
import projectReducer, { loadMyProperties, selectProperty } from '../src/store/slices/projectSlice';

const USER_A_PROPS = [{ id: 15, label: 'Home', flatNo: 'A-123' }];
const USER_B_PROPS = [{ id: 24, label: 'test', flatNo: '123' }];

const load = (state, payload) =>
  projectReducer(state, { type: loadMyProperties.fulfilled.type, payload });

describe('project slice — property selection across accounts', () => {
  it('selects the first property on a fresh load', () => {
    const s = load(undefined, USER_B_PROPS);
    expect(s.selectedPropertyId).toBe(24);
  });

  it('keeps a valid selection the user actually owns', () => {
    let s = load(undefined, [{ id: 15 }, { id: 22 }]);
    s = projectReducer(s, selectProperty(22));
    s = load(s, [{ id: 15 }, { id: 22 }]);
    expect(s.selectedPropertyId).toBe(22);
  });

  // The actual bug: user A's property id survived into user B's session, so
  // every /construction/property/15/... call 404'd for a user who owns 24.
  it('replaces a selection carried over from another account', () => {
    const afterUserA = load(undefined, USER_A_PROPS);
    expect(afterUserA.selectedPropertyId).toBe(15);

    const afterUserB = load(afterUserA, USER_B_PROPS);
    expect(afterUserB.selectedPropertyId).toBe(24);
    expect(afterUserB.selectedPropertyId).not.toBe(15);
  });

  it('clears a stale selection when the new account owns no property', () => {
    const afterUserA = load(undefined, USER_A_PROPS);
    const afterUserB = load(afterUserA, []);
    expect(afterUserB.selectedPropertyId).toBeNull();
  });

  it('drops the previous account error so the new user sees a clean screen', () => {
    let s = load(undefined, USER_A_PROPS);
    s = projectReducer(s, {
      type: 'project/loadProgress/rejected',
      error: { message: 'Request failed with status code 404' },
    });
    expect(s.error).toBeTruthy();

    s = load(s, USER_B_PROPS);
    expect(s.error).toBeNull();
  });
});

describe('store — logout clears every slice', () => {
  it('does not carry one account state into the next session', () => {
    jest.isolateModules(() => {
      const { store } = require('../src/store');
      const { logout } = require('../src/store/slices/authSlice');

      store.dispatch({ type: loadMyProperties.fulfilled.type, payload: USER_A_PROPS });
      expect(store.getState().project.selectedPropertyId).toBe(15);

      store.dispatch(logout());

      // Before the fix only `auth` was reset and this stayed at 15.
      expect(store.getState().project.selectedPropertyId).toBeNull();
      expect(store.getState().project.properties).toEqual([]);
      expect(store.getState().auth.isLoggedIn).toBe(false);
    });
  });
});
