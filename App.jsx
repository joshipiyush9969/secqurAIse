import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react'

import dataReducer from "./store/reducer/data"
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Main from './screens/Main';
import { combineReducers, configureStore } from '@reduxjs/toolkit';


const persistConfig = {
  key: "root",
  storage: AsyncStorage,
};

const rootReducer = combineReducers({
  dataReducer:dataReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const Store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

const persistor = persistStore(Store);

export default function App() {
  return (
    <Provider store={Store}>
      <PersistGate persistor={persistor}>
        <Main/>
      </PersistGate>
    </Provider>
  )
}
