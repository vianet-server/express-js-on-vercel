import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import authReducer from './slices/authSlice'
import inventoryReducer from './slices/inventorySlice'

const storage = {
  getItem: (key: string) => {
    try {
      return Promise.resolve(localStorage.getItem(key))
    } catch {
      return Promise.resolve(null)
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
      return Promise.resolve(undefined)
    } catch {
      return Promise.resolve(undefined)
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
      return Promise.resolve(undefined)
    } catch {
      return Promise.resolve(undefined)
    }
  },
}

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'inventory'],
}

const rootReducer = combineReducers({
  auth: authReducer,
  inventory: inventoryReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
