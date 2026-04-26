from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MatchResult, ParsedProfile
from .serializers import MatchResultSerializer, ParsedProfileSerializer
from students.models import Resume


class MatchResultListView(generics.ListAPIView):
    """
    GET /api/ai/matches/?student=<id>
    GET /api/ai/matches/?job=<id>
    GET /api/ai/matches/?resume=<id>
    Returns ranked match results filtered by student, job, or resume.
    """
    serializer_class = MatchResultSerializer

    def get_queryset(self):
        qs = MatchResult.objects.select_related("student", "job", "resume")
        student_id = self.request.query_params.get("student")
        job_id = self.request.query_params.get("job")
        resume_id = self.request.query_params.get("resume")
        if student_id:
            qs = qs.filter(student_id=student_id)
        if job_id:
            qs = qs.filter(job_id=job_id)
        if resume_id:
            qs = qs.filter(resume_id=resume_id)
        return qs.order_by("-match_percentage")


class MatchResultDetailView(generics.RetrieveAPIView):
    queryset = MatchResult.objects.select_related("student", "job", "resume")
    serializer_class = MatchResultSerializer


class ParsedProfileView(generics.RetrieveAPIView):
    """
    GET /api/ai/parsed-profile/<resume_id>/
    Returns the parsed profile for a given resume.
    """
    serializer_class = ParsedProfileSerializer
    lookup_field = "resume_id"

    def get_object(self):
        resume_id = self.kwargs["resume_id"]
        return ParsedProfile.objects.get(resume_id=resume_id)

    def get(self, request, *args, **kwargs):
        try:
            return super().get(request, *args, **kwargs)
        except ParsedProfile.DoesNotExist:
            return Response(
                {"detail": "No parsed profile found for this resume."},
                status=status.HTTP_404_NOT_FOUND,
            )


class TriggerMatchView(APIView):
    """
    POST /api/ai/match/trigger/
    Body: { "resume_id": <int> }

    Runs the full matcher synchronously for now (pre-Celery).
    Once Celery is wired, this will queue the task instead.
    """

    def post(self, request, *args, **kwargs):
        resume_id = request.data.get("resume_id")
        if not resume_id:
            return Response(
                {"detail": "resume_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resume = Resume.objects.select_related("student").get(id=resume_id)
        except Resume.DoesNotExist:
            return Response(
                {"detail": "Resume not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if resume.status != Resume.STATUS_READY:
            return Response(
                {"detail": f"Resume is not ready for matching. Current status: {resume.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from ai.matcher import match_resume_to_jobs
            results = match_resume_to_jobs(resume)
            return Response(
                {"matched": len(results), "results": MatchResultSerializer(results, many=True).data},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"detail": f"Matching failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )