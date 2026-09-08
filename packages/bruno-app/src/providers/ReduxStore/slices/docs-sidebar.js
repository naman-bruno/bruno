import { createSlice } from '@reduxjs/toolkit';
import { openAiSidebar, toggleAiSidebar } from './chat';

const initialState = {
  isOpen: false
};

export const docsSidebarSlice = createSlice({
  name: 'docsSidebar',
  initialState,
  reducers: {
    openDocsSidebar: (state) => {
      state.isOpen = true;
    },
    closeDocsSidebar: (state) => {
      state.isOpen = false;
    },
    toggleDocsSidebar: (state) => {
      state.isOpen = !state.isOpen;
    }
  },
  extraReducers: (builder) => {
    // Docs and AI sidebars share the same slot on the right — opening one
    // closes the other so users never end up with both fighting for width.
    builder
      .addCase(openAiSidebar, (state) => {
        state.isOpen = false;
      })
      .addCase(toggleAiSidebar, (state) => {
        // toggleAiSidebar's payload does not tell us the resulting isOpen, so
        // close the docs sidebar whenever AI toggles — if AI was closing, the
        // docs sidebar being closed too is fine (both closed is a valid state).
        state.isOpen = false;
      });
  }
});

export const { openDocsSidebar, closeDocsSidebar, toggleDocsSidebar } = docsSidebarSlice.actions;

export default docsSidebarSlice.reducer;
