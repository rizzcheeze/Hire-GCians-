from django.db import models


class Student(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    course = models.CharField(max_length=255, blank=True)
    year_level = models.PositiveSmallIntegerField(null=True, blank=True)
    section = models.CharField(max_length=50, blank=True)
    about = models.TextField(blank=True)
    availability = models.CharField(max_length=255, blank=True)
    preferred_setup = models.CharField(max_length=100, blank=True)
    public_profile = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "students_student"
        ordering = ["full_name", "email"]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.email})"


class Resume(models.Model):
    STATUS_UPLOADED = "uploaded"
    STATUS_EXTRACTING = "extracting"
    STATUS_OCR_NEEDED = "ocr_needed"
    STATUS_ANALYZING = "analyzing"
    STATUS_READY = "ready"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_UPLOADED, "Uploaded"),
        (STATUS_EXTRACTING, "Extracting"),
        (STATUS_OCR_NEEDED, "OCR Needed"),
        (STATUS_ANALYZING, "Analyzing"),
        (STATUS_READY, "Ready"),
        (STATUS_FAILED, "Failed"),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="resumes")
    file = models.FileField(upload_to="resumes/%Y/%m/%d/", blank=True)
    original_file_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, blank=True)
    file_size_bytes = models.PositiveIntegerField(null=True, blank=True)
    extracted_text = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    needs_ocr = models.BooleanField(default=False)
    last_error = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UPLOADED)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    queued_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "students_resume"
        ordering = ["-uploaded_at", "-created_at"]

    def __str__(self) -> str:
        return f"{self.student.full_name} - {self.original_file_name}"
