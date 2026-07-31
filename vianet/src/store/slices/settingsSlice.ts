import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface ControlCategory {
  category: string
  items: number
  value: number
  status: string
}

export interface ControlSetting {
  id: string
  label: string
  description: string
  defaultEnabled: boolean
}

export interface GroupSetting {
  group: string
  maxQty: number
  allowDiscount: boolean
  autoApprove: boolean
  active: boolean
  accessibleStockCount?: number
}

export interface SettingsState {
  categories: ControlCategory[]
  controlSettings: ControlSetting[]
  groupSettings: GroupSetting[]
  profile: Record<string, unknown> | null
  syncTables: { tablename: string }[]
}

const initialState: SettingsState = {
  categories: [],
  controlSettings: [],
  groupSettings: [],
  profile: null,
  syncTables: [],
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setCategories(state, action: PayloadAction<ControlCategory[]>) {
      state.categories = action.payload
    },
    setControlSettings(state, action: PayloadAction<ControlSetting[]>) {
      state.controlSettings = action.payload
    },
    toggleSetting(state, action: PayloadAction<string>) {
      state.controlSettings = state.controlSettings.map(s =>
        s.id === action.payload ? { ...s, defaultEnabled: !s.defaultEnabled } : s
      )
    },
    setGroupSettings(state, action: PayloadAction<GroupSetting[]>) {
      state.groupSettings = action.payload
    },
    toggleGroup(state, action: PayloadAction<string>) {
      state.groupSettings = state.groupSettings.map(g =>
        g.group === action.payload ? { ...g, active: !g.active } : g
      )
    },
    setProfile(state, action: PayloadAction<Record<string, unknown> | null>) {
      state.profile = action.payload
    },
    setSyncTables(state, action: PayloadAction<{ tablename: string }[]>) {
      state.syncTables = action.payload
    },
    resetSettings(state) {
      state.categories = []
      state.controlSettings = []
      state.groupSettings = []
      state.profile = null
      state.syncTables = []
    },
  },
})

export const {
  setCategories,
  setControlSettings,
  toggleSetting,
  setGroupSettings,
  toggleGroup,
  setProfile,
  setSyncTables,
  resetSettings,
} = settingsSlice.actions

export default settingsSlice.reducer
