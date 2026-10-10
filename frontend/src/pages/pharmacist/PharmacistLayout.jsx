import {
    LayoutDashboard,
    Pill,
    Users,
    Receipt,
    BarChart3,
    LogOut,
    ArrowLeft,
    Stethoscope,
} from "lucide-react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";


function PharmacistLayout({
    children,
    title,
    subtitle,
    showBack = true,
}) {
    const navigate = useNavigate();
    const location = useLocation();

    const username =
        localStorage.getItem("username") || "Pharmacist";


    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };


    const isDashboard =
        location.pathname === "/pharmacist";

    const isMedicines =
        location.pathname.startsWith(
            "/pharmacist/medicines"
        );

    const isPatients =
        location.pathname.startsWith(
            "/pharmacist/patients"
        );

    const isBills =
        location.pathname.startsWith(
            "/pharmacist/bills"
        );

    const isReports =
        location.pathname.startsWith(
            "/pharmacist/reports"
        );


    return (
        <div className="pharmacist-layout">

            {/* =================================
                SIDEBAR
            ================================= */}

            <aside className="pharmacist-sidebar">

                {/* BRAND */}

                <div className="pharmacist-sidebar-brand">

                    <div className="pharmacist-sidebar-brand-icon">
                        <Stethoscope size={22} />
                    </div>

                    <div className="pharmacist-sidebar-brand-text">

                        <strong>
                            Clinic Management
                        </strong>

                        <span>
                            Pharmacist Portal
                        </span>

                    </div>

                </div>


                {/* NAVIGATION */}

                <nav className="pharmacist-sidebar-nav">

                    {/* Dashboard */}

                    <button
                        className={`pharmacist-sidebar-link ${
                            isDashboard ? "active" : ""
                        }`}
                        onClick={() =>
                            navigate("/pharmacist")
                        }
                    >
                        <LayoutDashboard size={18} />

                        <span>
                            Dashboard
                        </span>
                    </button>


                    {/* Medicines */}

                    <button
                        className={`pharmacist-sidebar-link ${
                            isMedicines ? "active" : ""
                        }`}
                        onClick={() =>
                            navigate(
                                "/pharmacist/medicines"
                            )
                        }
                    >
                        <Pill size={18} />

                        <span>
                            Medicines
                        </span>
                    </button>


                    {/* Patients */}

                    <button
                        className={`pharmacist-sidebar-link ${
                            isPatients ? "active" : ""
                        }`}
                        onClick={() =>
                            navigate(
                                "/pharmacist/patients"
                            )
                        }
                    >
                        <Users size={18} />

                        <span>
                            Patients
                        </span>
                    </button>


                    {/* Bills */}

                    <button
                        className={`pharmacist-sidebar-link ${
                            isBills ? "active" : ""
                        }`}
                        onClick={() =>
                            navigate(
                                "/pharmacist/bills"
                            )
                        }
                    >
                        <Receipt size={18} />

                        <span>
                            Bills
                        </span>
                    </button>


                    {/* Sales Reports */}

                    <button
                        className={`pharmacist-sidebar-link ${
                            isReports ? "active" : ""
                        }`}
                        onClick={() =>
                            navigate(
                                "/pharmacist/reports"
                            )
                        }
                    >
                        <BarChart3 size={18} />

                        <span>
                            Sales Reports
                        </span>
                    </button>

                </nav>


                {/* LOGOUT */}

                <button
                    className="pharmacist-sidebar-logout"
                    onClick={handleLogout}
                >
                    <LogOut size={18} />

                    <span>
                        Logout
                    </span>
                </button>

            </aside>


            {/* =================================
                MAIN AREA
            ================================= */}

            <div className="pharmacist-main">

                {/* HEADER */}

                <header className="pharmacist-header">

                    <div className="pharmacist-header-left">

                        <div className="pharmacist-header-title">
                            Clinic Management System
                        </div>

                    </div>


                    <div className="pharmacist-header-right">

                        <div className="pharmacist-header-user">

                            <div className="pharmacist-header-avatar">
                                <Pill size={18} />
                            </div>

                            <div className="pharmacist-header-user-info">

                                <strong>
                                    {username}
                                </strong>

                                <span>
                                    Pharmacist
                                </span>

                            </div>

                        </div>


                        <button
                            className="pharmacist-header-logout"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>

                    </div>

                </header>


                {/* =================================
                    PAGE CONTENT
                ================================= */}

                <main className="pharmacist-content">

                    {/* BACK BUTTON */}

                    {!isDashboard && showBack && (
                        <button
                            className="pharmacist-back-button"
                            onClick={() =>
                                navigate(-1)
                            }
                        >
                            <ArrowLeft size={17} />

                            <span>
                                Back
                            </span>
                        </button>
                    )}


                    {/* PAGE HEADING */}

                    {(title || subtitle) && (
                        <div className="pharmacist-page-heading">

                            <div>

                                {title && (
                                    <h1>
                                        {title}
                                    </h1>
                                )}

                                {subtitle && (
                                    <p>
                                        {subtitle}
                                    </p>
                                )}

                            </div>

                        </div>
                    )}


                    {/* PAGE */}

                    {children}

                </main>

            </div>

        </div>
    );
}


export default PharmacistLayout;