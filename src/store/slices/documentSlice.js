import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { documentApi } from '../../api/documentApi';

export const loadDocuments = createAsyncThunk(
  'documents/load',
  async ({ bookingId, ...filters }) => documentApi.list(bookingId, filters),
);

export const loadCategories = createAsyncThunk(
  'documents/loadCategories',
  async bookingId => documentApi.categories(bookingId),
);

export const bulkDownload = createAsyncThunk(
  'documents/bulkDownload',
  async ({ bookingId, ids }, { rejectWithValue }) => {
    try {
      return await documentApi.bulkDownload(bookingId, ids);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || 'Bulk download failed');
    }
  },
);

export const logDocumentView = createAsyncThunk(
  'documents/view',
  async ({ bookingId, docId, source }) => documentApi.logView(bookingId, docId, source),
);

export const logDocumentShare = createAsyncThunk(
  'documents/share',
  async ({ bookingId, ids, channel, recipient }) =>
    documentApi.logShare(bookingId, ids, channel, recipient),
);

const initialState = {
  documents: [],
  categories: { total: 0, pendingSign: 0, buckets: [] },
  loading: false,
  categoriesLoading: false,
  error: null,
  filters: { search: '', category: 'all', from: '', to: '' },
  selectionMode: false,
  selected: [],
  viewMode: 'grid', // 'grid' | 'list'
  bulkBusy: false,
};

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },
    setViewMode(state, action) {
      state.viewMode = action.payload;
    },
    enterSelection(state, action) {
      state.selectionMode = true;
      state.selected = action.payload ? [action.payload] : [];
    },
    toggleSelected(state, action) {
      const id = action.payload;
      const idx = state.selected.indexOf(id);
      if (idx >= 0) state.selected.splice(idx, 1);
      else state.selected.push(id);
      // exit selection mode automatically when last item is removed
      if (state.selected.length === 0) state.selectionMode = false;
    },
    selectAll(state) {
      state.selectionMode = true;
      state.selected = state.documents.map(d => d.id);
    },
    clearSelection(state) {
      state.selectionMode = false;
      state.selected = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadDocuments.pending, state => { state.loading = true; state.error = null; })
      .addCase(loadDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
      })
      .addCase(loadDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to load documents';
      })
      .addCase(loadCategories.pending, state => { state.categoriesLoading = true; })
      .addCase(loadCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(loadCategories.rejected, state => { state.categoriesLoading = false; })
      .addCase(bulkDownload.pending, state => { state.bulkBusy = true; })
      .addCase(bulkDownload.fulfilled, state => {
        state.bulkBusy = false;
        state.selected = [];
        state.selectionMode = false;
      })
      .addCase(bulkDownload.rejected, (state, action) => {
        state.bulkBusy = false;
        state.error = action.payload || 'Bulk download failed';
      });
  },
});

export const {
  setFilters, resetFilters, setViewMode,
  enterSelection, toggleSelected, selectAll, clearSelection,
} = documentSlice.actions;

export default documentSlice.reducer;
