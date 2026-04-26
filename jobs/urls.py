from django.urls import path
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from .models import Job
from .serializers import JobSerializer


class JobListView(ListCreateAPIView):
    serializer_class = JobSerializer

    def get_queryset(self):
        qs = Job.objects.all()
        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)
        return qs


class JobDetailView(RetrieveUpdateAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer


urlpatterns = [
    path("", JobListView.as_view(), name="job-list"),
    path("<int:pk>/", JobDetailView.as_view(), name="job-detail"),
]