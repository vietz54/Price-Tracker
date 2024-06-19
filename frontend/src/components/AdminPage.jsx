import React, { useState, useEffect } from "react";
import axios from "axios";

const URL = "http://localhost:5000";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleEditAdminStatus = async (user, isAdmin) => {
    try {
      const response = await axios.put(`${URL}/users/${user.id}`, {
        is_admin: isAdmin,
      });
      if (response.status === 200) {
        setUsers(users.map((u) => (u.id === user.id ? { ...u, is_admin: isAdmin } : u)));
      } else {
        console.error("Error updating user admin status:", response.data);
      }
    } catch (error) {
      console.error("Error updating user admin status:", error);
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
      try {
        const response = await axios.delete(`${URL}/users/${user.id}`);
        if (response.status === 200) {
          setUsers(users.filter((u) => u.id !== user.id));
        } else {
          console.error("Error deleting user:", response.data);
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleAddUser = async () => {
    try {
      console.log("Adding new user:", { username: newUsername, password: newPassword });
      const response = await axios.post(`${URL}/users`, { 
        username: newUsername,
        password: newPassword,
      });
      console.log("Server response:", response.data);
      if (response.status === 200) {
        fetchUsers();
        setNewUsername("");
        setNewPassword("");
      } else {
        console.error("Error adding user:", response.data);
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  return (
    <div>
      <h1>Quản Lý Người Dùng</h1>
      <div>
        <h2>Thêm người dùng mới</h2>
        <label>
          Tên đăng nhập:
          <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
        </label>
        <label>
          Mật khẩu:
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>
        <button onClick={handleAddUser}>Thêm người dùng</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Tên đăng nhập</th>
            <th>Admin</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>
                <input
                  type="checkbox"
                  checked={user.is_admin}
                  onChange={(e) => handleEditAdminStatus(user, e.target.checked)}
                />
              </td>
              <td>
                <button onClick={() => handleDeleteUser(user)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUsers;
