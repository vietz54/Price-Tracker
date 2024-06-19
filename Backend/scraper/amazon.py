from asyncio import gather
from bs4 import BeautifulSoup
import requests
import asyncio
from playwright.async_api import async_playwright
from requests import post

async def get_stock(product_div):
    elements = await product_div.query_selector_all(".a-size-base")
    filtered_elements = [
        element for element in elements if "stock" in await element.inner_text()
    ]
    return filtered_elements


async def get_product(product_div):
    # Query for all elements at once
    image_element_future = product_div.query_selector("img.s-image")
    name_element_future = product_div.query_selector("h2 a span")
    price_element_future = product_div.query_selector("span.a-offscreen")
    url_element_future = product_div.query_selector(
        "a.a-link-normal.s-no-hover.s-underline-text.s-underline-link-text.s-link-style.a-text-normal"
    )

    # Await all queries at once
    image_element, name_element, price_element, url_element = await gather(
        image_element_future,
        name_element_future,
        price_element_future,
        url_element_future,
        # get_stock(product_div)
    )

    # Fetch all attributes and text at once
    image_url = await image_element.get_attribute("src") if image_element else None
    product_name = await name_element.inner_text() if name_element else None
    try:
        print(
            (await price_element.inner_text()).replace("$", "").replace(",", "").strip()
        )
        product_price = (
            float(
                (await price_element.inner_text())
                .replace("$", "")
                .replace(",", "")
                .strip()
            )
            if price_element
            else None
        )
    except:
        product_price = None
    product_url = (
        "/".join((await url_element.get_attribute("href")).split("/")[:4])
        if url_element
        else None
    )

    # stock = stock_element[0] if len(stock_element) > 0 else None

    return {
        "img": image_url,
        "name": product_name,
        "price": product_price,
        "url": product_url,
    }


def post_results(results, endpoint, search_text):
    headers = {"Content-Type": "application/json"}
    data = {"data": results, "search_text": search_text}
    base_url = "http://localhost:5000"  # Đặt base URL của server
    full_endpoint = f"{base_url}{endpoint}"

    response = post(full_endpoint, headers=headers, json=data)

    if response.status_code != 200:
        print(f"Failed to post data. Status code: {response.status_code}")
        print("Response text:", response.text)
    else:
        print("Data posted successfully.")
    


async def get_ebay_product(product_div):
    # Query for the necessary elements on the page
    name_element = await product_div.query_selector(".s-item__title")
    price_element = await product_div.query_selector(".s-item__price")
    image_element = await product_div.query_selector(".s-item__image-wrapper img")
    url_element = await product_div.query_selector(".s-item__link")

    # Fetch all attributes and text at once
    product_name = await name_element.inner_text() if name_element else None
    price_text = await price_element.inner_text() if price_element else None
    image_url = await image_element.get_attribute("src") if image_element else None
    product_url = await url_element.get_attribute("href") if url_element else None

    # Process price
    if price_text:
        # Remove currency symbols and commas
        price_text = price_text.replace("C $", "").replace(",", "")

        # If there is a range, take the lower value
        if "to" in price_text:
            price_text = price_text.split("to")[0]

        # Convert price text to float
        try:
            product_price = float(price_text.strip())   
        except ValueError:
            # Handle invalid price format
            print(f"Invalid price format: {price_text}")
            product_price = None
    else:
        product_price = None

    # Process product URL 
    if product_url:
        # Remove "https://ebay.ca" prefix
        product_url = product_url.replace("https://www.ebay.ca", "")

    # Construct product data dictionary
    product_data = {
        "img": image_url,
        "name": product_name,
        "price": product_price,
        "url": product_url,
    }
    

    return product_data

async def get_shopee_product(product_div):
    # Query for the necessary elements on the page
    name_element = await product_div.query_selector(".qaNIZv .aIGxgT .rlMwAR")
    price_element = await product_div.query_selector(".qaNIZv .WTFwws ._1xk7ak")
    image_element = await product_div.query_selector(".qaNIZv ._2qUyz7 img")
    url_element = await product_div.query_selector(".qaNIZv ._2qUyz7")

    # Fetch all attributes and text at once
    product_name = await name_element.inner_text() if name_element else None
    price_text = await price_element.inner_text() if price_element else None
    image_url = await image_element.get_attribute("src") if image_element else None
    product_url = await url_element.get_attribute("href") if url_element else None

    # Process price
    product_price = None
    if price_text:
        # Convert price text to float
        try:
            product_price = float(price_text.replace("₱", "").replace(",", "").strip())
        except ValueError:
            # Handle invalid price format
            print(f"Invalid price format: {price_text}")

    # Process product URL 
    if product_url:
        # Construct full product URL
        product_url = f"https://shopee.ph{product_url}"

    # Construct product data dictionary
    product_data = {
        "img": image_url,
        "name": product_name,
        "price": product_price,
        "url": product_url,
    }

    return product_data

async def get_lazada_product(product_div):
    # Query for the necessary elements on the page
    name_element = await product_div.query_selector("div.RfADt a")
    price_element = await product_div.query_selector("div.aBrP0 span.ooOxS")
    image_element = await product_div.query_selector("div.Ms6aG.MefHh img")
    url_element = await product_div.query_selector("div.RfADt a")

    # Fetch text content and attributes
    product_name = await name_element.inner_text() if name_element else None
    price_text = await price_element.inner_text() if price_element else None
    image_url = await image_element.get_attribute("src") if image_element else None
    product_url = await url_element.get_attribute("href") if url_element else None

    # Process price
    product_price = None
    if price_text:
        # Remove currency symbols and commas
        price_text = price_text.replace("₫", "").replace(",", "").strip()
        try:
            product_price = float(price_text)
        except ValueError:
            # Handle invalid price format
            print(f"Invalid price format: {price_text}")

    # Process product URL 
    if product_url:
        # Remove Lazada domain prefix
        product_url = product_url.replace("https://www.lazada.vn", "")

    # Construct product data dictionary
    product_data = {
        "name": product_name,
        "price": product_price,
        "image_url": image_url,
        "product_url": product_url,
    }

    return product_data

async def get_alibaba_product(product_div):
    # Query for the necessary elements on the page
    name_element = await product_div.query_selector("h2.search-card-e-title span")  # Targets span within title h2
    price_element = await product_div.query_selector("div.search-card-e-price-main")  # Targets price container div
    image_element = await product_div.query_selector("div.search-card-m-imgarea img")  # Targets image within image area div
    url_element = await product_div.query_selector("h2.search-card-e-title a")

    # Fetch all attributes and text at once
    product_name = await name_element.inner_text() if name_element else None
    price_text = await price_element.inner_text() if price_element else None
    image_url = await image_element.get_attribute("src") if image_element else None
    product_url = await url_element.get_attribute("href") if url_element else None

   
    product_price = None
    if price_text:
        price_text = price_text.strip().replace("$", "").split(" - ")[0]
        try: 
            product_price = float(price_text) 
        except ValueError: 
            print(f"Invalid price format: {price_text}")
            product_price = None  
    else:
        print("Price not found.")
        product_price = None  

    product_data = {
        "img": image_url,
        "name": product_name,
        "price": product_price,
        "url": product_url,
    }

    return product_data