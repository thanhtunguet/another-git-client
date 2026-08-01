import React from 'react';
import ReactDOM from 'react-dom/client';
import { invoke } from '@tauri-apps/api/core';
import { GitClient } from './index';

const isTauriRuntime = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const App: React.FC = () => {
  const [tauriMessage, setTauriMessage] = React.useState('No backend call yet.');
  const [isCalling, setIsCalling] = React.useState(false);

  const callGreet = async () => {
    if (!isTauriRuntime) {
      setTauriMessage('Tauri runtime not detected. Run this via npm run tauri:dev.');
      return;
    }

    setIsCalling(true);
    try {
      const response = await invoke<string>('greet', { name: 'React UI' });
      setTauriMessage(response);
    } catch (error) {
      setTauriMessage(`Invoke failed: ${String(error)}`);
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <>
      <div style={{ padding: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <button onClick={callGreet} disabled={isCalling}>
          {isCalling ? 'Calling Rust...' : 'Call Rust greet()'}
        </button>{' '}
        <span>{tauriMessage}</span>
      </div>
      <GitClient />
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
