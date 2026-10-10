import { useEffect, useState } from "react";

import {
    getLabBills,
    payLabBill,
} from "../../services/laboratoryService";

import "../../styles/laboratory/laboratory.css";

function Billing() {
    const [bills, setBills] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [paymentLoading, setPaymentLoading] =
        useState(null);

    // =========================================================
    // LOAD LABORATORY BILLS
    // =========================================================

    const loadBills = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getLabBills();

            const data = Array.isArray(response?.data)
                ? response.data
                : response?.data?.results || [];

            setBills(data);

        } catch (error) {
            console.error(
                "Error loading laboratory bills:",
                error
            );

            setError(
                error?.response?.data?.detail ||
                "Unable to load laboratory bills."
            );

            setBills([]);

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // LOAD WHEN PAGE OPENS
    // =========================================================

    useEffect(() => {
        loadBills();
    }, []);

    // =========================================================
    // PAY LABORATORY BILL
    // =========================================================

    const handlePayment = async (bill) => {

        if (!bill?.id) {
            setError(
                "Invalid laboratory bill."
            );
            return;
        }

        if (bill.payment_status === "PAID") {
            setMessage(
                "This laboratory bill has already been paid."
            );
            return;
        }

        try {

            setPaymentLoading(bill.id);
            setError("");
            setMessage("");

            const response =
                await payLabBill(bill.id);

            const paymentStatus =
                response?.data?.payment_status;

            if (paymentStatus === "PAID") {

                setMessage(
                    `Payment completed successfully for ${bill.bill_id}.`
                );

            } else {

                setMessage(
                    response?.data?.message ||
                    "Payment completed successfully."
                );
            }

            // Reload bills so the status becomes PAID
            await loadBills();

        } catch (error) {

            console.error(
                "Laboratory bill payment error:",
                error
            );

            setError(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Unable to complete laboratory bill payment."
            );

        } finally {

            setPaymentLoading(null);
        }
    };

    // =========================================================
    // STATISTICS
    // =========================================================

    const totalAmount = bills.reduce(
        (total, bill) =>
            total +
            Number(
                bill?.total_amount || 0
            ),
        0
    );

    const paidAmount = bills
        .filter(
            (bill) =>
                bill?.payment_status === "PAID"
        )
        .reduce(
            (total, bill) =>
                total +
                Number(
                    bill?.total_amount || 0
                ),
            0
        );

    const pendingAmount = bills
        .filter(
            (bill) =>
                bill?.payment_status === "PENDING"
        )
        .reduce(
            (total, bill) =>
                total +
                Number(
                    bill?.total_amount || 0
                ),
            0
        );

    const paidCount = bills.filter(
        (bill) =>
            bill?.payment_status === "PAID"
    ).length;

    const pendingCount = bills.filter(
        (bill) =>
            bill?.payment_status === "PENDING"
    ).length;

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="laboratory-page billing-page">

                <div className="laboratory-content">

                    <div className="loading-message">
                        Loading laboratory bills...
                    </div>

                </div>

            </div>
        );
    }

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="laboratory-page billing-page">

            <div className="laboratory-content">

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <div className="page-header">

                    <div>

                        <h1>
                            Laboratory Billing
                        </h1>

                        <p>
                            Manage payments for completed
                            laboratory tests.
                        </p>

                    </div>

                    <span className="record-count">
                        {bills.length} Bills
                    </span>

                </div>

                {/* =================================================
                    SUCCESS MESSAGE
                ================================================= */}

                {message && (
                    <div className="success-message">
                        {message}
                    </div>
                )}

                {/* =================================================
                    ERROR MESSAGE
                ================================================= */}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* =================================================
                    BILLING SUMMARY
                ================================================= */}

                <div className="billing-summary-grid">

                    {/* TOTAL */}

                    <div className="billing-summary-card">

                        <div className="billing-summary-label">
                            Total Billing
                        </div>

                        <div className="billing-summary-value">
                            ₹{totalAmount.toFixed(2)}
                        </div>

                        <div className="billing-summary-count">
                            {bills.length} Bills
                        </div>

                    </div>

                    {/* PAID */}

                    <div className="billing-summary-card">

                        <div className="billing-summary-label">
                            Paid
                        </div>

                        <div className="billing-summary-value">
                            ₹{paidAmount.toFixed(2)}
                        </div>

                        <div className="billing-summary-count">
                            {paidCount} Paid Bills
                        </div>

                    </div>

                    {/* PENDING */}

                    <div className="billing-summary-card">

                        <div className="billing-summary-label">
                            Pending
                        </div>

                        <div className="billing-summary-value">
                            ₹{pendingAmount.toFixed(2)}
                        </div>

                        <div className="billing-summary-count">
                            {pendingCount} Pending Bills
                        </div>

                    </div>

                </div>

                {/* =================================================
                    BILLING TABLE
                ================================================= */}

                <div className="laboratory-card billing-table-card">

                    <div className="card-header">

                        <div>

                            <h2>
                                Laboratory Bills
                            </h2>

                            <p>
                                View laboratory charges
                                and accept payments.
                            </p>

                        </div>

                        <span className="record-count">
                            {pendingCount} Pending
                        </span>

                    </div>

                    <div className="table-container billing-table-container">

                        <table className="laboratory-table billing-table">

                            <thead>

                                <tr>

                                    <th>
                                        Bill ID
                                    </th>

                                    <th>
                                        Patient
                                    </th>

                                    <th>
                                        Request ID
                                    </th>

                                    <th>
                                        Test
                                    </th>

                                    <th>
                                        Test Charge
                                    </th>

                                    <th>
                                        Total Amount
                                    </th>

                                    <th>
                                        Payment Status
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {bills.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="empty-table-message"
                                        >
                                            No laboratory bills found.
                                        </td>

                                    </tr>

                                ) : (

                                    bills.map((bill) => {

                                        const isPaid =
                                            bill?.payment_status ===
                                            "PAID";

                                        const isPaymentLoading =
                                            paymentLoading ===
                                            bill?.id;

                                        return (

                                            <tr
                                                key={bill.id}
                                            >

                                                {/* BILL ID */}

                                                <td>

                                                    <span className="request-id">
                                                        {bill?.bill_id ||
                                                            "N/A"}
                                                    </span>

                                                </td>

                                                {/* PATIENT */}

                                                <td>

                                                    <strong>
                                                        {bill?.patient_name ||
                                                            "N/A"}
                                                    </strong>

                                                </td>

                                                {/* REQUEST ID */}

                                                <td>

                                                    <span className="request-id">
                                                        {bill?.lab_request_id ||
                                                            "N/A"}
                                                    </span>

                                                </td>

                                                {/* TEST */}

                                                <td>
                                                    {bill?.test_name ||
                                                        "N/A"}
                                                </td>

                                                {/* TEST CHARGE */}

                                                <td>
                                                    ₹
                                                    {Number(
                                                        bill?.test_charge ||
                                                        0
                                                    ).toFixed(2)}
                                                </td>

                                                {/* TOTAL AMOUNT */}

                                                <td>

                                                    <strong>
                                                        ₹
                                                        {Number(
                                                            bill?.total_amount ||
                                                            0
                                                        ).toFixed(2)}
                                                    </strong>

                                                </td>

                                                {/* PAYMENT STATUS */}

                                                <td>

                                                    <span
                                                        className={`status-badge ${
                                                            isPaid
                                                                ? "status-completed"
                                                                : "status-pending"
                                                        }`}
                                                    >
                                                        {isPaid
                                                            ? "PAID"
                                                            : "PENDING"}
                                                    </span>

                                                </td>

                                                {/* DATE */}

                                                <td>

                                                    {bill?.created_at
                                                        ? new Date(
                                                            bill.created_at
                                                        ).toLocaleDateString()
                                                        : "N/A"}

                                                </td>

                                                {/* ACTION */}

                                                <td className="billing-action-cell">

                                                    {isPaid ? (

                                                        <button
                                                            type="button"
                                                            className="billing-paid-button"
                                                            disabled
                                                        >
                                                            Paid
                                                        </button>

                                                    ) : (

                                                        <button
                                                            type="button"
                                                            className="billing-pay-button"
                                                            onClick={() =>
                                                                handlePayment(
                                                                    bill
                                                                )
                                                            }
                                                            disabled={
                                                                isPaymentLoading
                                                            }
                                                        >

                                                            {isPaymentLoading
                                                                ? "Processing..."
                                                                : "Pay"}

                                                        </button>

                                                    )}

                                                </td>

                                            </tr>

                                        );
                                    })

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Billing;