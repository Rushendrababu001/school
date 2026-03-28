from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from .models import Location, Item, ActivityLog, DeviceUnit, Ticket
from .serializers import (
    LocationSerializer, ItemSerializer, ItemListSerializer,
    ActivityLogSerializer, DeviceUnitSerializer, TicketSerializer
)


class LocationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing locations
    """
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class ItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing items
    """
    queryset = Item.objects.select_related('location').prefetch_related('activity_logs')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'location__name']
    ordering_fields = ['name', 'quantity', 'status', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ItemListSerializer
        return ItemSerializer

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Get dashboard statistics
        """
        total_items = Item.objects.aggregate(
            total_quantity=models.Sum('quantity')
        )['total_quantity'] or 0

        total_count = Item.objects.count()
        damaged_count = Item.objects.filter(status='damaged').count()
        under_repair_count = Item.objects.filter(status='under_repair').count()

        # Low stock items (quantity < 5)
        low_stock = Item.objects.filter(quantity__lt=5).count()

        item_list = list(Item.objects.values('id', 'name', 'quantity', 'status').order_by('name'))

        stats = {
            'total_items': total_count,
            'total_quantity': total_items,
            'damaged_items': damaged_count,
            'under_repair_items': under_repair_count,
            'low_stock_items': low_stock,
            'item_list': item_list,
        }
        return Response(stats)

    @action(detail=True, methods=['post'])
    def add_activity(self, request, pk=None):
        """
        Add an activity log for an item
        """
        item = self.get_object()
        serializer = ActivityLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(item=item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Get items with low stock (quantity < 5)
        """
        low_stock_items = Item.objects.filter(quantity__lt=5)
        serializer = ItemListSerializer(low_stock_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """
        Get items filtered by status
        """
        status_filter = request.query_params.get('status', None)
        if status_filter:
            items = Item.objects.filter(status=status_filter)
            serializer = ItemListSerializer(items, many=True)
            return Response(serializer.data)
        return Response({'error': 'status parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def by_location(self, request):
        """
        Get items filtered by location
        """
        location_id = request.query_params.get('location_id', None)
        if location_id:
            items = Item.objects.filter(location_id=location_id)
            serializer = ItemListSerializer(items, many=True)
            return Response(serializer.data)
        return Response({'error': 'location_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing activity logs (read-only)
    """
    queryset = ActivityLog.objects.select_related('item').order_by('-created_at')
    serializer_class = ActivityLogSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['item__name', 'action', 'performed_by']
    ordering_fields = ['created_at', 'action']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'])
    def by_item(self, request):
        """
        Get activity logs for a specific item
        """
        item_id = request.query_params.get('item_id', None)
        if item_id:
            logs = ActivityLog.objects.filter(item_id=item_id).order_by('-created_at')
            serializer = ActivityLogSerializer(logs, many=True)
            return Response(serializer.data)
        return Response({'error': 'item_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)


class DeviceUnitViewSet(viewsets.ModelViewSet):
    """API endpoint for managing individual device units"""
    queryset = DeviceUnit.objects.select_related('item', 'location').all()
    serializer_class = DeviceUnitSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['serial_number', 'item__name', 'location__name', 'status']
    ordering_fields = ['serial_number', 'item', 'status', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        item_id = self.request.query_params.get('item_id')
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        return queryset


class TicketViewSet(viewsets.ModelViewSet):
    """API endpoint for tracking tickets/complaints"""
    queryset = Ticket.objects.select_related('item', 'device_unit', 'location').all()
    serializer_class = TicketSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['item__name', 'device_unit__serial_number', 'raised_by', 'assigned_to', 'resolved_by', 'problem', 'status']
    ordering_fields = ['raised_at', 'status', 'assigned_to', 'resolved_by']
    ordering = ['-raised_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        item_id = self.request.query_params.get('item_id')
        device_unit_id = self.request.query_params.get('device_unit')
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        if device_unit_id:
            queryset = queryset.filter(device_unit_id=device_unit_id)
        return queryset

    @action(detail=False, methods=['get'])
    def by_item(self, request):
        item_id = request.query_params.get('item_id', None)
        if item_id:
            logs = Ticket.objects.filter(item_id=item_id).order_by('-raised_at')
            serializer = TicketSerializer(logs, many=True)
            return Response(serializer.data)
        return Response({'error': 'item_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def open(self, request):
        open_tickets = Ticket.objects.filter(status='open').order_by('-raised_at')
        serializer = TicketSerializer(open_tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def resolved(self, request):
        resolved_tickets = Ticket.objects.filter(status='resolved').order_by('-resolved_at')
        serializer = TicketSerializer(resolved_tickets, many=True)
        return Response(serializer.data)
