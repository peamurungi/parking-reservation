from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("slots", views.SlotViewSet, basename="slot")
router.register("reservations", views.ReservationViewSet, basename="reservation")

urlpatterns = [
    path("me/", views.me),
    path("analytics/revenue-per-day/", views.revenue_per_day),
    path("", include(router.urls)),
]
