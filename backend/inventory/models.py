from django.db import models
from django.core.validators import MinValueValidator
from django.db.models import F
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver


class Location(models.Model):
    """Model for storing location/room information"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Locations'

    def __str__(self):
        return self.name


class Item(models.Model):
    """Model for storing IT inventory items"""
    STATUS_CHOICES = [
        ('working', 'Working'),
        ('damaged', 'Damaged'),
        ('under_repair', 'Under Repair'),
    ]

    name = models.CharField(max_length=200)
    quantity = models.IntegerField(default=1, validators=[MinValueValidator(0)])
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, related_name='items')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='working')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['status']),
            models.Index(fields=['location']),
        ]

    def __str__(self):
        return f"{self.name} (Qty: {self.quantity})"


class ActivityLog(models.Model):
    """Model for logging activities/events related to items"""
    ACTION_CHOICES = [
        ('issue_reported', 'Issue Reported'),
        ('repair_completed', 'Repair Completed'),
        ('item_transferred', 'Item Transferred'),
        ('item_added', 'Item Added'),
        ('item_updated', 'Item Updated'),
        ('item_deleted', 'Item Deleted'),
    ]

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField()
    performed_by = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Activity Logs'
        indexes = [
            models.Index(fields=['item']),
            models.Index(fields=['action']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.item.name} - {self.get_action_display()} on {self.created_at}"


class DeviceUnit(models.Model):
    """Individual unit/device for a given item type"""
    STATUS_CHOICES = [
        ('working', 'Working'),
        ('damaged', 'Damaged'),
        ('under_repair', 'Under Repair'),
    ]

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='device_units')
    serial_number = models.CharField(max_length=128, unique=True, blank=True, null=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='device_units')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='working')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Device Unit'
        verbose_name_plural = 'Device Units'
        indexes = [
            models.Index(fields=['serial_number']),
            models.Index(fields=['item']),
            models.Index(fields=['status']),
            models.Index(fields=['location']),
        ]

    def __str__(self):
        return f"{self.item.name} - {self.serial_number}"


class Ticket(models.Model):
    """Ticket debugging/complaint tracking model"""
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='tickets')
    device_unit = models.ForeignKey(DeviceUnit, null=True, blank=True, on_delete=models.SET_NULL, related_name='tickets')
    device_no = models.CharField(max_length=128, blank=True, null=True)
    raised_by = models.CharField(max_length=200)
    location = models.ForeignKey(Location, null=True, blank=True, on_delete=models.SET_NULL, related_name='tickets')
    problem = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    raised_at = models.DateTimeField(auto_now_add=True)
    resolved_by = models.CharField(max_length=200, blank=True, null=True)
    assigned_to = models.CharField(max_length=200, blank=True, null=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    time_taken_minutes = models.PositiveIntegerField(blank=True, null=True)
    suggestions = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-raised_at']
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'

    def save(self, *args, **kwargs):
        if self.resolved_at and not self.time_taken_minutes:
            delta = self.resolved_at - self.raised_at
            self.time_taken_minutes = int(delta.total_seconds() // 60)
        super().save(*args, **kwargs)

    def __str__(self):
        device_code = self.device_unit.serial_number if self.device_unit else 'N/A'
        return f"Ticket {self.id} - {self.item.name} ({device_code})"


@receiver(post_save, sender=DeviceUnit)
def update_item_quantity_on_create(sender, instance, created, **kwargs):
    if created and instance.item:
        Item.objects.filter(pk=instance.item.pk).update(quantity=F('quantity') + 1)


@receiver(pre_delete, sender=DeviceUnit)
def update_item_quantity_on_delete(sender, instance, **kwargs):
    if instance.item and instance.item.quantity > 0:
        Item.objects.filter(pk=instance.item.pk).update(quantity=F('quantity') - 1)
