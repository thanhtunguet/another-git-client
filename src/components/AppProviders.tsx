import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '../store/store';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ReduxProvider store={store}>{children}</ReduxProvider>
);
