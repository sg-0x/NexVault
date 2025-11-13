// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop";
import SmoothScroll from "./Components/SmoothScroll"; // ← add this
import NavMenu from "./Components/NavMenu";
import Dashboard from "./Pages/Dashboard";
import Login from "./Pages/Login";
import AccessControl from "./Pages/AccessControl";
import UploadFile from "./Pages/UploadFile";
import Profile from "./Pages/Profile";
import Settings from "./Pages/Settings";

const App = () => {
  return (
    <div className="">
      <BrowserRouter>
        {/* 🌀 Global smooth scrolling */}
        <SmoothScroll />

        <ScrollToTop>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <>
                  <NavMenu />
                  <div className="mt-20" />
                  <Dashboard />
                </>
              }
            />

            <Route
              path="/upload-file"
              element={
                <>
                  <NavMenu />
                  <div className="mt-20" />
                  <UploadFile />
                </>
              }
            />

            <Route
              path="/access-control"
              element={
                <>
                  <NavMenu />
                  <div className="mt-20" />
                  <AccessControl />
                </>
              }
            />

            <Route
              path="/profile"
              element={
                <>
                  <NavMenu />
                  <div className="mt-20" />
                  <Profile />
                </>
              }
            />

            <Route
              path="/settings"
              element={
                <>
                  <NavMenu />
                  <div className="mt-20" />
                  <Settings />
                </>
              }
            />
          </Routes>
        </ScrollToTop>
      </BrowserRouter>
    </div>
  );
};

export default App;
