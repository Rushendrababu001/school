import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from inventory.models import Item

print("Restoring items...")

items_to_create = [
    {'name': 'CPU', 'quantity': 0, 'status': 'working'},
    {'name': 'PRINTER', 'quantity': 0, 'status': 'working'},
    {'name': 'MONITOR', 'quantity': 0, 'status': 'working'},
    {'name': 'PROJECTOR', 'quantity': 0, 'status': 'working'},
]

for item_data in items_to_create:
    item, created = Item.objects.get_or_create(
        name=item_data['name'],
        defaults={'quantity': item_data['quantity'], 'status': item_data['status']}
    )
    if created:
        print(f"✓ Created: {item.name}")
    else:
        print(f"✓ Already exists: {item.name}")

print("\nItems restored successfully!")
