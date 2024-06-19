import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchTextList from "./components/SearchTextList";
import PriceHistoryTable from "./components/PriceHistoryTable";
import TrackedProductList from "./components/TrackedProductList";
import "./components/css/App.css";
import "./components/css/button.css";
import "./components/AdminPage";
import { Link } from "react-router-dom";

const URL = "http://localhost:5000";

function App({ isLoggedIn, onLogout }) {
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [searchTexts, setSearchTexts] = useState([]);
  const [newSearchText, setNewSearchText] = useState("");
  const [selectedUrl, setSelectedUrl] = useState("https://amazon.ca");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUniqueSearchTexts();
    checkAdminStatus();
  }, []);

  // trả về danh sách các từ khóa tìm kiếm duy nhất đã được lưu trong cơ sở dữ liệu.
  const fetchUniqueSearchTexts = async () => {
    try {
      const response = await axios.get(`${URL}/unique_search_texts`);
      setSearchTexts(response.data);
    } catch (error) {
      console.error("Error fetching unique search texts:", error);
    }
  };

  const handleSearchTextClick = async (searchText) => {
    try {
      const response = await axios.get(
        `${URL}/results?search_text=${searchText}`
      );
      setPriceHistory(response.data);
      setShowPriceHistory(true);
    } catch (error) {
      console.error("Error fetching price history:", error);
    }
  };

  const handlePriceHistoryClose = () => {
    setShowPriceHistory(false);
    setPriceHistory([]);
  };

  const handleNewSearchTextChange = (event) => {
    setNewSearchText(event.target.value);
  };

  const handleUrlChange = (event) => {
    setSelectedUrl(event.target.value);
  };

  const handleNewSearchTextSubmit = async (event) => {
    event.preventDefault();
    if (newSearchText === "") {
      alert("Nhập một từ khóa trước khi chạy chương trình.");
      return;
    }
    try {
      await axios.post(`${URL}/start-scraper`, {
        search_text: newSearchText,
        url: selectedUrl,
        source: selectedUrl,
      });
      alert("Chương trình khởi động thành công");
      setSearchTexts([...searchTexts, newSearchText]);
      setNewSearchText("");
    } catch (error) {
      alert("Error starting scraper:", error);
    }
  };

  const handleDeleteButtonClick = async (searchText) => {
    try {
      await axios.delete(
        `${URL}/delete-by-search-text?search_text=${searchText}`
      );
      setSearchTexts(searchTexts.filter((text) => text !== searchText));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const response = await axios.get(`${URL}/check-admin-status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setIsAdmin(response.data.isAdmin);
    } catch (error) {
      console.error("Error checking admin status:", error);
      
      setIsAdmin(false);
    }
  };

  return (
    <div>
      <div className="main">
        <div className="header">
          <button className="logout-button" onClick={onLogout}>
            Đăng xuất
          </button>
          {isLoggedIn && isAdmin && ( // Hiển thị nút "Quản lý người dùng" nếu đăng nhập và là admin
            <Link to="/admin/users" className="admin-button">
              Quản lý người dùng
            </Link>
          )}
        </div>
        <form onSubmit={handleNewSearchTextSubmit}>
          <h1>Công cụ tìm kiếm sản phẩm</h1>
          <input
            id="styled-input"
            placeholder="Tìm kiếm sản phẩm:"
            type="text"
            value={newSearchText}
            onChange={handleNewSearchTextChange}
          />
          <button type="submit" className="button-85">
            Tìm Kiếm
          </button>
          <h3>Chọn Website để thu thập thông tin</h3>
          <div className="custom-select">
            <select value={selectedUrl} onChange={handleUrlChange}>
              <option value="https://amazon.ca">Amazon</option>
              <option value="https://ebay.ca">eBay</option>
            </select>
          </div>
        </form>
        <SearchTextList
          searchTexts={searchTexts}
          onSearchTextClick={handleSearchTextClick}
          onDeleteButtonClick={handleDeleteButtonClick}
        />
        <TrackedProductList selectedUrl={selectedUrl} />
      </div>

      {showPriceHistory && (
        <PriceHistoryTable
          priceHistory={priceHistory}
          onClose={handlePriceHistoryClose}
        />
      )}
    </div>
  );
}

export default App;
