from rest_framework import serializers
from .models import Location, Item, ActivityLog, DeviceUnit, Ticket


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'item', 'action', 'action_display', 'description', 'performed_by', 'created_at']


class DeviceUnitSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    serial_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = DeviceUnit
        fields = [
            'id', 'item', 'item_name', 'serial_number', 'location', 'location_name',
            'status', 'remarks', 'created_at', 'updated_at'
        ]

    def validate_serial_number(self, value):
        """Validate that serial_number is unique"""
        if not value:
            return value
        
        # Check if serial_number already exists
        queryset = DeviceUnit.objects.filter(serial_number=value)
        
        # Exclude the current instance during update
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError(
                f"Device with serial number '{value}' already exists. Please use a different device number."
            )
        
        return value


class TicketSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    device_serial_number = serializers.CharField(source='device_unit.serial_number', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'item', 'item_name', 'device_unit', 'device_serial_number', 'device_no', 'raised_by',
            'location', 'location_name', 'problem', 'status', 'raised_at',
            'assigned_to', 'resolved_by', 'resolved_at', 'time_taken_minutes', 'suggestions'
        ]


class ItemSerializer(serializers.ModelSerializer):
    quantity = serializers.IntegerField(required=False, default=1)
    location_name = serializers.CharField(source='location.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    activity_logs = ActivityLogSerializer(many=True, read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'quantity', 'location', 'location_name',
            'status', 'status_display', 'remarks', 'activity_logs',
            'created_at', 'updated_at'
        ]


class ItemListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list view"""
    location_name = serializers.CharField(source='location.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'quantity', 'location', 'location_name',
            'status', 'status_display', 'updated_at'
        ]
