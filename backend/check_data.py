import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from inventory.models import Item, DeviceUnit, Location, Ticket, ActivityLog
print('Items', Item.objects.count())
print('DeviceUnits', DeviceUnit.objects.count())
print('Locations', Location.objects.count())
print('Tickets', Ticket.objects.count())
print('ActivityLog', ActivityLog.objects.count())
for i in Item.objects.all():
    print(i.id, i.name, i.quantity, i.status, i.location)
