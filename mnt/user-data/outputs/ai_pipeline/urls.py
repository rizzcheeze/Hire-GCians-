from django.urls import path
from .views import (
    MatchResultListView,
    MatchResultDetailView,
    ParsedProfileView,
    TriggerMatchView,
)

urlpatterns = [
    path("matches/", MatchResultListView.as_view(), name="match-list"),
    path("matches/<int:pk>/", MatchResultDetailView.as_view(), name="match-detail"),
    path("parsed-profile/<int:resume_id>/", ParsedProfileView.as_view(), name="parsed-profile"),
    path("match/trigger/", TriggerMatchView.as_view(), name="trigger-match"),
]
