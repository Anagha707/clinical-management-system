import { useEffect, useState } from "react";

import {
    getLabPrescriptions,
    getLabBills,
} from "../../services/laboratoryService";

function LabDashboard() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [bills, setBills] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                const [
                    prescriptionResponse,
                    billResponse,
                ] = await Promise.all([
                    getLabPrescriptions(),
                    getLabBills(),
                ]);

                /*
                 * Axios response structure:
                 *
                 * response.data
                 *
                 * If pagination is enabled:
                 * response.data.results
                 */

                const prescriptionData =
                    Array.isArray(prescriptionResponse?.data)
                        ? prescriptionResponse.data
                        : prescriptionResponse?.data?.results || [];

                const billData =
                    Array.isArray(billResponse?.data)
                        ? billResponse.data
                        : billResponse?.data?.results || [];

                setPrescriptions(prescriptionData);
                setBills(billData);

            } catch (error) {
                console.error(
                    "Laboratory dashboard error:",
                    error
                );

                setError(
                    error?.response?.data?.detail ||
                    "Unable to load dashboard."
                );

                setPrescriptions([]);
                setBills([]);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    /*
     * ================================================
     * LABORATORY REQUEST COUNTS
     * ================================================
     */

    const requested = prescriptions.filter(
        (item) =>
            item?.status === "REQUESTED"
    ).length;

    const sampleCollected = prescriptions.filter(
        (item) =>
            item?.status === "SAMPLE_COLLECTED"
    ).length;

    const completed = prescriptions.filter(
        (item) =>
            item?.status === "COMPLETED"
    ).length;

    /*
     * ================================================
     * BILLING COUNTS
     * ================================================
     */

    const pendingBills = bills.filter(
        (bill) =>
            bill?.payment_status === "PENDING"
    ).length;

    const paidBills = bills.filter(
        (bill) =>
            bill?.payment_status === "PAID"
    ).length;

    /*
     * ================================================
     * BILLING AMOUNTS
     * ================================================
     */

    const totalBilling = bills.reduce(
        (sum, bill) =>
            sum +
            Number(
                bill?.total_amount || 0
            ),
        0
    );

    const paidRevenue = bills
        .filter(
            (bill) =>
                bill?.payment_status === "PAID"
        )
        .reduce(
            (sum, bill) =>
                sum +
                Number(
                    bill?.total_amount || 0
                ),
            0
        );

    const pendingRevenue = bills
        .filter(
            (bill) =>
                bill?.payment_status === "PENDING"
        )
        .reduce(
            (sum, bill) =>
                sum +
                Number(
                    bill?.total_amount || 0
                ),
            0
        );

    /*
     * ================================================
     * LOADING
     * ================================================
     */

    if (loading) {
        return (
            <div className="laboratory-page">

                <div className="loading-state">
                    Loading dashboard...
                </div>

            </div>
        );
    }

    /*
     * ================================================
     * UI
     * ================================================
     */

    return (
        <div className="laboratory-page">

            {/* =========================================
                PAGE HEADER
            ========================================== */}

            <div className="page-header">

                <div>

                    <h1>
                        Laboratory Dashboard
                    </h1>

                    <p>
                        Overview of laboratory operations.
                    </p>

                </div>

            </div>

            {/* =========================================
                ERROR
            ========================================== */}

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {/* =========================================
                STATISTICS
            ========================================== */}

            <div className="stats-grid">

                {/* REQUESTED */}

                <div className="stat-card">

                    <div className="stat-icon blue">
                        LAB
                    </div>

                    <div className="stat-content">

                        <span>
                            Requested
                        </span>

                        <strong>
                            {requested}
                        </strong>

                    </div>

                </div>

                {/* SAMPLE COLLECTED */}

                <div className="stat-card">

                    <div className="stat-icon orange">
                        SMP
                    </div>

                    <div className="stat-content">

                        <span>
                            Sample Collected
                        </span>

                        <strong>
                            {sampleCollected}
                        </strong>

                    </div>

                </div>

                {/* COMPLETED */}

                <div className="stat-card">

                    <div className="stat-icon green">
                        ✓
                    </div>

                    <div className="stat-content">

                        <span>
                            Completed
                        </span>

                        <strong>
                            {completed}
                        </strong>

                    </div>

                </div>

                {/* TOTAL BILLING */}

                <div className="stat-card">

                    <div className="stat-icon purple">
                        ₹
                    </div>

                    <div className="stat-content">

                        <span>
                            Total Billing
                        </span>

                        <strong>
                            ₹{totalBilling.toFixed(2)}
                        </strong>

                    </div>

                </div>

            </div>

            {/* =========================================
                BILLING SUMMARY
            ========================================== */}

            <div className="stats-grid">

                {/* PAID */}

                <div className="stat-card">

                    <div className="stat-icon green">
                        PAID
                    </div>

                    <div className="stat-content">

                        <span>
                            Paid Revenue
                        </span>

                        <strong>
                            ₹{paidRevenue.toFixed(2)}
                        </strong>

                        <small>
                            {paidBills} paid bills
                        </small>

                    </div>

                </div>

                {/* PENDING */}

                <div className="stat-card">

                    <div className="stat-icon orange">
                        DUE
                    </div>

                    <div className="stat-content">

                        <span>
                            Pending Revenue
                        </span>

                        <strong>
                            ₹{pendingRevenue.toFixed(2)}
                        </strong>

                        <small>
                            {pendingBills} pending bills
                        </small>

                    </div>

                </div>

                {/* TOTAL TRANSACTIONS */}

                <div className="stat-card">

                    <div className="stat-icon blue">
                        #
                    </div>

                    <div className="stat-content">

                        <span>
                            Transactions
                        </span>

                        <strong>
                            {bills.length}
                        </strong>

                    </div>

                </div>

            </div>

            {/* =========================================
                RECENT LABORATORY REQUESTS
            ========================================== */}

            <div className="content-card">

                <div className="card-header">

                    <div>

                        <h2>
                            Recent Laboratory Requests
                        </h2>

                        <p>
                            Latest test prescriptions.
                        </p>

                    </div>

                    <span className="record-count">
                        {pendingBills} Pending Bills
                    </span>

                </div>

                <div className="table-container">

                    <table className="laboratory-table">

                        <thead>

                            <tr>

                                <th>
                                    Request ID
                                </th>

                                <th>
                                    Patient
                                </th>

                                <th>
                                    Test
                                </th>

                                <th>
                                    Status
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {prescriptions.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="4"
                                        className="empty-state"
                                    >
                                        No laboratory requests found.
                                    </td>

                                </tr>

                            ) : (

                                prescriptions
                                    .slice(0, 8)
                                    .map((item) => {

                                        const status =
                                            item?.status ||
                                            "REQUESTED";

                                        return (

                                            <tr
                                                key={item.id}
                                            >

                                                {/* REQUEST ID */}

                                                <td>

                                                    <span className="request-id">

                                                        {item?.lab_request_id ||
                                                            "N/A"}

                                                    </span>

                                                </td>

                                                {/* PATIENT */}

                                                <td>

                                                    {item?.patient_name ||
                                                        "N/A"}

                                                </td>

                                                {/* TEST */}

                                                <td>

                                                    {item?.test_name ||
                                                        "N/A"}

                                                </td>

                                                {/* STATUS */}

                                                <td>

                                                    <span
                                                        className={`status ${
                                                            status ===
                                                            "COMPLETED"
                                                                ? "completed"
                                                                : status ===
                                                                  "SAMPLE_COLLECTED"
                                                                ? "progress"
                                                                : "pending"
                                                        }`}
                                                    >

                                                        {status ===
                                                        "SAMPLE_COLLECTED"
                                                            ? "SAMPLE COLLECTED"
                                                            : status}

                                                    </span>

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
    );
}

export default LabDashboard;