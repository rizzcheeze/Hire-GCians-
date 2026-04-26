from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Student, Resume
from .serializers import StudentSerializer, ResumeSerializer, ResumeUploadSerializer


class StudentListView(generics.ListCreateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class StudentDetailView(generics.RetrieveUpdateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class ResumeUploadView(APIView):
    """
    POST /api/students/resumes/upload/
    Accepts multipart/form-data with:
      - student (int): Student PK
      - file (file): PDF resume

    Creates a Resume record with status=uploaded and queues the
    AI pipeline task (extractor -> parser -> embedder) when Celery
    is wired in. For now the record is created and status is left
    as STATUS_UPLOADED so the task can be triggered manually or
    via the next Celery integration step.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = ResumeUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        resume = serializer.save()

        # TODO: queue Celery task here once wired
        # from tasks.resume_pipeline import process_resume
        # process_resume.delay(resume.id)

        return Response(
            ResumeSerializer(resume).data,
            status=status.HTTP_201_CREATED,
        )


class ResumeListView(generics.ListAPIView):
    serializer_class = ResumeSerializer

    def get_queryset(self):
        student_id = self.kwargs.get("student_id")
        return Resume.objects.filter(student_id=student_id).order_by("-uploaded_at")


class ResumeDetailView(generics.RetrieveAPIView):
    queryset = Resume.objects.all()
    serializer_class = ResumeSerializer