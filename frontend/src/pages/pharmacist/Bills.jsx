import { useEffect, useMemo, useState } from "react";
import {
    Receipt,
    Search,
    CheckCircle,
    Clock,
    IndianRupee,
    RefreshCw,
    CalendarDays,
    User,
    FileText,
    Eye,
    X,
} from "lucide-react";

import PharmacistLayout from "../../components/pharmacist/PharmacistLayout";

import {
    getPharmacistBills,
    payPharmacistBill,
} from "../../services/pharmacistApi";


function Bills() {
    const [bills, setBills] = useState([]);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [selectedBill, setSelectedBill] = useState(null);


    // =====================================================
    // LOAD BILLS
    // =====================================================

    useEffect(() => {
        loadBills();
    }, []);


    const loadBills = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getPharmacistBills();

            const data = Array.isArray(response.data)
                ? response.data
                : [];

            setBills(data);
        } catch (err) {
            console.error("Bills loading error:", err);

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to load pharmacy bills."
            );
        } finally {
            setLoading(false);
        }
    };


    // =====================================================
    // CLEAR MESSAGES
    // =====================================================

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };


    // =====================================================
    // VIEW BILL
    // =====================================================

    const handleViewBill = (bill) => {
        if (!bill) return;

        clearMessages();
        setSelectedBill(bill);
    };

    const closeBillModal = () => {
        setSelectedBill(null);
    };


    // PAYMENT
    // =====================================================

    const handlePayment = async (bill) => {
        if (!bill?.bill_id) {
            setError("Bill ID is missing.");
            return;
        }

        if (bill.payment_status === "PAID") {
            return;
        }

        const confirmed = window.confirm(
            `Mark bill ${bill.bill_id} as paid?`
        );

        if (!confirmed) {
            return;
        }

        setPayingId(bill.bill_id);
        clearMessages();

        try {
            const response = await payPharmacistBill(
                bill.bill_id
            );

            const updatedBill = response.data;

            if (!updatedBill) {
                throw new Error(
                    "Invalid response received from the server."
                );
            }

            setBills((currentBills) =>
                currentBills.map((currentBill) =>
                    currentBill.bill_id === updatedBill.bill_id
                        ? updatedBill
                        : currentBill
                )
            );

            setSuccess(
                `Bill ${bill.bill_id} has been marked as paid.`
            );
        } catch (err) {
            console.error("Payment error:", err);

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Unable to complete payment."
            );
        } finally {
            setPayingId(null);
        }
    };


    // =====================================================
    // SEARCH + FILTER
    // =====================================================

    const filteredBills = useMemo(() => {
        const searchText = search
            .toLowerCase()
            .trim();

        return bills.filter((bill) => {
            const billId = String(
                bill.bill_id || ""
            ).toLowerCase();

            const patientId = String(
                bill.patient_id || ""
            ).toLowerCase();

            const patientName = String(
                bill.patient_name || ""
            ).toLowerCase();

            const appointment = String(
                bill.appointment || ""
            ).toLowerCase();

            const matchesSearch =
                !searchText ||
                billId.includes(searchText) ||
                patientId.includes(searchText) ||
                patientName.includes(searchText) ||
                appointment.includes(searchText);

            const matchesFilter =
                filter === "ALL" ||
                bill.payment_status === filter;

            return (
                matchesSearch &&
                matchesFilter
            );
        });
    }, [bills, search, filter]);


    // =====================================================
    // STATISTICS
    // =====================================================

    const totalBills = bills.length;

    const pendingBills = bills.filter(
        (bill) =>
            bill.payment_status === "PENDING"
    ).length;

    const paidBills = bills.filter(
        (bill) =>
            bill.payment_status === "PAID"
    ).length;


    const totalAmount = bills.reduce(
        (total, bill) =>
            total +
            Number(
                bill.total_amount || 0
            ),
        0
    );

    const pendingAmount = bills
        .filter(
            (bill) =>
                bill.payment_status === "PENDING"
        )
        .reduce(
            (total, bill) =>
                total +
                Number(
                    bill.total_amount || 0
                ),
            0
        );

    const paidAmount = bills
        .filter(
            (bill) =>
                bill.payment_status === "PAID"
        )
        .reduce(
            (total, bill) =>
                total +
                Number(
                    bill.total_amount || 0
                ),
            0
        );


    // =====================================================
    // DATE FORMATTER
    // =====================================================

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        );
    };


    // =====================================================
    // TIME FORMATTER
    // =====================================================

    const formatTime = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }
        );
    };


    // =====================================================
    // CURRENCY FORMATTER
    // =====================================================

    const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    };


    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (status) => {
        return status === "PAID"
            ? "paid"
            : "pending";
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <PharmacistLayout
            title="Pharmacy Bills"
            subtitle="View and manage medicine billing"
        >

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="pharmacist-stats-grid">

                <div className="pharmacist-stat-card">
                    <div className="pharmacist-stat-icon">
                        <Receipt size={22} />
                    </div>

                    <div className="pharmacist-stat-content">
                        <span>Total Bills</span>

                        <strong>
                            {totalBills}
                        </strong>

                        <small>
                            ₹ {formatAmount(totalAmount)}
                        </small>
                    </div>
                </div>


                <div className="pharmacist-stat-card">
                    <div className="pharmacist-stat-icon">
                        <Clock size={22} />
                    </div>

                    <div className="pharmacist-stat-content">
                        <span>Pending</span>

                        <strong>
                            {pendingBills}
                        </strong>

                        <small>
                            ₹ {formatAmount(pendingAmount)}
                        </small>
                    </div>
                </div>


                <div className="pharmacist-stat-card">
                    <div className="pharmacist-stat-icon">
                        <CheckCircle size={22} />
                    </div>

                    <div className="pharmacist-stat-content">
                        <span>Paid</span>

                        <strong>
                            {paidBills}
                        </strong>

                        <small>
                            ₹ {formatAmount(paidAmount)}
                        </small>
                    </div>
                </div>

            </div>


            {/* =================================================
                MESSAGES
            ================================================= */}

            {error && (
                <div className="pharmacist-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="pharmacist-success">
                    {success}
                </div>
            )}


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="pharmacist-toolbar">

                <div className="pharmacist-search-box">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search bill, patient ID, patient name..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            clearMessages();
                        }}
                    />

                </div>


                <div className="pharmacist-filter-group">

                    <button
                        type="button"
                        className={
                            filter === "ALL"
                                ? "pharmacist-filter-button active"
                                : "pharmacist-filter-button"
                        }
                        onClick={() => {
                            setFilter("ALL");
                            clearMessages();
                        }}
                    >
                        All
                    </button>


                    <button
                        type="button"
                        className={
                            filter === "PENDING"
                                ? "pharmacist-filter-button active"
                                : "pharmacist-filter-button"
                        }
                        onClick={() => {
                            setFilter("PENDING");
                            clearMessages();
                        }}
                    >
                        Pending
                    </button>


                    <button
                        type="button"
                        className={
                            filter === "PAID"
                                ? "pharmacist-filter-button active"
                                : "pharmacist-filter-button"
                        }
                        onClick={() => {
                            setFilter("PAID");
                            clearMessages();
                        }}
                    >
                        Paid
                    </button>

                </div>


                <button
                    type="button"
                    className="pharmacist-secondary-button"
                    onClick={() => {
                        clearMessages();
                        loadBills();
                    }}
                    disabled={loading}
                >
                    <RefreshCw
                        size={16}
                        className={
                            loading
                                ? "pharmacist-spin"
                                : ""
                        }
                    />

                    Refresh
                </button>

            </div>


            {/* =================================================
                BILL TABLE CARD
            ================================================= */}

            <div className="pharmacist-card">

                {/* =================================================
                    CARD HEADER
                ================================================= */}

                <div className="pharmacist-card-header">

                    <div>
                        <h2>
                            Pharmacy Bills
                        </h2>

                        <p>
                            {filteredBills.length} bill
                            {filteredBills.length !== 1
                                ? "s"
                                : ""}{" "}
                            found
                        </p>
                    </div>

                    <div className="pharmacist-card-header-icon">
                        <FileText size={20} />
                    </div>

                </div>


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (

                    <div className="pharmacist-loading">

                        <RefreshCw
                            size={22}
                            className="pharmacist-spin"
                        />

                        <span>
                            Loading bills...
                        </span>

                    </div>

                ) : (

                    /* =================================================
                        TABLE
                    ================================================= */

                    <div className="pharmacist-table-wrapper">

                        <table className="pharmacist-table">

                            <thead>

                                <tr>
                                    <th>Bill ID</th>
                                    <th>Patient</th>
                                    <th>Patient ID</th>
                                    <th>Appointment</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>

                            </thead>


                            <tbody>

                                {filteredBills.map(
                                    (bill) => {

                                        const isPaid =
                                            bill.payment_status ===
                                            "PAID";

                                        const isPaying =
                                            payingId ===
                                            bill.bill_id;

                                        return (

                                            <tr
                                                key={
                                                    bill.id ||
                                                    bill.bill_id
                                                }
                                            >

                                                {/* =====================================
                                                    BILL ID
                                                ====================================== */}

                                                <td>

                                                    <strong>
                                                        {
                                                            bill.bill_id ||
                                                            "-"
                                                        }
                                                    </strong>

                                                </td>


                                                {/* =====================================
                                                    PATIENT
                                                ====================================== */}

                                                <td>

                                                    <div className="pharmacist-patient-cell">

                                                        <div className="pharmacist-patient-icon">
                                                            <User size={15} />
                                                        </div>

                                                        <span>
                                                            {
                                                                bill.patient_name ||
                                                                "-"
                                                            }
                                                        </span>

                                                    </div>

                                                </td>


                                                {/* =====================================
                                                    PATIENT ID
                                                ====================================== */}

                                                <td>
                                                    {
                                                        bill.patient_id ||
                                                        "-"
                                                    }
                                                </td>


                                                {/* =====================================
                                                    APPOINTMENT
                                                ====================================== */}

                                                <td>
                                                    {
                                                        bill.appointment ||
                                                        "-"
                                                    }
                                                </td>


                                                {/* =====================================
                                                    AMOUNT
                                                ====================================== */}

                                                <td>

                                                    <div className="pharmacist-amount">

                                                        <IndianRupee
                                                            size={14}
                                                        />

                                                        <strong>
                                                            {
                                                                formatAmount(
                                                                    bill.total_amount
                                                                )
                                                            }
                                                        </strong>

                                                    </div>

                                                </td>


                                                {/* =====================================
                                                    DATE
                                                ====================================== */}

                                                <td>

                                                    <div className="pharmacist-date-cell">

                                                        <CalendarDays
                                                            size={14}
                                                        />

                                                        <span>
                                                            {
                                                                formatDate(
                                                                    bill.created_at
                                                                )
                                                            }
                                                        </span>

                                                    </div>

                                                </td>


                                                {/* =====================================
                                                    TIME
                                                ====================================== */}

                                                <td>

                                                    <span>
                                                        {
                                                            formatTime(
                                                                bill.created_at
                                                            )
                                                        }
                                                    </span>

                                                </td>


                                                {/* =====================================
                                                    STATUS
                                                ====================================== */}

                                                <td>

                                                    <div className="pharmacist-bill-actions">

                                                        <button
                                                            type="button"
                                                            className="pharmacist-view-button pharmacist-small-button"
                                                            onClick={() =>
                                                                handleViewBill(
                                                                    bill
                                                                )
                                                            }
                                                        >
                                                            <Eye size={15} />
                                                            View
                                                        </button>

                                                        {isPaid ? (

                                                            <span className="pharmacist-paid-label">

                                                                <CheckCircle
                                                                    size={15}
                                                                />

                                                                Paid

                                                            </span>

                                                        ) : (

                                                            <button
                                                                type="button"
                                                                className="pharmacist-primary-button pharmacist-small-button"
                                                                onClick={() =>
                                                                    handlePayment(
                                                                        bill
                                                                    )
                                                                }
                                                                disabled={
                                                                    payingId !==
                                                                    null
                                                                }
                                                            >

                                                                <CheckCircle
                                                                    size={15}
                                                                />

                                                                {isPaying
                                                                    ? "Processing..."
                                                                    : "Mark Paid"}

                                                            </button>

                                                        )}

                                                    </div>

                                                </td>

                                            </tr>

                                        );
                                    }
                                )}


                                {/* =====================================
                                    EMPTY STATE
                                ====================================== */}

                                {filteredBills.length === 0 && (

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="pharmacist-empty"
                                        >

                                            <Receipt
                                                size={32}
                                            />

                                            <strong>
                                                No bills found
                                            </strong>

                                            <span>
                                                Try changing your
                                                search or filter.
                                            </span>

                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

            {selectedBill && (
                <div
                    className="pharmacist-bill-modal-overlay"
                    onClick={closeBillModal}
                >
                    <div
                        className="pharmacist-bill-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="pharmacist-bill-modal-header">
                            <div>
                                <div className="pharmacist-bill-modal-title">
                                    <Receipt size={21} />
                                    <h2>Pharmacy Bill</h2>
                                </div>
                                <p>Bill details and payment information</p>
                            </div>

                            <button
                                type="button"
                                className="pharmacist-bill-modal-close"
                                onClick={closeBillModal}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="pharmacist-bill-modal-body">

                            <div className="pharmacist-bill-id-card">
                                <span>Bill ID</span>
                                <strong>
                                    {selectedBill.bill_id || "-"}
                                </strong>
                            </div>

                            <div className="pharmacist-bill-detail-section">
                                <div className="pharmacist-bill-section-heading">
                                    <User size={18} />
                                    <div>
                                        <h3>Patient Information</h3>
                                        <p>Patient associated with this bill</p>
                                    </div>
                                </div>

                                <div className="pharmacist-bill-detail-grid">
                                    <div className="pharmacist-bill-detail-item">
                                        <span>Patient Name</span>
                                        <strong>
                                            {selectedBill.patient_name || "-"}
                                        </strong>
                                    </div>

                                    <div className="pharmacist-bill-detail-item">
                                        <span>Patient ID</span>
                                        <strong>
                                            {selectedBill.patient_id || "-"}
                                        </strong>
                                    </div>

                                    <div className="pharmacist-bill-detail-item">
                                        <span>Appointment</span>
                                        <strong>
                                            {selectedBill.appointment || "-"}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <div className="pharmacist-bill-detail-section">
                                <div className="pharmacist-bill-section-heading">
                                    <FileText size={18} />
                                    <div>
                                        <h3>Medicine Details</h3>
                                        <p>Medicine and billing information</p>
                                    </div>
                                </div>

                                <div className="pharmacist-bill-detail-grid">
                                    <div className="pharmacist-bill-detail-item">
                                        <span>Medicine</span>
                                        <strong>
                                            {selectedBill.medicine_name ||
                                                selectedBill.medicine?.name ||
                                                selectedBill.medicine ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="pharmacist-bill-detail-item">
                                        <span>Quantity</span>
                                        <strong>
                                            {selectedBill.quantity ??
                                                selectedBill.dispensed_quantity ??
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="pharmacist-bill-detail-item">
                                        <span>Price Per Unit</span>
                                        <strong>
                                            ₹{" "}
                                            {formatAmount(
                                                selectedBill.price_per_unit ??
                                                    selectedBill.unit_price ??
                                                    0
                                            )}
                                        </strong>
                                    </div>

                                    <div className="pharmacist-bill-detail-item">
                                        <span>Total Amount</span>
                                        <strong className="pharmacist-bill-total">
                                            ₹{" "}
                                            {formatAmount(
                                                selectedBill.total_amount
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <div className="pharmacist-bill-detail-section">
                                <div className="pharmacist-bill-section-heading">
                                    <CheckCircle size={18} />
                                    <div>
                                        <h3>Payment Information</h3>
                                        <p>Current payment status</p>
                                    </div>
                                </div>

                                <div className="pharmacist-bill-payment-grid">
                                    <div className="pharmacist-bill-detail-item">
                                        <span>Payment Status</span>
                                        <span
                                            className={`pharmacist-status-badge ${getStatusClass(
                                                selectedBill.payment_status
                                            )}`}
                                        >
                                            {selectedBill.payment_status === "PAID" ? (
                                                <>
                                                    <CheckCircle size={14} />
                                                    Paid
                                                </>
                                            ) : (
                                                <>
                                                    <Clock size={14} />
                                                    Pending
                                                </>
                                            )}
                                        </span>
                                    </div>

                                    <div className="pharmacist-bill-detail-item">
                                        <span>Bill Date</span>
                                        <strong>
                                            {formatDate(selectedBill.created_at)}
                                        </strong>
                                    </div>

                                    <div className="pharmacist-bill-detail-item">
                                        <span>Bill Time</span>
                                        <strong>
                                            {formatTime(selectedBill.created_at)}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pharmacist-bill-modal-footer">
                            <button
                                type="button"
                                className="pharmacist-secondary-button"
                                onClick={closeBillModal}
                            >
                                Close
                            </button>

                            {selectedBill.payment_status !== "PAID" && (
                                <button
                                    type="button"
                                    className="pharmacist-primary-button"
                                    onClick={() => {
                                        closeBillModal();
                                        handlePayment(selectedBill);
                                    }}
                                    disabled={payingId !== null}
                                >
                                    <CheckCircle size={16} />
                                    Mark Paid
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </PharmacistLayout>
    );
}


export default Bills;