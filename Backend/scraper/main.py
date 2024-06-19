import asyncio
from playwright.async_api import async_playwright
import json
import os
from requests import post
from amazon import get_product as get_amazon_product
from amazon import get_ebay_product,get_shopee_product,get_lazada_product,get_alibaba_product


AMAZON = "https://amazon.ca"
EBAY = "https://ebay.ca"
SHOPEE= "https://shopee.com"
LAZADA = "https://lazada.com"
ALIBABA = "https:/alibaba.com"
URLS = {
    AMAZON: {
        "search_field_query": 'input[name="field-keywords"]',
        "search_button_query": 'input[value="Go"]',
        "product_selector": "div.s-card-container",
    },
    EBAY: {
        "search_field_query": 'input[name="_nkw"]',
        "search_button_query": 'input[type="submit"]',
        "product_selector": ".s-item",
    },
    SHOPEE: {
    "search_field_query": 'input[name="q"]',
    "search_button_query": 'button[type="submit"]',
    "product_selector": "div.col-xs-2-4",
}, 
    LAZADA: {
        "search_field_query": 'input[name="q"]',
        "search_button_query": 'button[type="submit"]',
        "product_selector": "div.Ms6aG.MefHh",
    },
    ALIBABA: {
    "search_field_query": 'div.search-bar-input-wrapper input.search-bar-input',  
    "search_button_query": 'button.fy23-icbu-search-bar-inner-button',  
    "product_selector": '.search-card-m-imgarea', 
    }
}

available_urls = URLS.keys()


async def search(metadata, page, search_text):
    print(f"Searching for {search_text} on {page.url}.")

    search_field_query = metadata["search_field_query"]
    search_button_query = metadata["search_button_query"]

    print("Filling input field.")
    search_box = await page.wait_for_selector(search_field_query)
    await search_box.fill(search_text)

    print("Pressing search button.")
    button = await page.wait_for_selector(search_button_query)
    await button.click()

    await page.wait_for_load_state()
    return page


async def get_products(page, search_text, selector, get_product, max_pages=10):
    print("Retrieving products.")

    valid_products = []
    words = search_text.split(" ")

    page_number = 1
    while page_number <= max_pages:
        print(f"Processing page {page_number}.")

        product_divs = await page.query_selector_all(selector)

        tasks = []
        for div in product_divs:
            tasks.append(get_product(div))

        products = await asyncio.gather(*tasks)

        for product in products:
            if not product["price"] or not product["url"]:
                continue

            for word in words:
                if not product["name"] or word.lower() not in product["name"].lower():
                    break
            else:
                valid_products.append(product)
                print(product)

        print(
            f"Total valid products processed from page {page_number}: {len(valid_products)}."
        )

        # chuyển sang next page
        if "amazon" in page.url:
            next_button = await page.query_selector("a.s-pagination-next")
        elif "ebay" in page.url:
            next_button = await page.query_selector("a.pagination__next")
        else:
            print("Unknown website.")
            break

        if next_button:
            print("Clicking next page button.")
            await next_button.click()
            await page.wait_for_timeout(2000)
            page_number += 1
        else:
            print("No more pages to load.")
            break
    return valid_products


def save_results(results, filename="results.json"):
    if not os.path.exists("Scraper"):
        os.makedirs("Scraper")
    file_path = os.path.join("Scraper", filename)

    with open(file_path, "w") as f:
        json.dump(results, f)


def post_results(results, endpoint, search_text, source):
    headers = {"Content-Type": "application/json"}
    data = {"data": results, "search_text": search_text, "source": source}
    base_url = "http://localhost:5000"  # Đặt base URL của server
    full_endpoint = f"{base_url}{endpoint}"

    response = post(full_endpoint, headers=headers, json=data)

    if response.status_code != 200:
        print(f"Failed to post data. Status code: {response.status_code}")
        print("Response text:", response.text)


async def main(url, search_text, response_route):
    metadata = URLS.get(url)
    if not metadata:
        print("Invalid URL.")
        return

    async with async_playwright() as pw:
        print("Connecting to browser.")
        browser = await pw.chromium.launch()
        page = await browser.new_page()
        print("Connected.")

        # Mở trang và tải trang ban đầu
        await page.goto(url, timeout=120000)
        print("Loaded initial page.")

        search_page = await search(metadata, page, search_text)

        if url == AMAZON:
            func = get_amazon_product
        elif url == EBAY:
            func = get_ebay_product
        elif url == SHOPEE:
            func = get_shopee_product
        elif url == LAZADA:
            func = get_lazada_product
        elif url == ALIBABA:
            func = get_alibaba_product
        else:
            raise Exception("Invalid URL.")

        # Lấy sản phẩm
        results = await get_products(
            search_page, search_text, metadata["product_selector"], func, max_pages=10
        )

        print("Sản phẩm đã scrape được:")
        for product in results:
            print(product)

        print("Saving results.")

        post_results(results, response_route, search_text, url)

        await browser.close()


if __name__ == "__main__":
    # Test script
    asyncio.run(main(ALIBABA, "Hat", "/results"))
