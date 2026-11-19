from django.db import IntegrityError, transaction
from django.db.models import Count, Sum
from django.db.models.deletion import ProtectedError
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from .models import Reservation, Slot
from .permissions import IsAttendant, IsSignedIn
from .serializers import ReservationSerializer, SlotSerializer


class SlotViewSet(viewsets.ModelViewSet):
    """GET: any signed-in user (with free/occupied flag for the map).
    POST / PATCH / DELETE: attendant only."""
    queryset = Slot.objects.all()
    serializer_class = SlotSerializer
    pagination_class = None  # a car park has few slots; the map needs them all

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsSignedIn()]
        return [IsAttendant()]

    def _at(self):
        raw = self.request.query_params.get("at")
        if not raw:
            return timezone.now()
        at = parse_datetime(raw)
        if at is None or timezone.is_naive(at):
            raise ValidationError({"at": "Use an ISO date-time with timezone"})
        return at

    def list(self, request, *args, **kwargs):
        at = self._at()
        busy = {r.slot_id: r for r in Reservation.objects.filter(start_time__lte=at, end_time__gt=at)}
        rows = []
        for s in self.get_queryset():
            row = SlotSerializer(s).data
            r = busy.get(s.id)
            row["occupied"] = r is not None
            row["reserved_until"] = r.end_time if r else None
            rows.append(row)
        return Response(rows)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({"detail": "Slot has reservations; cannot delete"},
                            status=status.HTTP_409_CONFLICT)


class ReservationViewSet(viewsets.ModelViewSet):
    """Drivers see and change only their own reservations; attendants see all."""
    serializer_class = ReservationSerializer
    permission_classes = [IsSignedIn]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = Reservation.objects.select_related("slot")
        u = self.request.user
        return qs if u.role == "attendant" else qs.filter(user_id=u.id)

    def perform_create(self, serializer):
        # owner comes from the verified token, never from the request body
        self._save(serializer, user_id=self.request.user.id)

    def perform_update(self, serializer):
        self._save(serializer)

    def _save(self, serializer, **extra):
        try:
            with transaction.atomic():
                serializer.save(**extra)
        except IntegrityError:
            # two people clicked at the same moment: the database constraint wins
            raise ValidationError({"non_field_errors": ["That slot was just taken. Pick another."]})

    def perform_destroy(self, instance):
        if instance.start_time <= timezone.now() and self.request.user.role != "attendant":
            raise PermissionDenied("Only an attendant can cancel a reservation that has started")
        instance.delete()


@api_view(["GET"])
@permission_classes([IsAttendant])
def revenue_per_day(request):
    rows = (Reservation.objects.annotate(day=TruncDate("start_time"))
            .values("day").annotate(revenue=Sum("fee"), reservations=Count("id"))
            .order_by("-day"))
    return Response(list(rows))


@api_view(["GET"])
@permission_classes([IsSignedIn])
def me(request):
    return Response({"id": str(request.user.id), "role": request.user.role})
