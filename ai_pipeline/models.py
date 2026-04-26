from django.db import models
from pgvector.django import VectorField


class ParsedProfile(models.Model):
    resume = models.OneToOneField("students.Resume", on_delete=models.CASCADE, related_name="parsed_profile")
    skills = models.JSONField(default=list, blank=True)
    years_of_experience = models.FloatField(null=True, blank=True)
    education = models.JSONField(default=list, blank=True)
    job_titles = models.JSONField(default=list, blank=True)
    raw_json = models.JSONField(default=dict, blank=True)
    parser_model = models.CharField(max_length=100, default="qwen3:4b")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "parsed_profiles"
        ordering = ["-updated_at", "-created_at"]
    
    def __str__(self) -> str:
        return f"Parsed profile for {self.resume.student.full_name}"


class StudentEmbedding(models.Model):
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="embeddings")
    resume = models.OneToOneField("students.Resume", on_delete=models.CASCADE, related_name="embedding")
    source_text = models.TextField(blank=True)
    model_name = models.CharField(max_length=100, default="nomic-embed-text")
    embedding = VectorField(dimensions=768)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "student_embeddings"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Embedding for {self.student.full_name}"


class MatchResult(models.Model):
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="match_results")
    resume = models.ForeignKey("students.Resume", on_delete=models.CASCADE, related_name="match_results", null=True, blank=True)
    job = models.ForeignKey("jobs.Job", on_delete=models.CASCADE, related_name="match_results")
    similarity = models.FloatField(null=True, blank=True)
    match_percentage = models.FloatField(null=True, blank=True)
    rationale = models.TextField(blank=True)
    rationale_model = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "match_results"
        ordering = ["-match_percentage", "-created_at"]
        constraints = [
        models.UniqueConstraint(fields=["resume", "job"], name="unique_resume_job_match"),]

        
    def __str__(self) -> str:
        return f"{self.student.full_name} x {self.job.title} - {self.match_percentage:.2f}%"
