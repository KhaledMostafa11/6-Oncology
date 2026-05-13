"use client";
import React, { useState, useEffect, useRef } from "react";

export default function PatientsPage() {
  const contentRef = useRef(null);
  const [patients, setPatients] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [editingPatient, setEditingPatient] = useState(false);
  const [patientUploads, setPatientUploads] = useState([]);
  const [prescriptionDrafts, setPrescriptionDrafts] = useState({});
  const [emailDrafts, setEmailDrafts] = useState({});
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formData, setFormData] = useState({
    PATname: "",
    PATphoneNO: "",
    sex: "",
    age: "",
    bloodType: "",
    RSN: "",
    diagnosis: "",
    stage: "",
  });

  useEffect(() => {
    const elements = contentRef.current?.querySelectorAll(".fadeUp");
    if (!elements) return;

    Array.from(elements).forEach((element, index) => {
      element.style.opacity = "0";
      element.style.transform = "translateY(40px)";
      element.style.transition = "opacity 0.8s ease, transform 0.8s ease";

      setTimeout(() => {
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
      }, 100 + index * 150);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      window.location.href = "/login";
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      const [
        patientsResponse,
        carePlansResponse,
        appointmentsResponse,
        prescriptionsResponse,
        communicationsResponse,
      ] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/care-plans"),
        fetch("/api/appointments"),
        fetch("/api/prescriptions"),
        fetch("/api/communications", {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }),
      ]);
      const [
        patientsData,
        carePlansData,
        appointmentsData,
        prescriptionsData,
        communicationsData,
      ] = await Promise.all([
        patientsResponse.json(),
        carePlansResponse.json(),
        appointmentsResponse.json(),
        prescriptionsResponse.json(),
        communicationsResponse.json(),
      ]);

      if (!patientsResponse.ok || !patientsData.success) {
        throw new Error(patientsData.message || "Could not load patients.");
      }
      if (!carePlansResponse.ok || !carePlansData.success) {
        throw new Error(carePlansData.message || "Could not load care plans.");
      }
      if (!appointmentsResponse.ok || !appointmentsData.success) {
        throw new Error(appointmentsData.message || "Could not load appointments.");
      }
      if (!prescriptionsResponse.ok || !prescriptionsData.success) {
        throw new Error(
          prescriptionsData.message || "Could not load prescriptions."
        );
      }
      if (!communicationsResponse.ok || !communicationsData.success) {
        throw new Error(
          communicationsData.message || "Could not load communications."
        );
      }

      const carePlansByPatient = (carePlansData.carePlans || []).reduce(
        (groups, plan) => ({ ...groups, [plan.patient_id]: plan }),
        {}
      );
      const appointmentsByPatient = (appointmentsData.appointments || []).reduce(
        (groups, appointment) => ({
          ...groups,
          [appointment.patient_id]: [
            ...(groups[appointment.patient_id] || []),
            {
              id: appointment.id,
              type: appointment.type,
              date: String(appointment.date).slice(0, 10),
              time: String(appointment.start_time).slice(0, 5),
              unit: appointment.unit_name || "Not assigned in database",
              attendanceStatus: appointment.attendance_status,
            },
          ],
        }),
        {}
      );
      const prescriptionsByPatient = (prescriptionsData.prescriptions || []).reduce(
        (groups, prescription) => ({
          ...groups,
          [prescription.patient_id]: [
            ...(groups[prescription.patient_id] || []),
            prescription,
          ],
        }),
        {}
      );
      const communicationsByPatient = (
        communicationsData.communications || []
      ).reduce(
        (groups, communication) => ({
          ...groups,
          [communication.patient_id]: [
            ...(groups[communication.patient_id] || []),
            communication,
          ],
        }),
        {}
      );

      setPatients(
        (patientsData.patients || []).map((patient) => ({
          ...patient,
          appointments: appointmentsByPatient[patient.id] || [],
          carePlan: carePlansByPatient[patient.id] || null,
          prescriptions: prescriptionsByPatient[patient.id] || [],
          communications: communicationsByPatient[patient.id] || [],
        }))
      );
      setUser(parsedUser);
    } catch (error) {
      console.error("Error fetching patient data:", error);
      setMessage({
        text: error.message || "Could not load patient data from the database.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePhoneNumber = (phone) => /^\d{11}$/.test(phone);

  const formatDisplayDate = (value) => {
    if (!value || value === "Not scheduled") return "Not scheduled";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatAppointmentTime = (appointment) =>
    `${formatDisplayDate(appointment.date)} at ${appointment.time}`;

  const handlePatientFileUpload = (event) => {
    const files = Array.from(event.target.files || []);
    setPatientUploads((current) => [
      ...files.map((file) => ({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        previewUrl: URL.createObjectURL(file),
      })),
      ...current,
    ]);
  };

  const handleAddPrescription = async (patientId) => {
    const draft = prescriptionDrafts[patientId]?.trim();
    if (!draft) return;

    try {
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          patientId,
          medication: draft,
          instructions: draft,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not save prescription.");
      }

      setPatients((current) =>
        current.map((patient) =>
          patient.id === patientId
            ? {
                ...patient,
                prescriptions: [data.prescription, ...(patient.prescriptions || [])],
              }
            : patient
        )
      );
      setPrescriptionDrafts((current) => ({ ...current, [patientId]: "" }));
      setMessage({ text: "Prescription saved in PostgreSQL.", type: "success" });
    } catch (error) {
      setMessage({
        text: error.message || "Could not save prescription in the database.",
        type: "error",
      });
    }
  };

  const handleSendPatientEmail = async (patient) => {
    const draft = emailDrafts[patient.id] || {
      subject: `Oncology follow-up for ${patient.PATname}`,
      message: "",
    };

    if (!patient.email) {
      setMessage({
        text: "This patient does not have an email address saved.",
        type: "error",
      });
      return;
    }

    if (!draft.subject || !draft.message) {
      setMessage({
        text: "Write an email subject and message first.",
        type: "error",
      });
      return;
    }

    setSendingEmailId(patient.id);
    let timeoutId;
    try {
      const token = localStorage.getItem("token");
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 20000);
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          patientId: patient.id,
          patientEmail: patient.email,
          patientName: patient.PATname,
          subject: draft.subject,
          message: draft.message,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not send email.");
      }

      setMessage({
        text: `Email sent to ${patient.PATname}.`,
        type: "success",
      });
      if (data.communication) {
        setPatients((current) =>
          current.map((entry) =>
            entry.id === patient.id
              ? {
                  ...entry,
                  communications: [
                    data.communication,
                    ...(entry.communications || []),
                  ],
                }
              : entry
          )
        );
      }
      setEmailDrafts((current) => ({
        ...current,
        [patient.id]: {
          subject: `Oncology follow-up for ${patient.PATname}`,
          message: "",
        },
      }));
    } catch (error) {
      setMessage({
        text:
          error.name === "AbortError"
            ? "Email request timed out. Check SMTP variables in Railway."
            : error.message || "Could not send email right now.",
        type: "error",
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setSendingEmailId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  const emptyPatientForm = {
    PATname: "",
    PATphoneNO: "",
    sex: "",
    age: "",
    bloodType: "",
    RSN: "",
    diagnosis: "",
    stage: "",
  };

  const handleAdminEditPatient = (patient) => {
    setFormData({
      PATname: patient.PATname || "",
      PATphoneNO: patient.PATphoneNO || "",
      sex: patient.sex || "",
      age: patient.age || "",
      bloodType: patient.bloodType || "",
      RSN: patient.RSN || "",
      diagnosis: patient.diagnosis || "",
      stage: patient.stage || "",
    });
    setEditingPatientId(patient.id);
    setShowCreateForm(true);
    setMessage({ text: "", type: "" });
  };

  const getAppointmentStatus = (appointment) => {
    const durationByType = {
      Chemotherapy: 120,
      Radiotherapy: 45,
      "Follow-Up": 30,
      "Lab Review": 30,
      "Oncology Review": 30,
      "Imaging Review": 30,
      "Nutrition Check-In": 30,
    };

    const [hours, minutes] = appointment.time.split(":").map(Number);
    const duration = durationByType[appointment.type] || 30;
    const appointmentEnd = new Date(
      `${appointment.date}T${String(
        Math.floor((hours * 60 + minutes + duration) / 60)
      ).padStart(2, "0")}:${String((hours * 60 + minutes + duration) % 60).padStart(
        2,
        "0"
      )}:00`
    );

    if (appointmentEnd > new Date()) {
      return "Scheduled";
    }

    return appointment.attendanceStatus === "attended" ? "Done" : "Canceled";
  };

  const handleSubmit = async () => {
    if (
      !formData.PATname ||
      !formData.PATphoneNO ||
      !formData.sex ||
      !formData.RSN ||
      !formData.diagnosis ||
      !formData.stage
    ) {
      setMessage({
        text: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    if (!validatePhoneNumber(formData.PATphoneNO)) {
      setMessage({
        text: "Phone number must be exactly 11 digits",
        type: "error",
      });
      return;
    }

    if (formData.age && (Number(formData.age) < 0 || Number(formData.age) > 120)) {
      setMessage({
        text: "Patient age must be between 0 and 120.",
        type: "error",
      });
      return;
    }

    if (editingPatientId) {
      setPatients((current) =>
        current.map((patient) =>
          patient.id === editingPatientId
            ? {
                ...patient,
                ...formData,
                age: formData.age ? Number(formData.age) : patient.age,
                bloodType: formData.bloodType || patient.bloodType,
              }
            : patient
        )
      );
      setMessage({
        text: "Patient data updated by admin.",
        type: "success",
      });
      setShowCreateForm(false);
      setEditingPatientId(null);
      setFormData(emptyPatientForm);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return;
    }

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setPatients((current) => [
          ...current,
          {
            ...data.patient,
            appointments: [],
            carePlan: null,
            prescriptions: [],
          },
        ]);
      } else {
        throw new Error(data.message || "Could not save patient.");
      }
    } catch (error) {
      setMessage({
        text: error.message || "Could not save patient in the database.",
        type: "error",
      });
      return;
    }

    setMessage({
      text: "Patient added to the oncology registry.",
      type: "success",
    });
    setShowCreateForm(false);
    setEditingPatientId(null);
    setFormData(emptyPatientForm);
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-md animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  const isPatient = user?.role === "Patient";
  const patientFullName = user ? `${user.firstname} ${user.lastname}` : "";
  const currentPatient = patients.find(
    (patient) => patient.PATname === patientFullName
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-8 md:py-10" ref={contentRef}>
        <div className="mx-auto max-w-7xl">
          <div className="fadeUp mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-3">
                {isPatient ? "My Care" : "Patient"}
                <span className="block text-cyan-700">
                  {isPatient ? "Plan" : "Registry"}
                </span>
              </h1>
              <p className="text-base md:text-lg text-slate-600">
                {isPatient
                  ? "Review your personal details, treatment plan, and care instructions."
                  : "Track oncology diagnoses, staging, and follow-up activity"}
              </p>
            </div>
            {!isPatient && user?.role === "Admin" && (
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setEditingPatientId(null);
                  setFormData(emptyPatientForm);
                }}
                className="rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
              >
                {showCreateForm ? "Cancel" : "Add Patient"}
              </button>
            )}
          </div>

          {message.text && (
            <div className="fadeUp mb-8">
              <div
                className={`${
                  message.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                } rounded-lg border p-4`}
              >
                <p className="text-center text-sm font-medium">
                  {message.text}
                </p>
              </div>
            </div>
          )}

          {!isPatient && showCreateForm && user?.role === "Admin" && (
            <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-12">
              <h2 className="text-3xl font-bold text-slate-950 mb-6">
                {editingPatientId ? "Edit Oncology Patient" : "Add New Oncology Patient"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="PATname"
                  value={formData.PATname}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  placeholder="Full name"
                />
                <input
                  type="text"
                  name="PATphoneNO"
                  value={formData.PATphoneNO}
                  onChange={handleInputChange}
                  maxLength="11"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  placeholder="Phone number"
                />
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                >
                  <option value="">Select sex</option>
                  <option value="f">Female</option>
                  <option value="m">Male</option>
                </select>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="0"
                  max="120"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  placeholder="Age"
                />
                <input
                  type="text"
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  placeholder="Blood type"
                />
                <input
                  type="text"
                  name="RSN"
                  value={formData.RSN}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  placeholder="Patient ID"
                />
                <input
                  type="text"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  placeholder="Diagnosis"
                />
                <input
                  type="text"
                  name="stage"
                  value={formData.stage}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  placeholder="Cancer stage"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="mt-6 rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-800"
              >
                Save Patient
              </button>
            </div>
          )}

          {isPatient && currentPatient ? (
            <div className="space-y-8">
              <div className="fadeUp grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Patient Name</p>
                  <p className="text-2xl font-bold text-slate-950 mt-2">
                    {currentPatient.PATname}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Patient ID</p>
                  <p className="text-2xl font-bold text-slate-950 mt-2">
                    {currentPatient.RSN}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Diagnosis</p>
                  <p className="text-2xl font-bold text-slate-950 mt-2">
                    {currentPatient.diagnosis}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Stage</p>
                  <p className="text-2xl font-bold text-slate-950 mt-2">
                    {currentPatient.stage}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Appointments</p>
                  <p className="text-2xl font-bold text-slate-950 mt-2">
                    {currentPatient.appointments.length}
                  </p>
                </div>
              </div>

              <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-3xl font-bold text-slate-950">
                    Personal Details
                  </h2>
                  {isPatient && (
                    <button
                      onClick={() => setEditingPatient((current) => !current)}
                      className="rounded-md border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
                    >
                      {editingPatient ? "Cancel Edit" : "Edit My Data"}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-slate-700">
                  <div>
                    <p className="text-cyan-700 font-semibold mb-2">Phone</p>
                    <p>{currentPatient.PATphoneNO}</p>
                  </div>
                  <div>
                    <p className="text-cyan-700 font-semibold mb-2">Sex</p>
                    <p>{currentPatient.sex === "f" ? "Female" : "Male"}</p>
                  </div>
                  <div>
                    <p className="text-cyan-700 font-semibold mb-2">Age</p>
                    <p>{currentPatient.age}</p>
                  </div>
                  <div>
                    <p className="text-cyan-700 font-semibold mb-2">Blood Type</p>
                    <p>{currentPatient.bloodType}</p>
                  </div>
                </div>

                {editingPatient && (
                  <form
                    className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      const updates = {
                        PATphoneNO: data.get("phone"),
                        age: Number(data.get("age")),
                        bloodType: data.get("bloodType"),
                        diagnosis: data.get("diagnosis"),
                        stage: data.get("stage"),
                      };

                      try {
                        const response = await fetch(
                          `/api/patients/${currentPatient.id}`,
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${
                                localStorage.getItem("token") || ""
                              }`,
                            },
                            body: JSON.stringify(updates),
                          }
                        );
                        const result = await response.json();

                        if (!response.ok || !result.success) {
                          throw new Error(
                            result.message || "Could not update patient data."
                          );
                        }

                        setPatients((current) =>
                          current.map((patient) =>
                            patient.id === currentPatient.id
                              ? { ...patient, ...result.patient }
                              : patient
                          )
                        );
                        setEditingPatient(false);
                        setMessage({
                          text: "Patient data updated in PostgreSQL.",
                          type: "success",
                        });
                      } catch (error) {
                        setMessage({
                          text:
                            error.message ||
                            "Could not update patient data in the database.",
                          type: "error",
                        });
                      }
                      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
                    }}
                  >
                    <p className="mb-4 text-sm font-semibold text-slate-700">
                      Patient edit form with existing data prefilled
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input
                        name="phone"
                        defaultValue={currentPatient.PATphoneNO}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                      />
                      <input
                        name="age"
                        type="number"
                        defaultValue={currentPatient.age}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                      />
                      <input
                        name="bloodType"
                        defaultValue={currentPatient.bloodType}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                      />
                      <input
                        name="stage"
                        defaultValue={currentPatient.stage}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                      />
                      <input
                        name="diagnosis"
                        defaultValue={currentPatient.diagnosis}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 md:col-span-2"
                      />
                    </div>
                    <button className="mt-4 rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white">
                      Save Patient Data
                    </button>
                  </form>
                )}
              </div>

              <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-3xl font-bold text-slate-950 mb-3">
                  Patient Uploads
                </h2>
                <p className="mb-5 text-sm text-slate-600">
                  Patients can upload scan images, lab reports, or referral
                  documents for the care team to review.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePatientFileUpload}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
                />
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {patientUploads.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No patient images uploaded yet.
                    </p>
                  ) : (
                    patientUploads.map((file) => (
                      <div
                        key={file.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <img
                          src={file.previewUrl}
                          alt={file.name}
                          className="h-28 w-full rounded-md object-cover"
                        />
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">{file.size}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-3xl font-bold text-slate-950 mb-6">
                  Care Plan
                </h2>
                {currentPatient.carePlan ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-slate-700">
                      {[
                        {
                          label: "Treatment Goal",
                          value: currentPatient.carePlan.treatmentGoal,
                        },
                        {
                          label: "Active Protocol",
                          value: currentPatient.carePlan.activeProtocol,
                        },
                        {
                          label: "Treatment Type",
                          value: currentPatient.carePlan.treatmentType,
                        },
                        {
                          label: "Treatment Frequency",
                          value: currentPatient.carePlan.treatmentFrequency,
                        },
                        {
                          label: "Remaining Sessions",
                          value: currentPatient.carePlan.remainingSessions,
                        },
                        {
                          label: "Completed Sessions",
                          value: currentPatient.carePlan.completedSessions,
                        },
                        {
                          label: "Total Sessions",
                          value: currentPatient.carePlan.totalSessions,
                        },
                        {
                          label: "Next Treatment",
                          value: formatDisplayDate(
                            currentPatient.carePlan.nextTreatment
                          ),
                        },
                        {
                          label: "Next Visit",
                          value: formatDisplayDate(currentPatient.nextVisit),
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-5 min-h-[136px] flex flex-col justify-between"
                        >
                          <p className="text-cyan-700 font-semibold text-xl mb-3">
                            {item.label}
                          </p>
                          <p className="text-2xl font-semibold text-slate-950 leading-tight">
                            {item.value || "Not recorded in database"}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 text-slate-700">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 min-h-[160px]">
                        <p className="text-cyan-700 font-semibold text-xl mb-3">
                          Lab Monitoring
                        </p>
                        <p className="text-base leading-7 text-slate-700">
                          {currentPatient.carePlan.labMonitoring ||
                            "Not recorded in database"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 min-h-[160px]">
                        <p className="text-cyan-700 font-semibold text-xl mb-3">
                          Supportive Care
                        </p>
                        <p className="text-base leading-7 text-slate-700">
                          {currentPatient.carePlan.supportiveCare ||
                            "Not recorded in database"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 text-slate-700 min-h-[160px]">
                      <p className="text-cyan-700 font-semibold text-xl mb-3">
                        Care Instructions
                      </p>
                      <p className="text-base leading-7 text-slate-700">
                        {currentPatient.carePlan.notes ||
                          "Not recorded in database"}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    No active care plan is saved for this patient in PostgreSQL.
                  </p>
                )}
              </div>

              <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-3xl font-bold text-slate-950 mb-6">
                  Prescriptions
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {(currentPatient.prescriptions || []).length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No prescriptions have been added yet.
                    </p>
                  ) : (
                    currentPatient.prescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="rounded-lg border border-cyan-100 bg-cyan-50 p-4"
                      >
                        <p className="font-semibold text-cyan-900">
                          {prescription.medication}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {prescription.instructions}
                        </p>
                        <p className="mt-3 text-xs font-medium text-slate-500">
                          Written by {prescription.doctor}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-3xl font-bold text-slate-950 mb-6">
                  Upcoming Appointments
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {currentPatient.appointments.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No scheduled appointments are saved for this patient.
                    </p>
                  ) : (
                    currentPatient.appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-slate-700"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-cyan-700 font-semibold text-xl">
                            {appointment.type}
                          </p>
                          <p className="mt-2 text-base text-slate-700">
                            {formatAppointmentTime(appointment)}
                          </p>
                          <p className="mt-2">{appointment.unit}</p>
                        </div>
                        <span className="rounded-md border border-cyan-100 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800">
                          {getAppointmentStatus(appointment)}
                        </span>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-950 mb-6">
                All Patients
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-950">
                          {patient.PATname}
                        </h3>
                        <p className="text-sm text-slate-500">{patient.RSN}</p>
                      </div>
                      <span className="rounded-md border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                        {patient.stage}
                      </span>
                    </div>
                    {patient.carePlan ? (
                      <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>Care plan progress</span>
                          <span>
                            {patient.carePlan.completedSessions}/
                            {patient.carePlan.totalSessions}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200">
                          <div
                            className="progress-fill h-2 rounded-full bg-cyan-700"
                            style={{
                              width: `${
                                patient.carePlan.totalSessions > 0
                                  ? Math.round(
                                      (patient.carePlan.completedSessions /
                                        patient.carePlan.totalSessions) *
                                        100
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="mb-4 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                        No active care plan is saved in PostgreSQL.
                      </p>
                    )}
                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <p>Phone: {patient.PATphoneNO}</p>
                      <p>Email: {patient.email || "Not saved"}</p>
                      <p>Diagnosis: {patient.diagnosis}</p>
                      <p>Next Visit: {formatDisplayDate(patient.nextVisit)}</p>
                      <p>Appointments: {patient.appointments.length}</p>
                    </div>

                    {["Admin", "Oncologist"].includes(user?.role) && (
                      <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                        <p className="mb-3 text-sm font-semibold text-emerald-900">
                          Doctor Prescription
                        </p>
                        <textarea
                          value={prescriptionDrafts[patient.id] || ""}
                          onChange={(event) =>
                            setPrescriptionDrafts((current) => ({
                              ...current,
                              [patient.id]: event.target.value,
                            }))
                          }
                          rows="2"
                          className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900"
                          placeholder="Write medication or prescription note"
                        />
                        <button
                          onClick={() => handleAddPrescription(patient.id)}
                          className="mt-3 rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Add Prescription
                        </button>
                        {(patient.prescriptions || []).map((prescription) => (
                          <p
                            key={prescription.id}
                            className="mt-2 text-xs text-emerald-900"
                          >
                            {prescription.medication}
                          </p>
                        ))}
                      </div>
                    )}

                    {["Admin", "Oncologist"].includes(user?.role) && (
                      <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-4">
                        <p className="mb-3 text-sm font-semibold text-sky-900">
                          Send Patient Email
                        </p>
                        <input
                          value={
                            emailDrafts[patient.id]?.subject ||
                            `Oncology follow-up for ${patient.PATname}`
                          }
                          onChange={(event) =>
                            setEmailDrafts((current) => ({
                              ...current,
                              [patient.id]: {
                                subject: event.target.value,
                                message: current[patient.id]?.message || "",
                              },
                            }))
                          }
                          className="mb-2 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                          placeholder="Email subject"
                        />
                        <textarea
                          value={emailDrafts[patient.id]?.message || ""}
                          onChange={(event) =>
                            setEmailDrafts((current) => ({
                              ...current,
                              [patient.id]: {
                                subject:
                                  current[patient.id]?.subject ||
                                  `Oncology follow-up for ${patient.PATname}`,
                                message: event.target.value,
                              },
                            }))
                          }
                          rows="3"
                          className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
                          placeholder="Write follow-up instructions, prescription note, or appointment reminder"
                        />
                        <button
                          onClick={() => handleSendPatientEmail(patient)}
                          disabled={sendingEmailId === patient.id}
                          className="mt-3 rounded-md bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {sendingEmailId === patient.id
                            ? "Sending..."
                            : "Send Email"}
                        </button>
                        <div className="mt-4 border-t border-sky-100 pt-3">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-sky-900">
                            Message history
                          </p>
                          {(patient.communications || []).length === 0 ? (
                            <p className="text-xs text-slate-500">
                              No email messages have been saved yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {(patient.communications || []).slice(0, 3).map(
                                (communication) => (
                                  <div
                                    key={communication.id}
                                    className="rounded-md border border-sky-100 bg-white p-3 text-xs text-slate-700"
                                  >
                                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                      <p className="font-semibold text-slate-950">
                                        {communication.subject}
                                      </p>
                                      <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                                        {communication.status}
                                      </span>
                                    </div>
                                    <p>
                                      {communication.body}
                                    </p>
                                    <p className="mt-2 text-slate-400">
                                      {communication.sender_name || "Oncology team"} |{" "}
                                      {new Date(
                                        communication.created_at
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {user?.role === "Patient" && (
                      <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-4">
                        <p className="mb-3 text-sm font-semibold text-sky-900">
                          Messages From Care Team
                        </p>
                        {(patient.communications || []).length === 0 ? (
                          <p className="text-sm text-slate-600">
                            No messages have been saved for your record yet.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {(patient.communications || []).map((communication) => (
                              <div
                                key={communication.id}
                                className="rounded-md border border-sky-100 bg-white p-3 text-sm text-slate-700"
                              >
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-semibold text-slate-950">
                                    {communication.subject}
                                  </p>
                                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                                    {communication.status}
                                  </span>
                                </div>
                                <p>{communication.body}</p>
                                <p className="mt-2 text-xs text-slate-400">
                                  {communication.sender_name || "Oncology team"} |{" "}
                                  {new Date(communication.created_at).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {user?.role === "Admin" && (
                      <button
                        onClick={() => handleAdminEditPatient(patient)}
                        className="mt-4 w-full rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100"
                      >
                        Edit Patient Data
                      </button>
                    )}

                    <div className="mt-4 rounded-lg bg-slate-50 p-4 border border-slate-200">
                      <p className="text-cyan-700 font-semibold mb-3">
                        Upcoming Appointments
                      </p>
                      <div className="space-y-3 text-sm text-slate-600">
                        {patient.appointments.length === 0 ? (
                          <p>No scheduled appointments are saved.</p>
                        ) : (
                          patient.appointments.map((appointment) => (
                          <div key={appointment.id} className="rounded-md bg-white p-3">
                            <p className="font-semibold text-slate-950">
                              {appointment.type}
                            </p>
                            <p>
                              {formatAppointmentTime(appointment)}
                            </p>
                            <p>{appointment.unit}</p>
                            <p className="text-slate-500">
                              {getAppointmentStatus(appointment)}
                            </p>
                          </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



