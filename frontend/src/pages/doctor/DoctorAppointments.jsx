import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    CalendarDays,
    Search,
    RefreshCw,
    Users,
    Eye,
} from "lucide-react";

import DoctorLayout from "../../components/doctor/DoctorLayout";
import { getDoctorAppointments } from "../../services/doctorApi";

function DoctorAppointments() {

    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [showTodayOnly, setShowTodayOnly] = useState(true);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // TODAY
    // =====================================================

    const todayString = useMemo(() => {

        const today = new Date();

        return (
            today.getFullYear() +
            "-" +
            String(today.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(today.getDate()).padStart(2, "0")
        );

    }, []);

    // =====================================================
    // LOAD APPOINTMENTS
    // =====================================================

    const loadAppointments = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await getDoctorAppointments();

            const data =
                Array.isArray(response.data)
                    ? response.data
                    : response.data?.results || [];

            setAppointments(data);

        } catch (err) {

            console.error(
                "Doctor appointments error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                "Unable to load appointments."
            );

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadAppointments();

    }, []);

    // =====================================================
    // FILTER
    // =====================================================

    const filteredAppointments = useMemo(() => {

        const value =
            search.trim().toLowerCase();

        return appointments
            .filter((appointment) => {

                if (
                    showTodayOnly &&
                    appointment.appointment_date !==
                        todayString
                ) {
                    return false;
                }

                if (
                    statusFilter !== "ALL" &&
                    appointment.status !==
                        statusFilter
                ) {
                    return false;
                }

                if (!value) {
                    return true;
                }

                const patientName =
                    appointment.patient_name || "";

                const patientId =
                    appointment.patient_id ||
                    appointment.patient ||
                    "";

                return (
                    String(patientName)
                        .toLowerCase()
                        .includes(value) ||

                    String(patientId)
                        .toLowerCase()
                        .includes(value) ||

                    String(appointment.id || "")
                        .toLowerCase()
                        .includes(value) ||

                    String(formatDate(appointment.appointment_date))
                        .toLowerCase()
                        .includes(value) ||

                    String(formatTime(appointment.appointment_time))
                        .toLowerCase()
                        .includes(value)
                );

            })
            .sort((a, b) => {

                const dateA =
                    `${a.appointment_date || ""} ${a.appointment_time || ""}`;

                const dateB =
                    `${b.appointment_date || ""} ${b.appointment_time || ""}`;

                return dateA.localeCompare(dateB);

            });

    }, [
        appointments,
        search,
        statusFilter,
        showTodayOnly,
        todayString,
    ]);

    // =====================================================
    // DATE / TIME DISPLAY
    // =====================================================

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(`${dateValue}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (timeValue) => {
        if (!timeValue) {
            return "-";
        }

        const [hours, minutes] = String(timeValue).split(":");

        if (hours === undefined || minutes === undefined) {
            return timeValue;
        }

        const date = new Date();
        date.setHours(Number(hours), Number(minutes), 0, 0);

        if (Number.isNaN(date.getTime())) {
            return timeValue;
        }

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };


    // =====================================================
    // STATUS
    // =====================================================

    const getStatusLabel = (status) => {

        switch (status) {

            case "BOOKED":
                return "CONFIRMED";

            case "CONSULTED":
                return "CONSULTED";

            case "CANCELLED":
                return "CANCELLED";

            default:
                return status || "-";

        }

    };

    const getStatusClass = (status) => {

        switch (status) {

            case "BOOKED":
                return "doctor-status-booked";

            case "CONSULTED":
                return "doctor-status-consulted";

            case "CANCELLED":
                return "doctor-status-cancelled";

            default:
                return "doctor-status-in-progress";

        }

    };

    // =====================================================
    // APPOINTMENT TYPE
    // =====================================================

    const getAppointmentType = (type) => {

        switch (type) {

            case "WALK_IN":
                return "Walk-in";

            case "PRIOR_BOOKING":
                return "Prior Booking";

            default:
                return type || "-";

        }

    };

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <DoctorLayout
            title="Appointments"
        >

            <div className="doctor-appointments-page">

                {/* =================================================
                    FILTER BAR
                ================================================= */}

                <div className="doctor-appointments-toolbar">

                    <div className="doctor-appointment-filters">

                        <button
                            type="button"
                            className={
                                showTodayOnly
                                    ? "doctor-appointment-filter active"
                                    : "doctor-appointment-filter"
                            }
                            onClick={() =>
                                setShowTodayOnly(true)
                            }
                        >

                            <CalendarDays size={15} />

                            Today

                        </button>



                    </div>


                    <button
                        type="button"
                        className="doctor-dashboard-refresh"
                        onClick={loadAppointments}
                        disabled={loading}
                    >

                        <RefreshCw
                            size={15}
                            className={
                                loading
                                    ? "doctor-refresh-spin"
                                    : ""
                            }
                        />

                        {loading
                            ? "Refreshing..."
                            : "Refresh"}

                    </button>

                </div>


                {/* =================================================
                    MAIN CARD
                ================================================= */}

                <section className="doctor-appointments-card">

                    {/* HEADER */}

                    <div className="doctor-appointments-header">

                        <div>

                            <h2>
                                {showTodayOnly
                                    ? "Today's Appointments"
                                    : "All Appointments"}
                            </h2>

                            <span>
                                {filteredAppointments.length} appointment
                                {filteredAppointments.length !== 1
                                    ? "s"
                                    : ""}
                            </span>

                        </div>

                    </div>


                    {/* =================================================
                        SEARCH / STATUS
                    ================================================= */}

                    <div className="doctor-appointments-controls">

                        <div className="doctor-appointments-search">

                            <Search size={16} />

                            <input
                                type="text"
                                placeholder="Search patient..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                            className="doctor-appointments-status-select"
                        >

                            <option value="ALL">
                                All Status
                            </option>

                            <option value="BOOKED">
                                Confirmed
                            </option>

                            <option value="CONSULTED">
                                Consulted
                            </option>

                            <option value="CANCELLED">
                                Cancelled
                            </option>

                        </select>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="doctor-alert doctor-alert-error">
                            {error}
                        </div>

                    )}


                    {/* =================================================
                        LOADING
                    ================================================= */}

                    {loading ? (

                        <div className="doctor-appointments-empty">

                            <div className="doctor-spinner"></div>

                            <span>
                                Loading appointments...
                            </span>

                        </div>

                    ) : filteredAppointments.length === 0 ? (

                        <div className="doctor-appointments-empty">

                            <CalendarDays size={30} />

                            <span>
                                No appointments found
                            </span>

                        </div>

                    ) : (

                        /* =================================================
                           TABLE
                        ================================================= */

                        <div className="doctor-dashboard-table-container">

                            <table className="doctor-dashboard-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Patient
                                        </th>

                                        <th>
                                            Date
                                        </th>

                                        <th>
                                            Time
                                        </th>

                                        <th>
                                            Type
                                        </th>

                                        <th>
                                            Token
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

                                    {filteredAppointments.map(
                                        (appointment) => {

                                            const patientName =
                                                appointment.patient_name ||
                                                `Patient #${appointment.patient}`;

                                            const patientId =
                                                appointment.patient_id ||
                                                appointment.patient ||
                                                "-";

                                            return (

                                                <tr
                                                    key={
                                                        appointment.id
                                                    }
                                                >

                                                    {/* PATIENT */}

                                                    <td>

                                                        <div className="doctor-dashboard-patient">

                                                            <div className="doctor-dashboard-avatar">

                                                                {patientName
                                                                    .charAt(0)
                                                                    .toUpperCase()}

                                                            </div>

                                                            <div>

                                                                <strong>
                                                                    {patientName}
                                                                </strong>

                                                                <span>
                                                                    ID: {patientId}
                                                                </span>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    {/* DATE */}

                                                    <td>
                                                        {formatDate(
                                                            appointment.appointment_date
                                                        )}
                                                    </td>


                                                    {/* TIME */}

                                                    <td>

                                                        <strong>
                                                            {formatTime(
                                                                appointment.appointment_time
                                                            )}
                                                        </strong>

                                                    </td>


                                                    {/* TYPE */}

                                                    <td>
                                                        {
                                                            getAppointmentType(
                                                                appointment.appointment_type
                                                            )
                                                        }
                                                    </td>


                                                    {/* TOKEN */}

                                                    <td>

                                                        {
                                                            appointment.token_no ||
                                                            "-"
                                                        }

                                                    </td>


                                                    {/* STATUS */}

                                                    <td>

                                                        <span
                                                            className={`doctor-dashboard-status ${getStatusClass(
                                                                appointment.status
                                                            )}`}
                                                        >

                                                            {
                                                                getStatusLabel(
                                                                    appointment.status
                                                                )
                                                            }

                                                        </span>

                                                    </td>


                                                    {/* ACTION */}

                                                    <td>

                                                        <button
                                                            type="button"
                                                            className="doctor-dashboard-view-button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/doctor/appointments/${appointment.id}/patient`,
                                                                    {
                                                                        state: {
                                                                            appointment,
                                                                        },
                                                                    }
                                                                )
                                                            }
                                                        >

                                                            <Eye size={14} />

                                                            View

                                                        </button>

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </div>

        </DoctorLayout>

    );

}

export default DoctorAppointments;