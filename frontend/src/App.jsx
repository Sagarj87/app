import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import Register from "./Register";
import Login from "./Login";
import Protected from "./Protected";
import Sidebar from "./Sidebar";
import "./App.css";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import UploadFile from "./UploadFile";

function Dashboard() {
  return <div className="p-8">Dashboard Home</div>;
}
function ListUsers() {
  return <div className="p-8">List Users Page</div>;
}
function AdminRoles() {
  return <div className="p-8">Admin Roles Page</div>;
}
function UserRoles() {
  return <div className="p-8">User Roles Page</div>;
}
function Profile() {
  return <div className="p-8">Profile Page</div>;
}
function ChangePassword() {
  return <div className="p-8">Change Password Page</div>;
}
function TwoFA() {
  return <div className="p-8">2FA Page</div>;
}

function AppContent() {
  const { token, user, logout } = useAuth();
  return (
    <AppRoutes token={token} user={user} logout={logout} />
  );
}

function AppRoutes({ token, user, logout }) {
  const navigate = useNavigate();
  const location = window.location.pathname;
  useEffect(() => {
    if (token && (location === "/" || location === "/login" || location === "/register")) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, navigate, location]);

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-blue-100 to-blue-300">
      {token && <Sidebar />}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <h1 className="text-4xl font-extrabold text-blue-700 mb-6 mt-4">Spring Boot JWT Auth Demo</h1>
        {!token ? (
          <>
            <Register />
            <Login />
          </>
        ) : (
          <div className="w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold text-gray-700">Welcome, {user}!</div>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded focus:outline-none"
              >
                Logout
              </button>
            </div>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users/list" element={<ListUsers />} />
              <Route path="/users/roles/admin" element={<AdminRoles />} />
              <Route path="/users/roles/user" element={<UserRoles />} />
              <Route path="/settings/profile" element={<Profile />} />
              <Route path="/settings/security/password" element={<ChangePassword />} />
              <Route path="/settings/security/2fa" element={<TwoFA />} />
              <Route path="/protected" element={<Protected />} />
              <Route path="/upload" element={<UploadFile />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
