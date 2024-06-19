import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/TrackedProductList.css";

const TrackedProductList = ({ selectedUrl }) => {
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [newTrackedProduct, setNewTrackedProduct] = useState("");

  useEffect(() => {
    fetchTrackedProducts();
  }, []);

  const fetchTrackedProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/tracked-products");
      setTrackedProducts(response.data);
    } catch (error) {
      console.error("Error fetching tracked products:", error);
    }
  };

  const handleNewTrackedProductChange = (event) => {
    setNewTrackedProduct(event.target.value);
  };

  const handleAddTrackedProduct = async () => {
    try {
      if (!newTrackedProduct) {
        alert("Hãy nhập sản phẩm trước khi thêm.");
        return;
      }
      const response = await axios.post("http://localhost:5000/add-tracked-product", {
        name: newTrackedProduct,
      });
      const { id } = response.data;
      setTrackedProducts((prevProducts) => [
        ...prevProducts,
        { id, name: newTrackedProduct, tracked: true },
      ]);
      setNewTrackedProduct("");
    } catch (error) {
      console.error("Error adding tracked product:", error);
    }
  };

  const handleToggleTrackedProduct = async (productId) => {
    try {
      await axios.put(`http://localhost:5000/tracked-product/${productId}`);
      setTrackedProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId
            ? { ...product, tracked: !product.tracked }
            : product
        )
      );
    } catch (error) {
      console.error("Error toggling tracked product:", error);
    }
  };

  const handleRunScraper = async () => {
    try {
      const response = await axios.post("http://localhost:5000/update-tracked-products", { url: selectedUrl });// Gửi URL đã chọn từ frontend
      alert(response.data.message);
    } catch (error) {
      console.error("Error running scraper:", error);
    }
  };

  const handleDeleteUntrackedProducts = async () => {
    try {
      const response = await axios.delete("http://localhost:5000/delete-untracked-products");
      console.log(response.data.message);
      fetchTrackedProducts();
    } catch (error) {
      console.error("Error deleting untracked products:", error);
    }
  };

  return (
    <div className="tracked-product-list-container">
  <h2>Sản phẩm theo dõi</h2>
  <div className="button-container">
    <button onClick={handleRunScraper} className="tracked-button">Thu thập giá sản phẩm</button>
    <button onClick={handleDeleteUntrackedProducts} className="tracked-button">Xóa sản phẩm không theo dõi</button>
  </div>
  <ul className="tracked-product-list">
    {trackedProducts.map((product) => (
      <li key={product.id} className="tracked-product-item">
        <span className="product-name">{product.name}</span>{" "}
        <input  
          type="checkbox"
          onChange={() => handleToggleTrackedProduct(product.id)}
          checked={product.tracked}
        />
      </li>
    ))}
  </ul>
  <div>
    <h3>Thêm sản phẩm theo dõi</h3>
    <div className="div-container"> 
      <input
        type="text"
        value={newTrackedProduct}
        onChange={handleNewTrackedProductChange}
        className="input" 
        placeholder="Thêm mới"
      />
      <button onClick={handleAddTrackedProduct} className="add-button">Thêm</button>
    </div>
  </div>
</div>
  );
};

export default TrackedProductList;
