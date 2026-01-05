import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
// Job Components
import JobList from './components/jobs/JobList';
import JobDetails from './components/jobs/JobDetails';
import MyApplications from './components/jobs/MyApplications';
// Booking Components
import BookingCalendar from './components/booking/BookingCalendar';
import BookingForm from './components/booking/BookingForm';
import MyBookings from './components/booking/MyBookings';
import RateNegotiation from './components/booking/RateNegotiation';
// Document Components
import ExpiringDocuments from './components/documents/ExpiringDocuments';
// Admin Components
import PendingCarsAdmin from './components/admin/PendingCarsAdmin';
import PendingDocumentsAdmin from './components/admin/PendingDocumentsAdmin';
import './App.css';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            {/* Jobs Routes */}
            <Route
              path="/jobs"
              element={
                <PrivateRoute>
                  <JobList />
                </PrivateRoute>
              }
            />
            <Route
              path="/jobs/:jobId"
              element={
                <PrivateRoute>
                  <JobDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-applications"
              element={
                <PrivateRoute>
                  <MyApplications />
                </PrivateRoute>
              }
            />
            {/* Booking Routes */}
            <Route
              path="/cars/:carId/calendar"
              element={
                <PrivateRoute>
                  <BookingCalendar />
                </PrivateRoute>
              }
            />
            <Route
              path="/cars/:carId/book"
              element={
                <PrivateRoute>
                  <BookingForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <PrivateRoute>
                  <MyBookings />
                </PrivateRoute>
              }
            />
            <Route
              path="/cars/:carId/negotiate"
              element={
                <PrivateRoute>
                  <RateNegotiation />
                </PrivateRoute>
              }
            />
            {/* Document Routes */}
            <Route
              path="/my-documents"
              element={
                <PrivateRoute>
                  <ExpiringDocuments />
                </PrivateRoute>
              }
            />
            {/* Admin Routes */}
            <Route
              path="/admin/pending-cars"
              element={
                <AdminRoute>
                  <PendingCarsAdmin />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/pending-documents"
              element={
                <AdminRoute>
                  <PendingDocumentsAdmin />
                </AdminRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
