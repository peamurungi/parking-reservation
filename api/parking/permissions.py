from rest_framework.permissions import BasePermission


class IsSignedIn(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsAttendant(IsSignedIn):
    message = "Attendant role required"

    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "attendant"
