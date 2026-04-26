from django.urls import path
from .views import (
    StudentListView,
    StudentDetailView,
    ResumeUploadView,
    ResumeListView,
    ResumeDetailView,
)

urlpatterns = [
    # Students
    path("", StudentListView.as_view(), name="student-list"),
    path("<int:pk>/", StudentDetailView.as_view(), name="student-detail"),

    # Resumes
    path("resumes/upload/", ResumeUploadView.as_view(), name="resume-upload"),
    path("<int:student_id>/resumes/", ResumeListView.as_view(), name="student-resumes"),
    path("resumes/<int:pk>/", ResumeDetailView.as_view(), name="resume-detail"),
]
