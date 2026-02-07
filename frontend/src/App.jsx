import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Flash from './components/Flash';
import Chatbot from './components/Chatbot';
import ScrollToTop from './components/ScrollToTop';
import { ListingCacheProvider } from './components/ListingCacheContext';
import { ProfileCacheProvider } from './components/ProfileCacheContext';
import { HostDashboardCacheProvider } from './components/HostDashboardCacheContext';
import Home from './pages/Home';
import Listings from './pages/Listings';
import ListingShow from './pages/ListingShow';
import NewListing from './pages/NewListing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import HostDashboard from './pages/HostDashboard';
import BookingNew from './pages/BookingNew';
import EditListing from './pages/EditListing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import axios from './config/axios';

import './App.css';

function App() {
  const [currUser, setCurrUser] = useState(null);
  const [flash, setFlash] = useState(null);

  // Helper to show flash messages
  const showFlash = (message, type = 'success') => {
    setFlash({ message, type });
    setTimeout(() => setFlash(null), 3000);
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await axios.get('/current-user');
        if (res.data.user) {
          setCurrUser(res.data.user);
        }
      } catch (err) {
        console.error("Error checking session", err);
      }
    };
    checkUser();
  }, []);

  const handleLogin = (user) => {
    setCurrUser(user);
  };

  const handleLogout = async () => {
    try {
      await axios.get('/logout');
      setCurrUser(null);
      showFlash("Logged out successfully");
    } catch (err) {
      showFlash("Logout failed", "error");
    }
  };

  return (
    <ListingCacheProvider>
      <ProfileCacheProvider>
        <HostDashboardCacheProvider>
          <div className="d-flex flex-column min-vh-100">
            <ScrollToTop />
            <Navbar currUser={currUser} onLogout={handleLogout} />

            <div className="container flex-grow-1 main-content">
              <Flash message={flash?.message} type={flash?.type} onClose={() => setFlash(null)} />

              <Routes>
                <Route path="/" element={<Home currUser={currUser} />} />
                <Route path="/listings" element={<Listings currUser={currUser} />} />
                <Route path="/listings/new" element={<NewListing currUser={currUser} showFlash={showFlash} />} />
                <Route path="/listings/:id" element={<ListingShow currUser={currUser} showFlash={showFlash} />} />
                <Route path="/listings/:id/edit" element={<EditListing currUser={currUser} showFlash={showFlash} />} />
                <Route path="/listings/:id/book" element={<BookingNew currUser={currUser} showFlash={showFlash} />} />
                <Route path="/login" element={<Login onLogin={handleLogin} showFlash={showFlash} />} />
                <Route path="/signup" element={<Signup onLogin={handleLogin} showFlash={showFlash} />} />
                <Route path="/profile" element={<Profile currUser={currUser} showFlash={showFlash} />} />
                <Route path="/profile/host" element={<HostDashboard currUser={currUser} showFlash={showFlash} />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<div>404 Not Found</div>} />
              </Routes>
            </div>

            <Chatbot currUser={currUser} />
            <Footer />
          </div>
        </HostDashboardCacheProvider>
      </ProfileCacheProvider>
    </ListingCacheProvider>
  );
}

export default App;
