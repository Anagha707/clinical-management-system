import { useEffect, useState } from "react";

import {
    getLabSales,
} from "../../services/laboratoryService";

function Sales() {
    const [sales, setSales] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // LOAD SALES
    // =========================================================

    const loadSales = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getLabSales();

            const data =
                Array.isArray(response)
                    ? response
                    : Array.isArray(response?.data)
                        ? response.data
                        : response?.data?.results ||
                        response?.results ||
                        [];

            setSales(data);

        } catch (error) {
            console.error(
                "Error loading laboratory sales:",
                error
            );

            setError(
                error?.response?.data?.detail ||
                "Unable to load laboratory sales."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // LOAD ON PAGE OPEN
    // =========================================================

    useEffect(() => {
        loadSales();
    }, []);

    // =========================================================
    // TOTAL SALES
    // =========================================================

    const totalSales = sales.reduce(
        (sum, sale) =>
            sum +
            Number(
                sale?.total_amount || 0
            ),
        0
    );

    // =========================================================
    // PAID SALES
    // Backend payment status = COMPLETED
    // =========================================================

    const paidSales = sales
        .filter(
            (sale) =>
                sale?.payment_status === "PAID"
        ).reduce(
            (sum, sale) =>
                sum +
                Number(
                    sale?.total_amount || 0
                ),
            0
        );

    // =========================================================
    // PENDING SALES
    // =========================================================

    const pendingSales = sales
        .filter(
            (sale) =>
                sale?.payment_status !== "COMPLETED"
        )
        .reduce(
            (sum, sale) =>
                sum +
                Number(
                    sale?.total_amount || 0
                ),
            0
        );

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="laboratory-page">
                <div className="loading-state">
                    Loading sales...
                </div>
            </div>
        );
    }

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="laboratory-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="page-header">

                <div>
                    <h1>
                        Laboratory Sales
                    </h1>

                    <p>
                        View laboratory billing transactions
                        and sales information.
                    </p>
                </div>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="stats-grid">

                {/* TOTAL SALES */}

                <div className="stat-card">

                    <div className="stat-content">

                        <span>
                            Total Sales
                        </span>

                        <strong>
                            ₹{totalSales.toFixed(2)}
                        </strong>

                    </div>

                </div>

                {/* PAID SALES */}

                <div className="stat-card">

                    <div className="stat-content">

                        <span>
                            Paid Sales
                        </span>

                        <strong>
                            ₹{paidSales.toFixed(2)}
                        </strong>

                    </div>

                </div>

                {/* PENDING */}

                <div className="stat-card">

                    <div className="stat-content">

                        <span>
                            Pending
                        </span>

                        <strong>
                            ₹{pendingSales.toFixed(2)}
                        </strong>

                    </div>

                </div>

                {/* TRANSACTIONS */}

                <div className="stat-card">

                    <div className="stat-content">

                        <span>
                            Transactions
                        </span>

                        <strong>
                            {sales.length}
                        </strong>

                    </div>

                </div>

            </div>

            {/* =================================================
                SALES TABLE
            ================================================= */}

            <div className="content-card">

                <div className="card-header">

                    <div>

                        <h2>
                            Sales Transactions
                        </h2>

                        <p>
                            Laboratory bills generated
                            for completed tests.
                        </p>

                    </div>

                </div>

                <div className="table-container">

                    <table className="laboratory-table">

                        <thead>

                            <tr>
                                <th>Bill ID</th>
                                <th>Patient</th>
                                <th>Request ID</th>
                                <th>Test</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>

                        </thead>

                        <tbody>

                            {sales.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="empty-state"
                                    >
                                        No sales transactions found.
                                    </td>

                                </tr>

                            ) : (

                                sales.map((sale) => {

                                    const isPaid =
                                        sale?.payment_status ===
                                        "COMPLETED";

                                    return (
                                        <tr
                                            key={sale?.id}
                                        >

                                            {/* BILL ID */}

                                            <td>

                                                <span className="request-id">
                                                    {sale?.bill_id || "—"}
                                                </span>

                                            </td>

                                            {/* PATIENT */}

                                            <td>
                                                {
                                                    sale?.patient_name ||
                                                    "N/A"
                                                }
                                            </td>

                                            {/* REQUEST ID */}

                                            <td>
                                                {
                                                    sale?.lab_request_id ||
                                                    "N/A"
                                                }
                                            </td>

                                            {/* TEST */}

                                            <td>
                                                {
                                                    sale?.test_name ||
                                                    "N/A"
                                                }
                                            </td>

                                            {/* AMOUNT */}

                                            <td>
                                                ₹
                                                {Number(
                                                    sale?.total_amount || 0
                                                ).toFixed(2)}
                                            </td>

                                            {/* PAYMENT STATUS */}

                                            <td>

                                                <span
                                                    className={`status ${isPaid
                                                            ? "completed"
                                                            : "pending"
                                                        }`}
                                                >
                                                    {isPaid
                                                        ? "COMPLETED"
                                                        : "PENDING"}
                                                </span>

                                            </td>

                                            {/* DATE */}

                                            <td>

                                                {sale?.created_at
                                                    ? new Date(
                                                        sale.created_at
                                                    ).toLocaleDateString()
                                                    : "—"}

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

export default Sales;