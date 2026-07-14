import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE } from 'redux-persist'

export interface StockItem {
  id: number; name: string; brand: string; model: string; variant: string; color: string;
  qty: number; price: number; gst: number; min: number; max: number;
}

export interface SkuRow {
  sku: string; name: string; brand: string; qty: number; price: number;
  accessGroups: { group: string; qty: number; price: number }[];
  status: string;
}

export interface GroupStock {
  sku: string; name: string; brand: string; qty: number; price: number;
}

export interface AccessGroupDetailData {
  item: { sku: string; name: string; brand: string; status: string; accessGroups: { group: string; qty: number; price: number }[] };
  accessGroup: { group: string; qty: number; price: number };
  privileges: string[];
  groupStocks: GroupStock[];
  stockConfig: { maxQty: number; allowDiscount: boolean; autoApprove: boolean; notes: string };
}

export interface AccessGroup {
  id: number; group: string; members: number; permissions: string[]; status: string;
}

export interface StockPagination {
  offset: number
  limit: number
  total: number
}

export interface InventoryState {
  stockItems: StockItem[]
  stockPagination: StockPagination
  skuData: SkuRow[]
  currentStockDetail: StockItem | null
  currentAccessGroupDetail: AccessGroupDetailData | null
  allAccessGroups: AccessGroup[]
}

const initialState: InventoryState = {
  stockItems: [],
  stockPagination: { offset: 0, limit: 50, total: 0 },
  skuData: [],
  currentStockDetail: null,
  currentAccessGroupDetail: null,
  allAccessGroups: [],
}

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setStockItems(state, action: PayloadAction<StockItem[]>) {
      state.stockItems = action.payload
    },
    appendStockItems(state, action: PayloadAction<{ items: StockItem[]; total: number; offset: number }>) {
      const { items, total, offset } = action.payload
      if (offset === 0) {
        state.stockItems = items
      } else {
        const existingIds = new Set(state.stockItems.map(i => i.id))
        for (const item of items) {
          if (!existingIds.has(item.id)) {
            state.stockItems.push(item)
            existingIds.add(item.id)
          }
        }
      }
      state.stockPagination = { limit: state.stockPagination.limit, total, offset }
    },
    updateStockItem(state, action: PayloadAction<StockItem>) {
      const idx = state.stockItems.findIndex(i => i.id === action.payload.id)
      if (idx >= 0) state.stockItems[idx] = action.payload
      if (state.currentStockDetail?.id === action.payload.id) state.currentStockDetail = action.payload
    },
    setCurrentStockDetail(state, action: PayloadAction<StockItem | null>) {
      state.currentStockDetail = action.payload
    },
    setSkuData(state, action: PayloadAction<SkuRow[]>) {
      state.skuData = action.payload
    },
    updateSkuItem(state, action: PayloadAction<{ sku: string; updates: Partial<SkuRow> }>) {
      const idx = state.skuData.findIndex(i => i.sku === action.payload.sku)
      if (idx >= 0) state.skuData[idx] = { ...state.skuData[idx], ...action.payload.updates }
    },
    setCurrentAccessGroupDetail(state, action: PayloadAction<AccessGroupDetailData | null>) {
      state.currentAccessGroupDetail = action.payload
    },
    updateAccessGroupStock(state, action: PayloadAction<{ sku: string; qty: number; price: number }>) {
      const { sku, qty, price } = action.payload
      if (state.currentAccessGroupDetail) {
        const item = state.currentAccessGroupDetail.item
        const ag = item.accessGroups.find(a => a.group === state.currentAccessGroupDetail!.accessGroup.group)
        if (ag) { ag.qty = qty; ag.price = price }
        state.currentAccessGroupDetail.groupStocks = state.currentAccessGroupDetail.groupStocks.map(s =>
          s.sku === sku ? { ...s, qty, price } : s
        )
      }
    },
    setAllAccessGroups(state, action: PayloadAction<InventoryState['allAccessGroups']>) {
      state.allAccessGroups = action.payload
    },
    resetStockPagination(state) {
      state.stockItems = []
      state.stockPagination = { offset: 0, limit: state.stockPagination.limit, total: 0 }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state) => {
      if (!state.stockPagination) {
        state.stockPagination = { offset: 0, limit: 50, total: 0 }
      }
    })
  },
})

export const {
  setStockItems,
  appendStockItems,
  updateStockItem,
  setCurrentStockDetail,
  setSkuData,
  updateSkuItem,
  setCurrentAccessGroupDetail,
  updateAccessGroupStock,
  setAllAccessGroups,
  resetStockPagination,
} = inventorySlice.actions

export default inventorySlice.reducer
