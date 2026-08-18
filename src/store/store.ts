import { configureStore } from '@reduxjs/toolkit';
import { repositoryGraphReducer } from './repositoryGraphSlice';

export const store = configureStore({
  reducer: {
    repositoryGraph: repositoryGraphReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
