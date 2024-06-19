import React, { useState } from "react";
import ModalComponent from './Modal';
import ProductDetailsPage from "./ProductDetailsPage";
import "./css/PriceHistoryTable.css";
import "./css/TrackedProductList.css";

function PriceHistoryTable({ priceHistory, onClose }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({});

    const [sortOrder, setSortOrder] = useState("asc");
    const [priceFilter, setPriceFilter] = useState("all");
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // xử lý thay đổi giá trị sắp xếp
    const handleSortChange = (event) => {
        setSortOrder(event.target.value);
        setCurrentPage(1); 
    };

    // Hàm xử lý thay đổi giá trị lọc giá
    const handlePriceFilterChange = (event) => {
        setPriceFilter(event.target.value);
        setCurrentPage(1); // Reset trang hiện tại về trang đầu tiên khi thay đổi bộ lọc
    };

    // Hàm lọc và sắp xếp lịch sử giá
    const sortedPriceHistory = () => {
        let filteredPriceHistory = priceHistory;

        // Lọc các sản phẩm dựa trên khoảng giá
        if (priceFilter !== "all") {
            filteredPriceHistory = priceHistory.filter(product => {
                const price = product.priceHistory[0].price;

                if (priceFilter === "0-20") {
                    return price >= 0 && price < 20;
                } else if (priceFilter === "20-50") {
                    return price >= 20 && price < 50;
                } else if (priceFilter === "50-100") {
                    return price >= 50 && price < 100;
                } else if (priceFilter === "100-200") {
                    return price >= 100 && price < 200;
                } else if (priceFilter === "over-200") {
                    return price >= 200;
                }
            });
        }

        // Sắp xếp sản phẩm theo thứ tự được chọn
        if (sortOrder === "newest") {
            // Lọc và sắp xếp các sản phẩm theo thay đổi giá
            const productsWithChange = filteredPriceHistory.filter(product => {
                const change = getPriceChange(product);
                return change !== 0; // Chỉ lấy sản phẩm có thay đổi giá khác 0%
            });

            productsWithChange.sort((a, b) => {
                const changeA = getPriceChange(a);
                const changeB = getPriceChange(b);
                // Sắp xếp theo thay đổi giá giảm dần
                return changeB - changeA;
            });

            // Lọc và sắp xếp các sản phẩm có thay đổi giá = 0% để ở dưới
            const productsWithZeroChange = filteredPriceHistory.filter(product => {
                const change = getPriceChange(product);
                return change === 0; // Lấy sản phẩm có thay đổi giá bằng 0%
            });

            // Trả về danh sách đã được lọc và sắp xếp
            return [...productsWithChange, ...productsWithZeroChange];
        } else {
            // Sắp xếp theo giá cả nếu là asc hoặc desc
            return [...filteredPriceHistory].sort((a, b) => {
                const priceA = a.priceHistory[0].price;
                const priceB = b.priceHistory[0].price;
                return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
            });
        }
    };

    const openModal = (product) => {
        setCurrentProduct(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const getPriceData = (product) => {
        return product.priceHistory[0];
    };

    const getPriceChange = (product) => {
        if (product.priceHistory.length < 2) return 0;
        const currentPrice = product.priceHistory[0].price;
        const lastPrice = product.priceHistory[1].price;
        const change = ((currentPrice - lastPrice) / lastPrice) * 100;
        return Math.round(change * 100) / 100;
    };

    // Tính toán tổng số trang
    const totalPages = Math.ceil(sortedPriceHistory().length / itemsPerPage);

    // Tính toán danh sách sản phẩm trên trang hiện tại
    const currentProducts = sortedPriceHistory().slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div>
            <h2 className="centered">Lịch sử giá sản phẩm</h2>

            {/* Phần sort by và price filter */}
            <div className="sort-and-filter-container">
                <div className="sort-container">
                    <label htmlFor="sortOrder">Sắp xếp:</label>
                    <select id="sortOrder" value={sortOrder} onChange={handleSortChange}>
                        <option value="asc">Thấp đến cao</option>
                        <option value="desc">Cao đến thấp</option>
                        <option value="newest">Thay đổi mới nhất</option>
                    </select>
                </div>

                <div className="price-filter-container">
                    <label htmlFor="priceFilter">Giá:</label>
                    <select id="priceFilter" value={priceFilter} onChange={handlePriceFilterChange}>
                        <option value="all">Tất cả</option>
                        <option value="0-20">0-20$</option>
                        <option value="20-50">20-50$</option>
                        <option value="50-100">50-100$</option>
                        <option value="100-200">100-200$</option>
                        <option value="over-200">Trên 200$</option>
                    </select>
                </div>
            </div>

            <table>
                <thead>
                    <tr className="centered-row">
                        <th>Số.</th>
                        <th>Ngày cập nhật</th>
                        <th>Tên sản phẩm</th>
                        <th>Giá</th>
                        <th>Thay đổi giá</th>
                    </tr>
                </thead>
                <tbody>
                    {currentProducts.map((product, index) => {
                        const priceData = getPriceData(product);
                        const change = getPriceChange(product);
                        const isPriceIncreased = change >= 0;

                        return (
                            <tr key={product.url} className="centered-row">
                                {/* Hiển thị số thứ tự */}
                                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                <td>{priceData.date}</td>
                                <td>
                                    <a onClick={() => openModal(product)} className="product-name-link">
                                        {product.name}
                                    </a>
                                </td>
                                <td>${priceData.price}</td>
                                <td style={
                                    change === 0 ? { color: "white" } :
                                    isPriceIncreased ? { color: "green" } : { color: "red" }
                                }>
                                    {change === 0 ? "" : (isPriceIncreased ? "+" : "")}
                                    {change}%
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Phân trang với nút Previous và Next */}
            <div className="pagination-container">
                 <button onClick={handlePreviousPage} disabled={currentPage === 1} className="pagination-button">
                  Trước
                </button>
                 <span className="pagination-text">Trang {currentPage} of {totalPages}</span>
                  <button onClick={handleNextPage} disabled={currentPage === totalPages} className="pagination-button">
                      Sau
                 </button>
                </div>


            <div className="button-container">
                <button onClick={onClose} className="close-button">
                    <div className="inner">
                        <label>Đóng</label>
                    </div>
                </button>
            </div>

            <ModalComponent
                isOpen={isModalOpen}
                closeModal={closeModal}
                content={<ProductDetailsPage product={currentProduct} />}
            />
        </div>
    );
}

export default PriceHistoryTable;
