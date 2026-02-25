import csv
import json
import random
from datetime import datetime, timedelta

def generate_sales_data(num_records=500):
    countries = ["México", "Colombia", "Argentina", "Chile", "Perú", "Brasil", "Ecuador", "Costa Rica", "Panamá", "Uruguay"]
    categories = {
        "Software": [
            {"name": "Licencia ERP Cloud", "price": 1200.0},
            {"name": "Suscripción Trimestral SaaS", "price": 450.0},
            {"name": "Módulo de Seguridad Pro", "price": 300.0},
            {"name": "API Enterprise Connector", "price": 850.0},
            {"name": "Dashboard BI Premium", "price": 600.0}
        ],
        "Hardware": [
            {"name": "Servidor Rack 2U", "price": 3500.0},
            {"name": "Switch Administrable 48p", "price": 1200.0},
            {"name": "Firewall de Red Gen 3", "price": 2800.0},
            {"name": "Terminal Punto de Venta", "price": 950.0},
            {"name": "Gateway IoT Industrial", "price": 1500.0}
        ]
    }
    customer_types = ["Corporate", "Individual", "Government"]
    
    # Lista de nombres de clientes realistas para métricas
    names = [
        "TechNova Solutions", "Innova Corp", "Alpha Systems", "Global Logistics", 
        "EducaNext", "Financiera del Sur", "BioHealth S.A.", "Constructora Delta", 
        "Retail Global", "Solar Energy SA", "Juan Pérez", "María García", 
        "Carlos Ruiz", "Ana Martínez", "Luis Gómez", "Laura Torres"
    ]
    
    # Lista de nombres de vendedores
    sellers = ["Andrés Mendoza", "Beatriz Soler", "Cristian Vaca", "Diana Rivas"]
    
    start_date = datetime.now() - timedelta(days=365)
    
    records = []
    
    # Gerenerate Records
    for i in range(1, num_records + 1):
        category = random.choice(list(categories.keys()))
        product = random.choice(categories[category])
        region = random.choice(countries)
        customer_type = random.choice(customer_types)
        quantity = random.randint(1, 10)
        price_unit = product["price"]
        price_total = price_unit * quantity
        
        days_offset = random.randint(0, 365)
        sale_date = (start_date + timedelta(days=days_offset)).strftime("%Y-%m-%d %H:%M:%S")
        
        records.append({
            "id": i,
            "sale_date": sale_date,
            "product_name": product["name"],
            "category": category,
            "price_unit": price_unit,
            "quantity": quantity,
            "price_total": price_total,
            "region": region,
            "customer_type": customer_type,
            "customer_name": random.choice(names),
            "seller_name": random.choice(sellers)
        })

    # Save CSV
    with open('sales_sample_n8n.csv', mode='w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)

    # Save JSON
    with open('sales_sample_n8n.json', mode='w', encoding='utf-8') as file:
        json.dump(records, file, indent=4, ensure_ascii=False)

    print(f"Se han generado {num_records} registros en CSV y JSON.")

if __name__ == "__main__":
    generate_sales_data(600)
