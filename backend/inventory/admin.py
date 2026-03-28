from django.contrib import admin
from .models import Location, Item, ActivityLog, DeviceUnit, Ticket


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']
    ordering = ['name']


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['name']
    fields = ['name']
    search_fields = ['name']
    ordering = ['name']



@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['item', 'action', 'performed_by', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['item__name', 'performed_by']
    readonly_fields = ['created_at']
    ordering = ['-created_at']


@admin.register(DeviceUnit)
class DeviceUnitAdmin(admin.ModelAdmin):
    list_display = ['serial_number', 'item', 'location', 'status']
    list_filter = ['status', 'location', 'item']
    search_fields = ['serial_number', 'item__name', 'location__name']
    ordering = ['-created_at']


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'item', 'location', 'device_no', 'problem', 'status', 'raised_by', 'raised_at', 'time_taken_minutes', 'assigned_to']
    list_filter = ['status', 'raised_at', 'resolved_at']
    search_fields = ['item__name', 'device_no', 'raised_by', 'assigned_to', 'resolved_by']
    ordering = ['-raised_at']
