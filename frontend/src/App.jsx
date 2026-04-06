import { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Flash from './components/Flash';
import Chatbot from './components/Chatbot';
import SplashScreen from './components/SplashScreen';
import ScrollToTop from './components/ScrollToTop';
import { ListingCacheProvider, useListingCache } from './components/ListingCacheContext';
import { ProfileCacheProvider, useProfileCache } from './components/ProfileCacheContext';
import { HostDashboardCacheProvider, useHostDashboardCache } from './components/HostDashboardCacheContext';
import Home from './pages/Home';
import Listings from './pages/Listings';
import ListingShow from './pages/ListingShow';
import NewListing from './pages/NewListing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import HostDashboard from './pages/HostDashboard';
import HostScanner from './pages/HostScanner';
import BookingNew from './pages/BookingNew';
import EditListing from './pages/EditListing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import axios from './config/axios';

import './App.css';

function AppContent() {
  const [currUser, setCurrUser] = useState(() => {
    // Initial check from local storage for instant UI
    const savedUser = localStorage.getItem('grand_user_metadata');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [flash, setFlash] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  // Helper to show flash messages
  const showFlash = useCallback((message, type = 'success') => {
    setFlash({ message, type });
    setTimeout(() => setFlash(null), 3000);
  }, []);

  useEffect(() => {
    // Clean up stale keys left by the old signInWithRedirect flow
    localStorage.removeItem('pending_google_auth');
    localStorage.removeItem('pending_google_signup');

    const checkUser = async () => {
      try {
        const res = await axios.get('/current-user');
        if (res.data.user) {
          const userMetadata = {
            username: res.data.user.username,
            role: res.data.user.role,
            avatar: res.data.user.avatar
          };
          setCurrUser(res.data.user);
          localStorage.setItem('grand_user_metadata', JSON.stringify(userMetadata));
        } else {
          setCurrUser(null);
          localStorage.removeItem('grand_user_metadata');
        }
      } catch (err) {
        console.error("Error checking session", err);
      }
    };
    checkUser();
  }, []);

  const handleLogin = useCallback((user) => {
    console.log("💾 Logging user in to App state:", user.username);
    const userMetadata = {
      username: user.username,
      role: user.role,
      avatar: user.avatar
    };
    setCurrUser(user);
    localStorage.setItem('grand_user_metadata', JSON.stringify(userMetadata));
  }, []);

  const { clearCache: clearListingCache } = useListingCache();
  const { clearCache: clearProfileCache } = useProfileCache();
  const { clearCache: clearHostCache } = useHostDashboardCache();

  const handleLogout = useCallback(async () => {
    try {
      await axios.get('/logout');
      // Clear all caches immediately
      clearListingCache();
      clearProfileCache();
      clearHostCache();
      
      setCurrUser(null);
      localStorage.removeItem('grand_user_metadata');
      showFlash("Logged out successfully");
    } catch (err) {
      showFlash("Logout failed", "error");
    }
  }, [showFlash, clearListingCache, clearProfileCache, clearHostCache]);

  const isHomePage = location.pathname === '/';

  return (
    <div className="d-flex flex-column min-vh-100">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <ScrollToTop />
      <Navbar currUser={currUser} onLogout={handleLogout} />

      <div className={`flex-grow-1 main-content ${!isHomePage ? 'pt-app-nav' : ''}`}>
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
          <Route path="/profile/host/scanner" element={<HostScanner currUser={currUser} showFlash={showFlash} />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </div>

      {currUser && <Chatbot currUser={currUser} />}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ListingCacheProvider>
      <ProfileCacheProvider>
        <HostDashboardCacheProvider>
          <AppContent />
        </HostDashboardCacheProvider>
      </ProfileCacheProvider>
    </ListingCacheProvider>
  );
}

export default App;
