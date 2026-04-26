from rest_framework import serializers
from .models import MatchResult, ParsedProfile, StudentEmbedding


class MatchResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    job_title = serializers.CharField(source="job.title", read_only=True)
    company_name = serializers.CharField(source="job.company_name", read_only=True)

    class Meta:
        model = MatchResult
        fields = [
            "id",
            "student",
            "student_name",
            "resume",
            "job",
            "job_title",
            "company_name",
            "similarity",
            "match_percentage",
            "rationale",
            "rationale_model",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ParsedProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParsedProfile
        fields = [
            "id",
            "resume",
            "skills",
            "years_of_experience",
            "education",
            "job_titles",
            "raw_json",
            "parser_model",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
