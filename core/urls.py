from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/students/", include("students.urls")),
    path("api/jobs/", include("jobs.urls")),
    path("api/ai/", include("ai_pipeline.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)