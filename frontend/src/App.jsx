import React from 'react';
import navbar from './components/navbar';
import main from './components/main';
import footer from './components/footer';
import control from './components/control';
import Loader from './components/Loader';

const App = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <navbar />
      <control />
      <Loader />
      <main />
      <footer />
    </div>
  );
};

export default App;