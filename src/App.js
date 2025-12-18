import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ExperiencePage from './pages/ExperiencePage';
import SetupPage from './pages/SetupPage';
import Footer from './components/layout/Footer';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/experience" element={<ExperiencePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
