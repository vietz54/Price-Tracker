import React, { useState } from "react";
import "./css/Login.css";
import axios from "axios";
import "./css/Modal.css";

const URL = "http://localhost:5000";

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [errorMessage, setErrorMessage] = useState(""); // Quản lý thông báo lỗi
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const handleConfirmPasswordChange = (event) => {
        setConfirmPassword(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        // Kiểm tra độ dài username và password trong trường hợp đăng ký
        if (isRegistering) {
            if (username.length < 4) {
                setErrorMessage("Username must be at least 4 characters long");
                setTimeout(() => setErrorMessage(""), 4000);
                return;
            }
            if (password.length < 6) {
                setErrorMessage("Password must be at least 6 characters long");
                setTimeout(() => setErrorMessage(""), 4000);
                return;
            }
        }
    
        try {
            let response;
            if (isRegistering) {
                response = await axios.post(`${URL}/register`, {
                    username: username,
                    password: password,
                });
            } else {
                response = await axios.post(`${URL}/login`, {
                    username: username,
                    password: password,
                });
            }
    
            if (response.status === 200) {
                if (isRegistering) {
                    setUsername("");
                    setPassword("");
                    setConfirmPassword("");
                    setIsModalOpen(true);
                } else {
                    onLogin(username);
                }
            } else {
                setErrorMessage(response.data.message || "Unknown error occurred");
                setTimeout(() => setErrorMessage(""), 4000);
            }
        } catch (error) {
            console.error("Error logging in/registering:", error);
    
            // Hiển thị thông báo lỗi phù hợp cho phần đăng nhập
            if (!isRegistering && error.response && error.response.status === 401) {
                setErrorMessage("Invalid username or password");
            } else {
                setErrorMessage("Error logging in/registering. Please try again later.");
            }
    
            setTimeout(() => setErrorMessage(""), 4000);
        }
    };
    

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setErrorMessage(""); 
        setIsModalOpen(false);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsRegistering(false); 
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <form onSubmit={handleSubmit} className="login-form">
                    <h2 className="login-title">{isRegistering ? "Đăng Ký" : "Đăng Nhập"}</h2>
                    <div className="input-wrapper">
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            className="input-field"
                            placeholder="Username"
                            required
                        />
                    </div>
                    <div className="input-wrapper">
                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            className="input-field"
                            placeholder="Password"
                            required
                        />
                    </div>
                    {isRegistering && (
                        <div className="input-wrapper">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                className="input-field"
                                placeholder="Confirm Password"
                                required
                            />
                        </div>
                    )}
                    <button type="submit" className="login-button">
                        {isRegistering ? "Đăng Ký" : "Đăng Nhập"}
                    </button>
                    {errorMessage && (
                        <div className="error-message">{errorMessage}</div>
                    )}
                    <p className="toggle-message">
                        {isRegistering ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
                        <button className="toggle-button" onClick={toggleMode}>
                            {isRegistering ? "Đăng Nhập" : "Đăng Ký"}
                        </button>
                    </p>
                </form>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Đăng ký thành công!</h3>
                        <button className="modal-button" onClick={closeModal}>
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
