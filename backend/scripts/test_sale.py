import requests

url = "http://localhost:8000/ingestion/manual-sale"
payload = {
    "customer_name": "Test",
    "product_name": "Test",
    "quantity": 1,
    "sale_date": "2024-05-15",
    "price": 10.0,
    "price_total": 10.0,
    "payment_method": "Card",
    "seller_name": "Test",
    "category": "Hardware"
}

resp = requests.post(url, json=payload)
print(resp.status_code)
print(resp.text)
