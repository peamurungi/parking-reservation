import math
import re
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from .models import Reservation, Slot


class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = ["id", "code", "zone"]

    def validate_code(self, v):
        v = v.strip().upper()
        if not re.fullmatch(r"[A-Z0-9-]{1,10}", v):
            raise serializers.ValidationError("Use 1-10 letters, digits or dashes")
        return v


def calculate_fee(start, end):
    """Fee comes from hours, rounded UP: 61 minutes is charged as 2 hours."""
    hours = math.ceil((end - start).total_seconds() / 3600)
    return hours * settings.RATE_PER_HOUR


def find_overlap(slot, start, end, exclude_id=None):
    """The overlap rule: new_start < existing_end AND new_end > existing_start."""
    qs = Reservation.objects.filter(slot=slot, start_time__lt=end, end_time__gt=start)
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)
    return qs.first()


class ReservationSerializer(serializers.ModelSerializer):
    slot_code = serializers.CharField(source="slot.code", read_only=True)

    class Meta:
        model = Reservation
        fields = ["id", "slot", "slot_code", "user_id", "plate",
                  "start_time", "end_time", "fee", "created_at"]
        read_only_fields = ["id", "user_id", "fee", "created_at"]

    def validate_plate(self, v):
        v = v.strip().upper().replace(" ", "")
        if not re.fullmatch(r"[A-Z0-9]{3,10}", v):
            raise serializers.ValidationError("Plate must be 3-10 letters/digits")
        return v

    def validate(self, data):
        inst = self.instance
        slot = data.get("slot", inst.slot if inst else None)
        start = data.get("start_time", inst.start_time if inst else None)
        end = data.get("end_time", inst.end_time if inst else None)
        if end <= start:
            raise serializers.ValidationError("end_time must be after start_time")
        if end - start > timedelta(hours=24):
            raise serializers.ValidationError("A reservation can last at most 24 hours")
        if not inst and start < timezone.now() - timedelta(minutes=5):
            raise serializers.ValidationError("start_time is in the past")
        clash = find_overlap(slot, start, end, inst.pk if inst else None)
        if clash:
            raise serializers.ValidationError(
                f"Slot {slot.code} is already reserved from "
                f"{clash.start_time:%H:%M} to {clash.end_time:%H:%M} "
                f"on {clash.start_time:%Y-%m-%d}. Choose another time or slot.")
        data["fee"] = calculate_fee(start, end)
        return data
