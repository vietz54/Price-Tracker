import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import App from "./App";
import AdminPage from "./components/AdminPage";
import "./index.css";

const Index = () => {
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
    };

    return (
        <React.StrictMode>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={
                            isLoggedIn ? (
                                <App isLoggedIn={isLoggedIn} onLogout={handleLogout} />
                            ) : (
                                <Login onLogin={handleLogin} />
                            )
                        }
                    />
                    <Route path="/admin/users" element={<AdminPage />} />
                </Routes>
            </BrowserRouter>
        </React.StrictMode>
    );
};

ReactDOM.render(<Index />, document.getElementById("root"));
