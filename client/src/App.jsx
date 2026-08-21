import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Auth from "./pages/auth/Auth";
import Chat from "./pages/chat/Chat";
import Profile from "./pages/profile/Profile";

import apiClient from "./lib/api-client";
import { useAppStore } from "./store";
import { GET_USER_INFO } from "./utils/constants";
import Home from "./pages/home/Home";

const PrivateRoute = ({ children }) => {
  const userInfo = useAppStore((state) => state.userInfo);

  return userInfo ? children : <Navigate to="/auth" replace />;
};

const AuthRoute = ({ children }) => {
  const userInfo = useAppStore((state) => state.userInfo);

  return userInfo ? <Navigate to="/chat" replace /> : children;
};

function App() {
  const setUserInfo = useAppStore((state) => state.setUserInfo);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getUserInfo = async () => {
      try {
        const response = await apiClient.get(GET_USER_INFO, {
          withCredentials: true,
        });

        const user = response.data?.user ?? response.data;

        if (response.status === 200 && (user?._id || user?.id)) {
          if (isMounted) {
            setUserInfo(user);
          }
        } else {
          if (isMounted) {
            setUserInfo(undefined);
          }
        }
      } catch (error) {
        if (isMounted) {
          setUserInfo(undefined);
        }

        if (error.response?.status !== 401) {
          console.error("Unable to restore user session:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getUserInfo();

    return () => {
      isMounted = false;
    };
  }, [setUserInfo]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#1b1c24] text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/auth"
          element={
            <AuthRoute>
              <Auth />
            </AuthRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
