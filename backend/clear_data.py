import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from inventory.models import Item, DeviceUnit, Ticket, ActivityLog

# Delete all data
print("Deleting all data...")
items_count = Item.objects.count()
devices_count = DeviceUnit.objects.count()
tickets_count = Ticket.objects.count()
logs_count = ActivityLog.objects.count()

Item.objects.all().delete()
DeviceUnit.objects.all().delete()
Ticket.objects.all().delete()
ActivityLog.objects.all().delete()

print(f"✓ Deleted {items_count} items")
print(f"✓ Deleted {devices_count} device units")
print(f"✓ Deleted {tickets_count} tickets")
print(f"✓ Deleted {logs_count} activity logs")
print("\nAll mock data cleared! Ready for your own data.")
