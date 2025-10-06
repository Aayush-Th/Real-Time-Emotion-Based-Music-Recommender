import React from 'react';
import navbar from './components/navbar';
import main from './components/main';
import footer from './components/footer';

const App = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <navbar />
      <main />
      <footer />
    </div>
  );
};

export default App;