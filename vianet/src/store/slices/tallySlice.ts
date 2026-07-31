import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface LedgerRow {
  id: number | string
  guid: string
  name: string
  address: string[] | null
  mobile: string[] | null
  ledgername: string | null
}

export interface StockRow {
  id: number
  stockname: string
  guid: string
  quantity: string | number
  price: string | number
  masterid: number
  created_at?: string
  updated_at?: string
  costing_meth?: string | null
  unit?: string | null
  data?: Record<string, unknown> | null
}

export interface VoucherRow {
  id: number | string
  guid?: string | null
  date?: string | null
  voucher_type?: string | null
  voucher_number?: string | null
  party_ledger_name?: string | null
  narration?: string | null
  ledgerentries?: Record<string, unknown>[] | null
  inventoryentries?: Record<string, unknown>[] | null
  created_at?: string | null
  billagentname?: string | null
}

export interface SalesRecordRow {
  id: number
  sales_date: string
  voucher_no: string
  party_ledger_name?: string | null
  salesman?: string | null
  parent?: string | null
  voucher_type?: string | null
  inv_qty?: string | null
  bill_amt?: string | number | null
  extra?: Record<string, unknown> | null
}

export interface TallyState {
  ledgers: LedgerRow[]
  stocks: StockRow[]
  vouchers: VoucherRow[]
  salesRecords: SalesRecordRow[]
  loading: boolean
}

const initialState: TallyState = {
  ledgers: [],
  stocks: [],
  vouchers: [],
  salesRecords: [],
  loading: false,
}

const tallySlice = createSlice({
  name: 'tally',
  initialState,
  reducers: {
    setLedgers(state, action: PayloadAction<LedgerRow[]>) {
      state.ledgers = action.payload
    },
    setStocks(state, action: PayloadAction<StockRow[]>) {
      state.stocks = action.payload
    },
    setVouchers(state, action: PayloadAction<VoucherRow[]>) {
      state.vouchers = action.payload
    },
    setSalesRecords(state, action: PayloadAction<SalesRecordRow[]>) {
      state.salesRecords = action.payload
    },
    setTallyLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    resetTally(state) {
      state.ledgers = []
      state.stocks = []
      state.vouchers = []
      state.salesRecords = []
      state.loading = false
    },
  },
})

export const {
  setLedgers,
  setStocks,
  setVouchers,
  setSalesRecords,
  setTallyLoading,
  resetTally,
} = tallySlice.actions

export default tallySlice.reducer
