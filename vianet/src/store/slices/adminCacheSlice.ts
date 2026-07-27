import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AdminCacheState {
  [key: string]: unknown
}

const initialState: AdminCacheState = {}

const adminCacheSlice = createSlice({
  name: 'adminCache',
  initialState,
  reducers: {
    setCache(state, action: PayloadAction<{ key: string; data: unknown }>) {
      state[action.payload.key] = action.payload.data
    },
    clearCache(state) {
      return {}
    },
    removeCache(state, action: PayloadAction<string>) {
      delete state[action.payload]
    },
  },
})

export const { setCache, clearCache, removeCache } = adminCacheSlice.actions
export default adminCacheSlice.reducer
