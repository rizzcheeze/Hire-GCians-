from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "company_name",
            "job_type",
            "work_setup",
            "schedule",
            "description",
            "requirements",
            "required_skills",
            "location",
            "slots",
            "status",
            "posted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]