from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Job


class JobApiTests(APITestCase):
    def setUp(self):
        self.job = Job.objects.create(
            id="job_brightpath_uiux_001",
            employer_id="employer_brightpath",
            title="UI/UX Intern",
            company_name="BrightPath Digital",
            job_type="Internship",
            work_setup="Hybrid",
            schedule="Flexible",
            description="Support design tasks for client projects.",
            requirements="Portfolio preferred.",
            required_skills=["Figma", "Wireframing"],
            location="Olongapo City",
            slots=1,
            status=Job.STATUS_ACTIVE,
        )

    def test_job_detail_accepts_string_primary_key(self):
        response = self.client.get(reverse("job-detail", kwargs={"pk": self.job.pk}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.job.pk)
