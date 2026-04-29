from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView

from .models import Job
from .serializers import JobSerializer


class JobListView(ListCreateAPIView):
    serializer_class = JobSerializer

    def get_queryset(self):
        queryset = Job.objects.all()
        status_value = self.request.query_params.get("status")
        if status_value:
            queryset = queryset.filter(status=status_value)
        return queryset


class JobDetailView(RetrieveUpdateAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
