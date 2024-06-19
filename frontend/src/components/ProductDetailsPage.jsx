import React from "react";
import ApexCharts from "react-apexcharts";
import "./css/ProductDetailsPage.css";

const ProductDetailsPage = ({ product }) => {
  const {
    name,
    url: productUrl,
    img,
    source,
    created_at: createdAt,
    priceHistory,
  } = product;

  function formatDate(date) {
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const months = ['Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'];
  
    const dayOfWeek = daysOfWeek[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = months[date.getMonth()];
  
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
  
    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;
  
    return `${dayOfWeek}, ${dayOfMonth} ${month} ${hours}:${minutes}:${seconds}`;
  }

  const dates = priceHistory
    .map((history) => formatDate(new Date(history.date)))
    .reverse();
  const prices = priceHistory.map((history) => history.price).reverse();

  const chartData = {
    options: {
      chart: {
        id: "price-chart",
      },
      xaxis: {
        categories: dates,
      },
    },
    series: [
      {
        name: "Price",
        data: prices,
      },
    ],
  };

  return (
    <div className="product-details-page">
      <h2 className="product-name">{name}</h2>
      <img src={img} alt="Product" className="product-image" />
      <p className="product-url">
        URL:{" "}
        <a href={`${source}${productUrl}`} target="_blank" className="product-url-link">
          Xem sản phẩm.
        </a>
      </p>
      <p className="product-source">
        Nguồn:{" "}
        <a target="_blank" href={source} className="product-source-link">
          {source}
        </a>
      </p>
      <p className="product-created-at">
        Giá mới nhất: {formatDate(new Date(createdAt))}
      </p>
      <h2 className="price-history-heading">Lịch sử giá</h2>
      <h3 className="current-price-heading">
        Giá hiện tại: ${prices.length > 0 ? prices[prices.length - 1] : "N/A"}
      </h3>
      <ApexCharts
        options={chartData.options}
        series={chartData.series}
        type="line"
        height={300}
        className="price-chart"
      />
    </div>
  );
};

export default ProductDetailsPage;
