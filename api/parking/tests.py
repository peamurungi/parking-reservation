import uuid
from datetime import timedelta

import jwt
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Profile, Reservation, Slot

SECRET = "test-secret-test-secret-test-secret-123"


def token_for(user_id):
    payload = {"sub": str(user_id), "aud": "authenticated",
               "exp": timezone.now() + timedelta(hours=1)}
    return jwt.encode(payload, SECRET, algorithm="HS256")


@override_settings(SUPABASE_JWT_SECRET=SECRET, RATE_PER_HOUR=1000)
class ParkingApiTests(APITestCase):
    def setUp(self):
        self.driver, self.other, self.att = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
        Profile.objects.create(user_id=self.driver, role="driver")
        Profile.objects.create(user_id=self.other, role="driver")
        Profile.objects.create(user_id=self.att, role="attendant")
        self.slot = Slot.objects.create(code="A1", zone="A")
        self.t0 = timezone.now().replace(minute=0, second=0, microsecond=0) + timedelta(hours=2)

    def as_user(self, uid):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + token_for(uid))

    def body(self, hours=2, start=None, **kw):
        start = start or self.t0
        d = {"slot": self.slot.id, "plate": "rab123a",
             "start_time": start.isoformat(),
             "end_time": (start + timedelta(hours=hours)).isoformat()}
        d.update(kw)
        return d

    # 1. success: 201 and fee computed on the server from hours
    def test_driver_reserves_slot(self):
        self.as_user(self.driver)
        r = self.client.post("/api/reservations/", self.body(hours=2), format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(float(r.data["fee"]), 2000)
        self.assertEqual(r.data["plate"], "RAB123A")
        self.assertEqual(r.data["user_id"], str(self.driver))

    def test_fee_rounds_partial_hours_up(self):
        self.as_user(self.driver)
        b = self.body()
        b["end_time"] = (self.t0 + timedelta(minutes=61)).isoformat()
        r = self.client.post("/api/reservations/", b, format="json")
        self.assertEqual(float(r.data["fee"]), 2000)

    # 2. bad input: 400
    def test_bad_input_returns_400(self):
        self.as_user(self.driver)
        r = self.client.post("/api/reservations/", self.body(hours=-1), format="json")
        self.assertEqual(r.status_code, 400)
        r = self.client.post("/api/reservations/", self.body(plate="!"), format="json")
        self.assertEqual(r.status_code, 400)

    # 3. overlap rule: 400 with a clear message; touching ends are fine
    def test_overlap_rejected_but_back_to_back_allowed(self):
        self.as_user(self.driver)
        self.client.post("/api/reservations/", self.body(hours=2), format="json")
        self.as_user(self.other)
        r = self.client.post("/api/reservations/",
                             self.body(start=self.t0 + timedelta(hours=1)), format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("already reserved", str(r.data))
        r = self.client.post("/api/reservations/",
                             self.body(start=self.t0 + timedelta(hours=2)), format="json")
        self.assertEqual(r.status_code, 201)

    # 4. wrong role: driver cannot create slots or read analytics
    def test_driver_has_wrong_role(self):
        self.as_user(self.driver)
        self.assertEqual(self.client.post("/api/slots/", {"code": "Z9", "zone": "Z"}).status_code, 403)
        self.assertEqual(self.client.get("/api/analytics/revenue-per-day/").status_code, 403)

    # 5. no token / bad token: 401
    def test_missing_or_bad_token_returns_401(self):
        self.assertEqual(self.client.get("/api/slots/").status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer garbage")
        self.assertEqual(self.client.get("/api/slots/").status_code, 401)

    # 6. ownership + 404
    def test_driver_cannot_see_other_drivers_reservation(self):
        self.as_user(self.driver)
        rid = self.client.post("/api/reservations/", self.body(), format="json").data["id"]
        self.as_user(self.other)
        self.assertEqual(self.client.get(f"/api/reservations/{rid}/").status_code, 404)
        self.assertEqual(self.client.delete(f"/api/reservations/{rid}/").status_code, 404)
        self.assertEqual(self.client.get("/api/reservations/99999/").status_code, 404)
        self.assertEqual(self.client.get("/api/reservations/").data["count"], 0)

    # 7. attendant: sees everything, analytics works
    def test_attendant_sees_all_and_revenue_per_day(self):
        self.as_user(self.driver)
        self.client.post("/api/reservations/", self.body(hours=3), format="json")
        self.as_user(self.att)
        self.assertEqual(self.client.get("/api/reservations/").data["count"], 1)
        r = self.client.get("/api/analytics/revenue-per-day/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(float(r.data[0]["revenue"]), 3000)

    # 8. map flag + pagination
    def test_slot_map_shows_occupied_and_reservations_paginate(self):
        Reservation.objects.create(slot=self.slot, user_id=self.driver, plate="X1Y2Z3",
                                   start_time=timezone.now() - timedelta(minutes=10),
                                   end_time=timezone.now() + timedelta(hours=1))
        self.as_user(self.driver)
        self.assertTrue(self.client.get("/api/slots/").data[0]["occupied"])
        for i in range(12):
            Reservation.objects.create(slot=self.slot, user_id=self.driver, plate="ABC123",
                                       start_time=self.t0 + timedelta(hours=3 * i + 5),
                                       end_time=self.t0 + timedelta(hours=3 * i + 6))
        r = self.client.get("/api/reservations/")
        self.assertEqual(len(r.data["results"]), 10)
        self.assertEqual(r.data["count"], 13)
