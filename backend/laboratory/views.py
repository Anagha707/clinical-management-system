from django.db import transaction
from django.utils import timezone

from rest_framework import generics, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsLabTechnician
from admin_panel.models import LabTest
from doctor.models import LabPrescription

from .models import LabResult, LabBill
from .serializers import (
    LabTestSerializer,
    LabPrescriptionSerializer,
    LabResultSerializer,
    LabBillSerializer,
)


# =========================================================
# LAB TESTS
# =========================================================

class LabTestListView(generics.ListAPIView):
    permission_classes = [IsLabTechnician]

    queryset = (
        LabTest.objects
        .all()
        .order_by("id")
    )

    serializer_class = LabTestSerializer


# =========================================================
# LAB PRESCRIPTIONS
# =========================================================

class LabPrescriptionListView(generics.ListAPIView):
    permission_classes = [IsLabTechnician]

    queryset = (
        LabPrescription.objects
        .select_related(
            "consultation",
            "consultation__patient",
            "lab_test",
        )
        .all()
        .order_by("-created_at")
    )

    serializer_class = LabPrescriptionSerializer


# =========================================================
# SAMPLE COLLECTION
# =========================================================

class LabPrescriptionSampleCollectionView(APIView):
    permission_classes = [IsLabTechnician]

    @transaction.atomic
    def patch(self, request, prescription_id):

        try:
            prescription = (
                LabPrescription.objects
                .select_for_update()
                .select_related(
                    "consultation",
                    "consultation__patient",
                    "lab_test",
                )
                .get(id=prescription_id)
            )

        except LabPrescription.DoesNotExist:

            return Response(
                {
                    "detail": "Laboratory prescription not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # -------------------------------------------------
        # Already completed
        # -------------------------------------------------

        if prescription.status == "COMPLETED":

            return Response(
                {
                    "detail": "This laboratory test is already completed."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------------------------------
        # Already collected
        # -------------------------------------------------

        if prescription.status == "SAMPLE_COLLECTED":

            return Response(
                {
                    "detail": "Sample has already been collected."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------------------------------
        # Lab test missing
        # -------------------------------------------------

        if not prescription.lab_test_id:

            return Response(
                {
                    "detail":
                        "This laboratory prescription has no laboratory test assigned."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------------------------------
        # Collect sample
        # -------------------------------------------------

        prescription.status = "SAMPLE_COLLECTED"

        prescription.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return Response(
            {
                "message":
                    "Sample collected successfully.",

                "status":
                    prescription.status,

                "prescription":
                    LabPrescriptionSerializer(
                        prescription
                    ).data,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# LAB RESULTS
# =========================================================

class LabResultListCreateView(
    generics.ListCreateAPIView
):

    permission_classes = [IsLabTechnician]

    queryset = (
        LabResult.objects
        .select_related(
            "patient",
            "lab_prescription",
            "lab_prescription__lab_test",
        )
        .all()
        .order_by("-created_at")
    )

    serializer_class = LabResultSerializer

    @transaction.atomic
    def perform_create(self, serializer):

        prescription_id = (
            serializer.validated_data[
                "lab_prescription"
            ].id
        )

        try:

            lab_prescription = (
                LabPrescription.objects
                .select_for_update()
                .select_related(
                    "consultation",
                    "consultation__patient",
                    "lab_test",
                )
                .get(id=prescription_id)
            )

        except LabPrescription.DoesNotExist:

            raise serializers.ValidationError(
                {
                    "lab_prescription":
                        "Laboratory prescription not found."
                }
            )

        # -------------------------------------------------
        # Lab test must exist
        # -------------------------------------------------

        if not lab_prescription.lab_test_id:

            raise serializers.ValidationError(
                {
                    "lab_prescription":
                        "This laboratory prescription has no laboratory test assigned."
                }
            )

        # -------------------------------------------------
        # Prevent duplicate result
        # -------------------------------------------------

        if LabResult.objects.filter(
            lab_prescription=lab_prescription
        ).exists():

            raise serializers.ValidationError(
                {
                    "lab_prescription":
                        "A laboratory result already exists for this prescription."
                }
            )

        # -------------------------------------------------
        # Sample must be collected first
        # -------------------------------------------------

        if lab_prescription.status == "REQUESTED":

            raise serializers.ValidationError(
                {
                    "lab_prescription":
                        "Sample must be collected before entering the laboratory result."
                }
            )

        # -------------------------------------------------
        # Already completed
        # -------------------------------------------------

        if lab_prescription.status == "COMPLETED":

            raise serializers.ValidationError(
                {
                    "lab_prescription":
                        "This laboratory test is already completed."
                }
            )

        patient = (
            lab_prescription
            .consultation
            .patient
        )

        result_status = (
            serializer.validated_data.get(
                "status",
                "COMPLETED",
            )
        )

        if result_status not in [
            "IN_PROGRESS",
            "COMPLETED",
        ]:

            raise serializers.ValidationError(
                {
                    "status":
                        "Invalid laboratory result status."
                }
            )

        completed_at = (
            timezone.now()
            if result_status == "COMPLETED"
            else None
        )

        # -------------------------------------------------
        # Save result
        # -------------------------------------------------

        lab_result = serializer.save(
            patient=patient,
            completed_at=completed_at,
        )

        # -------------------------------------------------
        # Complete prescription
        # -------------------------------------------------

        if result_status == "COMPLETED":

            lab_prescription.status = "COMPLETED"

            lab_prescription.result = (
                lab_result.result
            )

            lab_prescription.save(
                update_fields=[
                    "status",
                    "result",
                    "updated_at",
                ]
            )

        else:

            if lab_prescription.status == "REQUESTED":

                lab_prescription.status = (
                    "SAMPLE_COLLECTED"
                )

                lab_prescription.save(
                    update_fields=[
                        "status",
                        "updated_at",
                    ]
                )


# =========================================================
# LAB BILLING
# =========================================================

class LabBillListCreateView(
    generics.ListCreateAPIView
):

    permission_classes = [IsLabTechnician]

    queryset = (
        LabBill.objects
        .select_related(
            "patient",
            "lab_prescription",
            "lab_prescription__lab_test",
        )
        .all()
        .order_by("-created_at")
    )

    serializer_class = LabBillSerializer

    @transaction.atomic
    def perform_create(self, serializer):

        prescription_id = (
            serializer.validated_data[
                "lab_prescription"
            ].id
        )

        # -------------------------------------------------
        # Lock prescription
        # -------------------------------------------------

        try:

            lab_prescription = (
                LabPrescription.objects
                .select_for_update()
                .select_related(
                    "consultation",
                    "consultation__patient",
                    "lab_test",
                )
                .get(id=prescription_id)
            )

        except LabPrescription.DoesNotExist:

            raise serializers.ValidationError(
                {
                    "lab_prescription":
                        "Laboratory prescription not found."
                }
            )

        # -------------------------------------------------
        # Test must be completed
        # -------------------------------------------------

        if lab_prescription.status != "COMPLETED":

            raise serializers.ValidationError(
                {
                    "lab_prescription":
                        "Cannot generate bill. The laboratory test is not completed."
                }
            )

        # -------------------------------------------------
        # Result must exist
        # -------------------------------------------------

        if not LabResult.objects.filter(
            lab_prescription=lab_prescription
        ).exists():

            raise serializers.ValidationError(
                {
                    "lab_prescription":
                        "Cannot generate bill. Laboratory result not found."
                }
            )

        # -------------------------------------------------
        # Prevent duplicate bill
        # -------------------------------------------------

        if LabBill.objects.filter(
            lab_prescription=lab_prescription
        ).exists():

            raise serializers.ValidationError(
                {
                    "lab_prescription":
                        "A bill already exists for this laboratory prescription."
                }
            )

        # -------------------------------------------------
        # Lab test must exist
        # -------------------------------------------------

        if not lab_prescription.lab_test_id:

            raise serializers.ValidationError(
                {
                    "lab_prescription":
                        "This laboratory prescription has no laboratory test assigned."
                }
            )

        patient = (
            lab_prescription
            .consultation
            .patient
        )

        lab_test = lab_prescription.lab_test

        # -------------------------------------------------
        # Calculate charge
        # -------------------------------------------------

        test_charge = lab_test.price

        total_amount = test_charge

        # -------------------------------------------------
        # CREATE BILL
        # -------------------------------------------------

        # bill_id is generated automatically
        # by LabBill.save()

        serializer.save(
            patient=patient,
            test_charge=test_charge,
            total_amount=total_amount,
            payment_status="PENDING",
        )


# =========================================================
# LAB BILL PAYMENT
# =========================================================

class LabBillPaymentView(APIView):
    permission_classes = [IsLabTechnician]

    @transaction.atomic
    def patch(self, request, bill_id):

        # -------------------------------------------------
        # Lock bill during payment
        # -------------------------------------------------

        try:

            bill = (
                LabBill.objects
                .select_for_update()
                .select_related(
                    "patient",
                    "lab_prescription",
                    "lab_prescription__lab_test",
                )
                .get(id=bill_id)
            )

        except LabBill.DoesNotExist:

            return Response(
                {
                    "detail":
                        "Laboratory bill not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # -------------------------------------------------
        # Already paid
        # -------------------------------------------------

        if bill.payment_status == "PAID":

            return Response(
                {
                    "detail":
                        "This laboratory bill has already been paid.",

                    "bill_id":
                        bill.bill_id,

                    "payment_status":
                        bill.payment_status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------------------------------
        # Bill must be pending
        # -------------------------------------------------

        if bill.payment_status != "PENDING":

            return Response(
                {
                    "detail":
                        "This laboratory bill cannot be paid."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------------------------------
        # Complete payment
        # -------------------------------------------------

        bill.payment_status = "PAID"

        bill.save(
            update_fields=[
                "payment_status",
            ]
        )

        return Response(
            {
                "message":
                    "Laboratory bill payment completed successfully.",

                "bill_id":
                    bill.bill_id,

                "patient":
                    bill.patient.name,

                "total_amount":
                    str(bill.total_amount),

                "payment_status":
                    bill.payment_status,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# LAB SALES
# =========================================================

class LabSalesListView(
    generics.ListAPIView
):

    permission_classes = [IsLabTechnician]

    queryset = (
        LabBill.objects
        .select_related(
            "patient",
            "lab_prescription",
            "lab_prescription__lab_test",
        )
        .all()
        .order_by("-created_at")
    )

    serializer_class = LabBillSerializer