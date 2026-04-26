from django.db import models
from pgvector.django import VectorField


class Job(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_ACTIVE = "active"
    STATUS_CLOSED = "closed"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_CLOSED, "Closed"),
    ]
    id = models.CharField(max_length=100, primary_key=True)
    employer_id = models.CharField(max_length=100, blank=True, default="")
    title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True, db_column="company_name")
    job_type = models.CharField(max_length=100, blank=True, db_column="type")
    work_setup = models.CharField(max_length=100, blank=True, db_column="setup")
    schedule = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    requirements = models.TextField(blank=True, default="")
    required_skills = models.JSONField(default=list, blank=True)
    location = models.CharField(max_length=255, blank=True, default="")
    slots = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    posted_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "jobs"
        ordering = ["-posted_at", "-created_at"]

    def __str__(self) -> str:
        return f"{self.title}"


class JobEmbedding(models.Model):
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name="embedding")
    source_text = models.TextField(blank=True)
    model_name = models.CharField(max_length=100, default="nomic-embed-text")
    embedding = VectorField(dimensions=768)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_embeddings"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Embedding for {self.job.title}"