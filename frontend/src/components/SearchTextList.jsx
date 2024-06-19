import React from "react";
import "./css/SearchTextList.css";

function SearchTextList({ searchTexts, onSearchTextClick, onDeleteButtonClick }) {
  const handleDeleteButtonClick = (searchText) => {
    onDeleteButtonClick(searchText);
  };

  return (
    <div className="container">
    <div className="search-text-list-container">
    <h2>Tất cả sản phẩm</h2>
    <ul className="search-text-list">
      {searchTexts.map((searchText, index) => (
        <li key={index} className="search-text-item">
          <button onClick={() => onSearchTextClick(searchText)} className="search-text-button">
            {searchText}
          </button>
          <button id="close" onClick={() => handleDeleteButtonClick(searchText)}>Close</button>
        </li>
      ))}
      </ul>
    </div>
    <section className="recommended-section">
        <h2>Gợi ý</h2>
        <ul className="recommended-list">
            <li className="recommended-item">Iphone 14</li>
            <li className="recommended-item">Watches</li>
            <li className="recommended-item">Baby Clothing</li>
            <li className="recommended-item">Hat</li>
            <li className="recommended-item">T-Shirt</li>
            <li className="recommended-item">Shoes</li>
        </ul>
      </section>
  </div>
  );
}

export default SearchTextList;