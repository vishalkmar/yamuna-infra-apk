jest.mock('../src/api/documentApi', () => ({ documentApi: {} }));

import reducer, {
  setFilters, resetFilters, setViewMode,
  enterSelection, toggleSelected, selectAll, clearSelection,
  loadDocuments, loadCategories, bulkDownload,
} from '../src/store/slices/documentSlice';

const initial = {
  documents: [],
  categories: { total: 0, pendingSign: 0, buckets: [] },
  loading: false,
  categoriesLoading: false,
  error: null,
  filters: { search: '', category: 'all', from: '', to: '' },
  selectionMode: false,
  selected: [],
  viewMode: 'grid',
  bulkBusy: false,
};

describe('documentSlice', () => {
  it('starts in expected initial state', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual(initial);
  });

  it('setFilters merges new filter values', () => {
    const s = reducer(initial, setFilters({ category: 'invoice', search: 'INV' }));
    expect(s.filters).toEqual({ search: 'INV', category: 'invoice', from: '', to: '' });
  });

  it('resetFilters clears all filters', () => {
    const dirty = { ...initial, filters: { search: 'x', category: 'noc', from: '2024-01-01', to: '' } };
    expect(reducer(dirty, resetFilters()).filters).toEqual(initial.filters);
  });

  it('setViewMode switches between grid and list', () => {
    expect(reducer(initial, setViewMode('list')).viewMode).toBe('list');
    expect(reducer(initial, setViewMode('grid')).viewMode).toBe('grid');
  });

  describe('selection', () => {
    it('enterSelection starts multi-select with one id', () => {
      const s = reducer(initial, enterSelection(7));
      expect(s.selectionMode).toBe(true);
      expect(s.selected).toEqual([7]);
    });

    it('toggleSelected adds and removes ids', () => {
      const s1 = reducer({ ...initial, selectionMode: true, selected: [1] }, toggleSelected(2));
      expect([...s1.selected].sort()).toEqual([1, 2]);
      const s2 = reducer(s1, toggleSelected(1));
      expect(s2.selected).toEqual([2]);
    });

    it('toggleSelected exits selection mode when last id removed', () => {
      const s = reducer({ ...initial, selectionMode: true, selected: [5] }, toggleSelected(5));
      expect(s.selected).toEqual([]);
      expect(s.selectionMode).toBe(false);
    });

    it('selectAll picks every loaded document', () => {
      const docs = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const s = reducer({ ...initial, documents: docs }, selectAll());
      expect([...s.selected].sort()).toEqual([1, 2, 3]);
      expect(s.selectionMode).toBe(true);
    });

    it('clearSelection resets selection', () => {
      const dirty = { ...initial, selectionMode: true, selected: [1, 2] };
      const s = reducer(dirty, clearSelection());
      expect(s.selectionMode).toBe(false);
      expect(s.selected).toEqual([]);
    });
  });

  describe('thunk handlers', () => {
    it('loadDocuments.fulfilled stores documents', () => {
      const payload = [{ id: 1, name: 'x.pdf' }, { id: 2, name: 'y.pdf' }];
      const s = reducer(initial, { type: loadDocuments.fulfilled.type, payload });
      expect(s.loading).toBe(false);
      expect(s.documents).toHaveLength(2);
    });

    it('loadCategories.fulfilled stores categories', () => {
      const payload = { total: 5, pendingSign: 1, buckets: [{ category: 'invoice', total: 3 }] };
      const s = reducer(initial, { type: loadCategories.fulfilled.type, payload });
      expect(s.categories.total).toBe(5);
      expect(s.categories.buckets[0].category).toBe('invoice');
    });

    it('bulkDownload.fulfilled clears selection', () => {
      const dirty = {
        ...initial,
        selectionMode: true,
        selected: [1, 2],
        bulkBusy: true,
      };
      const s = reducer(dirty, { type: bulkDownload.fulfilled.type, payload: {} });
      expect(s.selectionMode).toBe(false);
      expect(s.selected).toEqual([]);
      expect(s.bulkBusy).toBe(false);
    });

    it('bulkDownload.rejected captures the error', () => {
      const s = reducer(initial, { type: bulkDownload.rejected.type, payload: 'gateway down' });
      expect(s.bulkBusy).toBe(false);
      expect(s.error).toBe('gateway down');
    });
  });
});
