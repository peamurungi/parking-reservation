from django.db import models


# managed = False: the tables are created in Supabase by supabase/schema.sql.
# Django only reads/writes them. (Tests turn managed on, see parking/runner.py.)
class Slot(models.Model):
    code = models.TextField(unique=True)
    zone = models.TextField()

    class Meta:
        managed = False
        db_table = "slots"
        ordering = ["code"]


class Profile(models.Model):
    user_id = models.UUIDField(primary_key=True)
    role = models.TextField(default="driver")

    class Meta:
        managed = False
        db_table = "profiles"


class Reservation(models.Model):
    slot = models.ForeignKey(Slot, on_delete=models.PROTECT, db_column="slot_id")
    user_id = models.UUIDField()
    plate = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "reservations"
        ordering = ["-start_time"]
