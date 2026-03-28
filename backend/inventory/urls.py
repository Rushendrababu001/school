from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocationViewSet, ItemViewSet, ActivityLogViewSet, DeviceUnitViewSet, TicketViewSet

router = DefaultRouter()
router.register(r'locations', LocationViewSet)
router.register(r'items', ItemViewSet)
router.register(r'activities', ActivityLogViewSet)
router.register(r'device-units', DeviceUnitViewSet)
router.register(r'tickets', TicketViewSet)

app_name = 'inventory'

urlpatterns = [
    path('', include(router.urls)),
]
