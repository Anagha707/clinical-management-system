import api from "./api";

// ==================================================
// LAB TESTS
// ==================================================

export const getLabTests = () =>
    api.get("/laboratory/tests/");

// ==================================================
// LAB PRESCRIPTIONS
// ==================================================

export const getLabPrescriptions = () =>
    api.get("/laboratory/prescriptions/");

// ==================================================
// SAMPLE COLLECTION
// ==================================================

export const collectSample = (prescriptionId) =>
    api.patch(
        `/laboratory/prescriptions/${prescriptionId}/collect-sample/`
    );

// ==================================================
// LAB RESULTS
// ==================================================

export const getLabResults = () =>
    api.get("/laboratory/results/");

export const saveLabResult = (data) =>
    api.post("/laboratory/results/", data);

// ==================================================
// LAB BILLING
// ==================================================

export const getLabBills = () =>
    api.get("/laboratory/bills/");

export const createLabBill = (data) =>
    api.post("/laboratory/bills/", data);

// ==================================================
// LAB SALES
// ==================================================

export const getLabSales = () =>
    api.get("/laboratory/sales/");


export const payLabBill = (billId) =>
    api.patch(`/laboratory/bills/${billId}/pay/`);