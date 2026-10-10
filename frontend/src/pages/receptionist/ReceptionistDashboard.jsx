import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Users,
    CalendarDays,
    Receipt,
    CreditCard,
    RefreshCw,
    Eye,
} from "lucide-react";

import api from "../../services/api";
import ReceptionistLayout from "./ReceptionistLayout";

function ReceptionistDashboard() {
    const navigate = useNavigate();

    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [bills, setBills] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==================================================
    // CURRENT DATE
    // ==================================================

    const today = new Date();

    const todayString =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");

    // ==================================================
    // LOAD DASHBOARD DATA
    // ==================================================

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                patientsResponse,
                appointmentsResponse,
                billsResponse,
            ] = await Promise.all([
                api.get("/receptionist/patients/"),
                api.get("/receptionist/appointments/"),
                api.get("/receptionist/billing/"),
            ]);

            setPatients(
                Array.isArray(patientsResponse.data)
                    ? patientsResponse.data
                    : []
            );

            setAppointments(
                Array.isArray(appointmentsResponse.data)
                    ? appointmentsResponse.data
                    : []
            );

            setBills(
                Array.isArray(billsResponse.data)
                    ? billsResponse.data
                    : []
            );
        } catch (err) {
            console.error(
                "Dashboard error:",
                err.response?.data || err
            );

            if (err.response?.status === 401) {
                setError(
                    "Your login session has expired. Please login again."
                );
            } else if (err.response?.status === 403) {
                setError(
                    "You do not have permission to view the dashboard."
                );
            } else {
                setError(
                    err.response?.data?.detail ||
                    err.response?.data?.error ||
                    "Unable to load dashboard data."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    // ==================================================
    // TODAY'S APPOINTMENTS
    // ==================================================

    const todaysAppointments = useMemo(() => {
        return appointments
            .filter(
                (appointment) =>
                    appointment.appointment_date ===
                    todayString
            )
            .sort((a, b) =>
                String(
                    a.appointment_time
                ).localeCompare(
                    String(
                        b.appointment_time
                    )
                )
            );
    }, [appointments, todayString]);

    // ==================================================
    // RECENT BILLS
    // ==================================================

    const recentBills = useMemo(() => {
        return [...bills]
            .sort(
                (a, b) =>
                    new Date(
                        b.created_at || 0
                    ) -
                    new Date(
                        a.created_at || 0
                    )
            )
            .slice(0, 5);
    }, [bills]);

    // ==================================================
    // PENDING BILLS
    // ==================================================

    const pendingBills = useMemo(() => {
        return bills.filter(
            (bill) =>
                bill.payment_status ===
                "PENDING"
        ).length;
    }, [bills]);

    // ==================================================
    // TOTAL PAYMENTS
    // ==================================================

    const totalPayments = useMemo(() => {
        return bills
            .filter(
                (bill) =>
                    bill.payment_status ===
                    "COMPLETED"
            )
            .reduce(
                (total, bill) =>
                    total +
                    Number(
                        bill.total_amount || 0
                    ),
                0
            );
    }, [bills]);

    // ==================================================
    // FORMAT TIME
    // ==================================================

    const formatTime = (time) => {
        if (!time) {
            return "-";
        }

        const [hours, minutes] =
            time.split(":").map(Number);

        const date = new Date();

        date.setHours(hours);
        date.setMinutes(minutes);

        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    // ==================================================
    // FORMAT DATE
    // ==================================================

    const formatDate = (dateTime) => {
        if (!dateTime) {
            return "-";
        }

        return new Date(
            dateTime
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // ==================================================
    // APPOINTMENT STATUS
    // ==================================================

    const getAppointmentStatus = (status) => {
        switch (status) {
            case "BOOKED":
                return (
                    <span className="status-paid">
                        CONFIRMED
                    </span>
                );

            case "CONSULTED":
                return (
                    <span className="status-info">
                        CONSULTED
                    </span>
                );

            case "CANCELLED":
                return (
                    <span className="status-danger">
                        CANCELLED
                    </span>
                );

            default:
                return (
                    <span className="status-pending">
                        {status || "UNKNOWN"}
                    </span>
                );
        }
    };

    // ==================================================
    // BILL STATUS
    // ==================================================

    const getBillStatus = (status) => {
        if (status === "COMPLETED") {
            return (
                <span className="status-paid">
                    PAID
                </span>
            );
        }

        return (
            <span className="status-pending">
                PENDING
            </span>
        );
    };

    // ==================================================
    // GO TO TODAY'S APPOINTMENTS
    // ==================================================

    const handleViewTodayAppointments = () => {
        navigate(
            "/receptionist/appointments",
            {
                state: {
                    showToday: true,
                },
            }
        );
    };

    // ==================================================
    // PAGE
    // ==================================================

    return (
        <ReceptionistLayout
            title="Receptionist Dashboard"
            subtitle="Overview of today's clinic activity"
            showBack={false}
        >

            {/* =========================================
                ERROR
            ========================================= */}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {/* =========================================
                STATISTICS
            ========================================= */}

            <div className="dashboard-stats">

                {/* TODAY'S APPOINTMENTS */}

                <div className="dashboard-card">

                    <div className="dashboard-icon blue">
                        <CalendarDays size={22} />
                    </div>

                    <div>
                        <span>
                                             Today's Appointments
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : todaysAppointments.length}
                        </strong>

                        <small>
                            Scheduled today
                        </small>
                    </div>

                </div>

                {/* TOTAL PATIENTS */}

                <div className="dashboard-card">

                    <div className="dashboard-icon green">
                        <Users size={22} />
                    </div>

                    <div>
                        <span>
                            Total Patients
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : patients.length}
                        </strong>

                        <small>
                            Registered patients
                        </small>
                    </div>

                </div>

                {/* PENDING BILLS */}

                <div className="dashboard-card">

                    <div className="dashboard-icon orange">
                        <Receipt size={22} />
                    </div>

                    <div>
                        <span>
                            Pending Bills
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : pendingBills}
                        </strong>

                        <small>
                            Awaiting payment
                        </small>
                    </div>

                </div>

                {/* TOTAL PAYMENTS */}

                <div className="dashboard-card">

                    <div className="dashboard-icon purple">
                        <CreditCard size={22} />
                    </div>

                    <div>
                        <span>
                            Total Payments
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : `₹ ${totalPayments.toFixed(
                                      2
                                  )}`}
                        </strong>

                        <small>
                            Completed payments
                        </small>
                    </div>

                </div>

            </div>

            {/* =========================================
                DASHBOARD ACTIONS
            ========================================= */}

            {/* =========================================
                TODAY'S APPOINTMENTS
            ========================================= */}

            <div className="page-card">

                <div className="section-header">

                    <div>
                        <h3>
                            Today's Appointments
                        </h3>

                        <p>
                            Appointments scheduled
                            for today
                        </p>
                    </div>

                    <button
                        type="button"
                        className="link-button"
                        onClick={
                            handleViewTodayAppointments
                        }
                    >
                        View All
                    </button>

                </div>

                <div className="table-container">

                    <table className="simple-table">

                        <thead>
                            <tr>
                                <th>
                                    Time
                                </th>

                                <th>
                                    Patient
                                </th>

                                <th>
                                    Doctor
                                </th>

                                <th>
                                    Type
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td
                                        colSpan="6"
                                        className="table-empty"
                                    >
                                        Loading appointments...
                                    </td>
                                </tr>

                            ) : todaysAppointments.length ===
                              0 ? (

                                <tr>
                                    <td
                                        colSpan="6"
                                        className="table-empty"
                                    >
                                        No appointments
                                        scheduled
                                        for today.
                                    </td>
                                </tr>

                            ) : (

                                todaysAppointments
                                    .slice(0, 6)
                                    .map(
                                        (
                                            appointment
                                        ) => (

                                            <tr
                                                key={
                                                    appointment.id
                                                }
                                            >

                                                <td>
                                                    <strong>
                                                        {formatTime(
                                                            appointment.appointment_time
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        appointment.patient_name ||
                                                        `Patient #${appointment.patient}`
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        appointment.doctor_name ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {appointment.appointment_type ===
                                                    "WALK_IN"
                                                        ? "Walk-in"
                                                        : "Prior Booking"}
                                                </td>

                                                <td>
                                                    {getAppointmentStatus(
                                                        appointment.status
                                                    )}
                                                </td>

                                                <td>

                                                    <button
                                                        type="button"
                                                        className="small-button"
                                                        onClick={
                                                            handleViewTodayAppointments
                                                        }
                                                    >
                                                        <Eye
                                                            size={
                                                                14
                                                            }
                                                        />

                                                        View
                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* =========================================
                RECENT BILLS
            ========================================= */}

            <div className="page-card dashboard-section">

                <div className="section-header">

                    <div>
                        <h3>
                            Recent Bills
                        </h3>

                        <p>
                            Latest consultation
                            bills
                        </p>
                    </div>

                    <button
                        type="button"
                        className="link-button"
                        onClick={() =>
                            navigate(
                                "/receptionist/bills"
                            )
                        }
                    >
                        View All
                    </button>

                </div>

                <div className="table-container">

                    <table className="simple-table">

                        <thead>

                            <tr>

                                <th>
                                    Bill ID
                                </th>

                                <th>
                                    Patient
                                </th>

                                <th>
                                    Appointment
                                </th>

                                <th>
                                    Total
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Date
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td
                                        colSpan="6"
                                        className="table-empty"
                                    >
                                        Loading bills...
                                    </td>
                                </tr>

                            ) : recentBills.length ===
                              0 ? (

                                <tr>
                                    <td
                                        colSpan="6"
                                        className="table-empty"
                                    >
                                        No bills found.
                                    </td>
                                </tr>

                            ) : (

                                recentBills.map(
                                    (bill) => (

                                        <tr
                                            key={
                                                bill.id ||
                                                bill.bill_id
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        bill.bill_id
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    bill.patient_name ||
                                                    `Patient #${bill.patient}`
                                                }
                                            </td>

                                            <td>
                                                #
                                                {
                                                    bill.appointment
                                                }
                                            </td>

                                            <td>
                                                <strong>
                                                    ₹
                                                    {Number(
                                                        bill.total_amount ||
                                                        0
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                {getBillStatus(
                                                    bill.payment_status
                                                )}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    bill.created_at
                                                )}
                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </ReceptionistLayout>
    );
}

export default ReceptionistDashboard;