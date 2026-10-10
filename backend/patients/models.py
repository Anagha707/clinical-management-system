from django.db import models


class Patient(models.Model):
    patient_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True
    )

    name = models.CharField(max_length=100)

    dob = models.DateField()

    gender = models.CharField(max_length=100)

    age = models.PositiveIntegerField()

    address = models.TextField()

    phone = models.CharField(
        max_length=10,
        unique=True
    )

    blood_group = models.CharField(max_length=5)

    status = models.CharField(
        max_length=20,
        default="Active"
    )

    def save(self, *args, **kwargs):
        if not self.patient_id:
            last_number = 0

            patients = Patient.objects.exclude(
                patient_id__isnull=True
            ).exclude(
                patient_id=""
            )

            for patient in patients:
                try:
                    number = int(
                        patient.patient_id.replace("PAT", "")
                    )
                    last_number = max(last_number, number)
                except (ValueError, AttributeError):
                    continue

            self.patient_id = f"PAT{last_number + 1:03d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient_id} - {self.name}"