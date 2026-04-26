from rest_framework import serializers
from .models import Student, Resume


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id",
            "student",
            "original_file_name",
            "mime_type",
            "file_size_bytes",
            "status",
            "needs_ocr",
            "summary",
            "last_error",
            "uploaded_at",
            "queued_at",
            "processed_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "needs_ocr",
            "summary",
            "last_error",
            "uploaded_at",
            "queued_at",
            "processed_at",
        ]


class ResumeUploadSerializer(serializers.ModelSerializer):
    """Used specifically for the upload endpoint — accepts file + student_id."""
    file = serializers.FileField()

    class Meta:
        model = Resume
        fields = ["student", "file"]

    def validate_file(self, value):
        allowed_types = ["application/pdf"]
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Only PDF files are accepted.")
        max_size = 10 * 1024 * 1024  # 10 MB
        if value.size > max_size:
            raise serializers.ValidationError("File size must not exceed 10 MB.")
        return value

    def create(self, validated_data):
        file = validated_data.pop("file")
        resume = Resume.objects.create(
            **validated_data,
            original_file_name=file.name,
            mime_type=file.content_type,
            file_size_bytes=file.size,
            file=file,
            status=Resume.STATUS_UPLOADED,
        )
        return resume


class StudentSerializer(serializers.ModelSerializer):
    resumes = ResumeSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "full_name",
            "email",
            "course",
            "year_level",
            "section",
            "about",
            "availability",
            "preferred_setup",
            "public_profile",
            "created_at",
            "updated_at",
            "resumes",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]