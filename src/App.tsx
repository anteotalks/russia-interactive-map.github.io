import React from 'react';
import { MapPage } from './pages/MapPage';

function App() {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <MapPage />
    </div>
  );
}

export default App;
