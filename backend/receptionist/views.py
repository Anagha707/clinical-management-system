from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsReceptionist

from patients.models import Patient
from appointments.models import Appointment
from admin_panel.models import Doctor

from .models import ConsultationBill
from .serializers import (
    PatientSerializer,
    AppointmentSerializer,
    ConsultationBillSerializer,
)


# ============================================================
# PATIENT LIST / CREATE
# ============================================================

class PatientListCreateView(APIView):
    permission_classes = [IsReceptionist]

    def get(self):

        patients = Patient.objects.all().order_by("-id")

        serializer = PatientSerializer(
            patients,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = PatientSerializer(
            data=request.data
        )

        if serializer.is_valid():

            phone = serializer.validated_data.get("phone")

            if Patient.objects.filter(phone=phone).exists():

                existing_patient = Patient.objects.get(
                    phone=phone
                )

                return Response(
                    {
                        "message": "Patient already exists",
                        "patient": PatientSerializer(
                            existing_patient
                        ).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            patient = serializer.save()

            return Response(
                PatientSerializer(patient).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# PATIENT DETAILS / EDIT / DELETE
# ============================================================

class PatientDetailView(APIView):
    permission_classes = [IsReceptionist]

    # --------------------------------------------------------
    # GET PATIENT
    # --------------------------------------------------------

    def get(self, request, patient_id):

        try:

            patient = Patient.objects.get(
                patient_id=patient_id
            )

        except Patient.DoesNotExist:

            return Response(
                {
                    "error": "Patient not found"
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PatientSerializer(patient)

        return Response(serializer.data)

    # --------------------------------------------------------
    # EDIT PATIENT
    # --------------------------------------------------------

    def patch(self, request, patient_id):

        try:

            patient = Patient.objects.get(
                patient_id=patient_id
            )

        except Patient.DoesNotExist:

            return Response(
                {
                    "error": "Patient not found"
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PatientSerializer(
            patient,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            # Prevent duplicate mobile number
            phone = serializer.validated_data.get(
                "phone"
            )

            if phone:

                existing_patient = Patient.objects.filter(
                    phone=phone
                ).exclude(
                    id=patient.id
                ).first()

                if existing_patient:

                    return Response(
                        {
                            "phone": [
                                "Another patient already uses this mobile number."
                            ]
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            updated_patient = serializer.save()

            return Response(
                PatientSerializer(
                    updated_patient
                ).data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------------
    # DELETE PATIENT
    # --------------------------------------------------------

    def delete(self, request, patient_id):

        try:

            patient = Patient.objects.get(
                patient_id=patient_id
            )

        except Patient.DoesNotExist:

            return Response(
                {
                    "error": "Patient not found"
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ----------------------------------------------------
        # Do not delete patients with appointments
        # ----------------------------------------------------

        if Appointment.objects.filter(
            patient=patient
        ).exists():

            return Response(
                {
                    "error": (
                        "This patient cannot be deleted because "
                        "appointments are associated with the patient."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        patient.delete()

        return Response(
            {
                "message": "Patient deleted successfully."
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# APPOINTMENT LIST / CREATE
# ============================================================

class AppointmentListCreateView(APIView):
    permission_classes = [IsReceptionist]

    # --------------------------------------------------------
    # LIST APPOINTMENTS
    # --------------------------------------------------------

    def get(self, request):

        appointments = Appointment.objects.select_related(
            "patient",
            "doctor"
        ).all().order_by(
            "appointment_date",
            "appointment_time"
        )

        serializer = AppointmentSerializer(
            appointments,
            many=True
        )

        return Response(serializer.data)

    # --------------------------------------------------------
    # CREATE APPOINTMENT
    # --------------------------------------------------------

    def post(self, request):

        serializer = AppointmentSerializer(
            data=request.data
        )

        if serializer.is_valid():

            doctor = serializer.validated_data["doctor"]

            # Only active doctors can receive appointments
            if doctor.status != "Active":

                return Response(
                    {
                        "doctor": (
                            "Appointments can only be created "
                            "for active doctors."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            appointment = serializer.save()

            return Response(
                AppointmentSerializer(
                    appointment
                ).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# CANCEL APPOINTMENT
# ============================================================

class AppointmentCancelView(APIView):
    permission_classes = [IsReceptionist]

    def post(self, request, appointment_id):

        # ----------------------------------------------------
        # Find appointment
        # ----------------------------------------------------

        try:

            appointment = Appointment.objects.select_related(
                "patient",
                "doctor"
            ).get(
                id=appointment_id
            )

        except Appointment.DoesNotExist:

            return Response(
                {
                    "error": "Appointment not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ----------------------------------------------------
        # Already cancelled
        # ----------------------------------------------------

        if appointment.status == "CANCELLED":

            return Response(
                {
                    "message": "Appointment is already cancelled.",
                    "appointment": AppointmentSerializer(
                        appointment
                    ).data,
                },
                status=status.HTTP_200_OK,
            )

        # ----------------------------------------------------
        # Cannot cancel consulted appointment
        # ----------------------------------------------------

        if appointment.status == "CONSULTED":

            return Response(
                {
                    "error": (
                        "A consulted appointment cannot be cancelled."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # Cancel appointment
        # ----------------------------------------------------

        appointment.status = "CANCELLED"

        appointment.save(
            update_fields=["status"]
        )

        return Response(
            {
                "message": "Appointment cancelled successfully.",
                "appointment": AppointmentSerializer(
                    appointment
                ).data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# CONSULTATION BILL LIST / CREATE
# ============================================================

class ConsultationBillListCreateView(APIView):
    permission_classes = [IsReceptionist]

    # --------------------------------------------------------
    # LIST BILLS
    # --------------------------------------------------------

    def get(self, request):

        bills = ConsultationBill.objects.select_related(
            "patient",
            "appointment"
        ).all().order_by(
            "-created_at"
        )

        serializer = ConsultationBillSerializer(
            bills,
            many=True
        )

        return Response(serializer.data)

    # --------------------------------------------------------
    # CREATE BILL
    # --------------------------------------------------------

    def post(self, request):

        serializer = ConsultationBillSerializer(
            data=request.data
        )

        if serializer.is_valid():

            bill = serializer.save()

            return Response(
                ConsultationBillSerializer(
                    bill
                ).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# PAYMENT COMPLETE
# ============================================================

class PaymentCompleteView(APIView):
    permission_classes = [IsReceptionist]

    def post(self, request, bill_id):

        # ----------------------------------------------------
        # Find bill
        # ----------------------------------------------------

        try:

            bill = ConsultationBill.objects.select_related(
                "appointment"
            ).get(
                bill_id=bill_id
            )

        except ConsultationBill.DoesNotExist:

            return Response(
                {
                    "error": "Bill not found"
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ----------------------------------------------------
        # Prevent duplicate payment
        # ----------------------------------------------------

        if bill.payment_status == "COMPLETED":

            return Response(
                {
                    "message": "Payment already completed",
                    "bill_id": bill.bill_id,
                    "payment_status": bill.payment_status,
                    "token_no": bill.appointment.token_no,
                },
                status=status.HTTP_200_OK,
            )

        # ----------------------------------------------------
        # Complete payment
        # ----------------------------------------------------

        bill.payment_status = "COMPLETED"

        bill.save(
            update_fields=["payment_status"]
        )

        # ----------------------------------------------------
        # Generate token
        # ----------------------------------------------------

        appointment = bill.appointment

        if appointment.token_no is None:

            last_token = Appointment.objects.filter(
                appointment_date=appointment.appointment_date
            ).exclude(
                token_no=None
            ).order_by(
                "-token_no"
            ).first()

            if last_token:

                appointment.token_no = (
                    last_token.token_no + 1
                )

            else:

                appointment.token_no = 1

            appointment.save(
                update_fields=["token_no"]
            )

        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return Response(
            {
                "message": "Payment completed",
                "bill_id": bill.bill_id,
                "payment_status": bill.payment_status,
                "token_no": appointment.token_no,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ACTIVE DOCTOR LIST
# ============================================================

class DoctorListView(APIView):
    permission_classes = [IsReceptionist]

    def get(self, request):

        doctors = Doctor.objects.select_related(
            "department"
        ).filter(
            status="Active"
        ).order_by(
            "name"
        )

        data = []

        for doctor in doctors:

            data.append(
                {
                    "id": doctor.id,
                    "doctor_id": doctor.doctor_id,
                    "name": doctor.name,
                    "specialization": doctor.specialization,
                    "department": (
                        doctor.department.name
                        if doctor.department
                        else ""
                    ),
                    "consultation_fee": str(
                        doctor.consultation_fee
                    ),
                    "status": doctor.status,
                }
            )

        return Response(data)