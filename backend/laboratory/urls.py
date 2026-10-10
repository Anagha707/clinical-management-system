from django.urls import path

from .views import (
    LabTestListView,
    LabPrescriptionListView,
    LabPrescriptionSampleCollectionView,
    LabResultListCreateView,
    LabBillListCreateView,
    LabBillPaymentView,
    LabSalesListView,
)


urlpatterns = [

    # ========================================================
    # LAB TESTS
    # ========================================================

    path(
        "tests/",
        LabTestListView.as_view(),
        name="lab-tests"
    ),

    # ========================================================
    # LAB PRESCRIPTIONS
    # ========================================================

    path(
        "prescriptions/",
        LabPrescriptionListView.as_view(),
        name="lab-prescriptions"
    ),

    # ========================================================
    # SAMPLE COLLECTION
    # ========================================================

    path(
        "prescriptions/<int:prescription_id>/collect-sample/",
        LabPrescriptionSampleCollectionView.as_view(),
        name="lab-prescription-collect-sample"
    ),

    # ========================================================
    # LAB RESULTS
    # ========================================================

    path(
        "results/",
        LabResultListCreateView.as_view(),
        name="lab-results"
    ),

    # ========================================================
    # LAB BILLING
    # ========================================================

    path(
        "bills/",
        LabBillListCreateView.as_view(),
        name="lab-bills"
    ),

    path(
        "bills/<int:bill_id>/pay/",
        LabBillPaymentView.as_view(),
        name="lab-bill-payment"
    ),

    # ========================================================
    # LAB SALES
    # ========================================================

    path(
        "sales/",
        LabSalesListView.as_view(),
        name="lab-sales"
    ),
]