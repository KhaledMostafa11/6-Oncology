"use client";
import React, { useState, useEffect, useRef } from "react";

export default function AppointmentsPage() {
  const contentRef = useRef(null);
  const patientTimeDropdownRef = useRef(null);
  const patientFormRef = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPatientTimeDropdown, setShowPatientTimeDropdown] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [calendarStatus, setCalendarStatus] = useState({
    configured: false,
    connected: false,
    loading: true,
  });
  const [calendarMessage, setCalendarMessage] = useState("");
  const [calendarMessageType, setCalendarMessageType] = useState("info");
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [treatmentUnits, setTreatmentUnits] = useState([]);
  const [clinicians, setClinicians] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    type: "",
    date: "",
    start_time: "",
    end_time: "",
    duration: "30",
    patient_id: "",
    treatment_unit_id: "",
    doctor_id: "",
    nurse_id: "",
    protocol: "",
    notes: "",
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
    const handleClickOutside = (event) => {
      if (
        patientTimeDropdownRef.current &&
        !patientTimeDropdownRef.current.contains(event.target)
      ) {
        setShowPatientTimeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    checkCalendarStatus();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarResult = params.get("calendar");
    const reason = params.get("reason");
    const detail = params.get("detail");

    if (calendarResult === "connected") {
      setCalendarMessage("Google Calendar connected successfully.");
      setCalendarMessageType("success");
      checkCalendarStatus();
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (calendarResult === "failed") {
      const messages = {
        "missing-code": "Google did not return an authorization code. Try connecting again.",
        "session-expired":
          "Your website login session expired during Google connection. Sign in again, then connect Calendar.",
        "missing-config":
          "Google Calendar variables are missing in Railway.",
        "token-exchange":
          "Google accepted the login, but the token exchange failed. Check GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI in Railway.",
        "db-save":
          "Google accepted the login, but PostgreSQL could not save the Calendar connection. Check Railway deploy logs.",
      };
      setCalendarMessage(
        detail || messages[reason] || "Google Calendar connection failed. Try again."
      );
      setCalendarMessageType("error");
      checkCalendarStatus();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const checkCalendarStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/google/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCalendarStatus({
        configured: Boolean(data.configured),
        connected: Boolean(data.connected),
        loading: false,
      });
      if (data.connected) {
        setCalendarMessage("Google Calendar is connected.");
        setCalendarMessageType("success");
      } else if (data.message) {
        setCalendarMessage(data.message);
        setCalendarMessageType("error");
      }
    } catch {
      setCalendarStatus((current) => ({ ...current, loading: false }));
    }
  };

  const handleConnectGoogleCalendar = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/google/connect", {
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setCalendarMessage(
        data.setup || data.message || "Google Calendar is not configured yet."
      );
      setCalendarMessageType("error");
    } catch {
      setCalendarMessage("Could not start Google Calendar connection.");
      setCalendarMessageType("error");
    }
  };

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      window.location.href = "/login";
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      const [appointmentsResponse, patientsResponse, unitsResponse, staffResponse] =
        await Promise.all([
          fetch("/api/appointments"),
          fetch("/api/patients"),
          fetch("/api/treatment-units"),
          fetch("/api/staff"),
        ]);

      const [appointmentsData, patientsData, unitsData, staffData] = await Promise.all([
        appointmentsResponse.json(),
        patientsResponse.json(),
        unitsResponse.json(),
        staffResponse.json(),
      ]);

      if (!appointmentsResponse.ok || !appointmentsData.success) {
        throw new Error(appointmentsData.message || "Could not load appointments.");
      }
      if (!patientsResponse.ok || !patientsData.success) {
        throw new Error(patientsData.message || "Could not load patients.");
      }
      if (!unitsResponse.ok || !unitsData.success) {
        throw new Error(unitsData.message || "Could not load treatment units.");
      }
      if (!staffResponse.ok || !staffData.success) {
        throw new Error(staffData.message || "Could not load staff.");
      }

      const dbUnits = unitsData.treatmentUnits || [];
      const dbPatients = (patientsData.patients || []).map((patient) => ({
        ...patient,
        assignedOncologist: "Not assigned in database",
        primaryNurse: "Not assigned in database",
        carePlan: null,
        appointments: [],
      }));
      const dbClinicians = (staffData.staff || [])
        .filter((member) => member.role === "Oncologist")
        .map((member) => ({
          id: member.id,
          DRname: member.name.startsWith("Dr.") ? member.name : "Dr. " + member.name,
          SPEC: member.specialty || "Oncology",
        }));
      const dbNurses = (staffData.staff || [])
        .filter((member) => member.role === "Oncology Nurse")
        .map((member) => ({
          id: member.id,
          NUname: member.name,
        }));

      const dbSessions = (appointmentsData.appointments || [])
        .filter((appointment) => appointment.status !== "canceled")
        .map((appointment) => {
          const matchedUnit = dbUnits.find((unit) => unit.name === appointment.unit_name);
          return {
            id: appointment.id,
            type: appointment.type,
            date: String(appointment.date).slice(0, 10),
            start_time: String(appointment.start_time).slice(0, 5),
            end_time: String(appointment.end_time).slice(0, 5),
            status: appointment.status,
            protocol: appointment.protocol,
            notes: appointment.notes,
            patient: {
              PATname: appointment.patient_name,
              RSN: appointment.rsn,
            },
            treatment_unit: {
              name: appointment.unit_name || matchedUnit?.name || "To be assigned",
              floor_number: appointment.floor_number || matchedUnit?.floor_number || "-",
            },
            doctors:
              appointment.doctors?.length > 0
                ? appointment.doctors
                : [{ DRname: "To be assigned", SPEC: "Oncology" }],
            nurses:
              appointment.nurses?.length > 0
                ? appointment.nurses
                : [{ NUname: "To be assigned" }],
          };
        });

      setUser(parsedUser);
      setSessions(dbSessions);
      setTreatmentUnits(dbUnits);
      setClinicians(dbClinicians);
      setNurses(dbNurses);
      setPatients(dbPatients);
    } catch (error) {
      console.error("Error fetching appointment data:", error);
      setMessage({
        text: error.message || "Could not load appointment data from the database.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "type") {
      setFormData({
        ...formData,
        type: value,
        start_time: "",
        end_time: "",
      });
      setShowPatientTimeDropdown(false);
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const buildTimeSlots = (startHour, endHour, durationMinutes) => {
    const formatTime = (totalMinutes) => {
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    };

    const slots = [];
    for (
      let startMinutes = startHour * 60;
      startMinutes + durationMinutes <= endHour * 60;
      startMinutes += 30
    ) {
      const endMinutes = startMinutes + durationMinutes;
      slots.push({
        label: `${formatTime(startMinutes)} -> ${formatTime(endMinutes)}`,
        start: formatTime(startMinutes),
        end: formatTime(endMinutes),
      });
    }
    return slots;
  };

  const patientTimeSlotsByType = {
    radiotherapy: buildTimeSlots(0, 24, 90),
    supportive_care: buildTimeSlots(0, 24, 30),
    follow_up: buildTimeSlots(0, 24, 30),
    chemotherapy: buildTimeSlots(0, 24, 60),
  };

  const patientTimeSlots = formData.type
    ? patientTimeSlotsByType[formData.type] || []
    : [];

  const handlePatientTimeSlotChange = (e) => {
    const selectedSlot = patientTimeSlots.find(
      (slot) => slot.start === e.target.value
    );

    setFormData({
      ...formData,
      start_time: selectedSlot?.start || "",
      end_time: selectedSlot?.end || "",
    });
  };

  const selectedPatientTimeSlot = patientTimeSlots.find(
    (slot) => slot.start === formData.start_time && slot.end === formData.end_time
  );

  const todayInputValue = () => new Date().toISOString().slice(0, 10);

  const hasScheduleConflict = ({
    date,
    start_time,
    end_time,
    treatment_unit_id,
    editingId,
  }) => {
    if (!date || !start_time || !end_time || !treatment_unit_id) return false;
    const selectedUnit = treatmentUnits.find(
      (unit) => String(unit.id) === String(treatment_unit_id)
    );
    if (!selectedUnit) return false;

    return sessions.some((session) => {
      if (session.id === editingId) return false;
      return (
        session.date === date &&
        session.status === "scheduled" &&
        session.treatment_unit?.name === selectedUnit.name &&
        start_time < session.end_time &&
        end_time > session.start_time
      );
    });
  };

  const getAppointmentDateTime = (session) =>
    new Date(`${session.date}T${session.start_time}:00`);

  const canEditAppointment = (session) => {
    const appointmentTime = getAppointmentDateTime(session);
    const oneHourBefore = new Date(appointmentTime.getTime() - 60 * 60 * 1000);
    return new Date() < oneHourBefore;
  };

  const isPatient = user?.role === "Patient";
  const isOncologist = user?.role === "Oncologist";
  const patientFullName = user ? `${user.firstname} ${user.lastname}` : "";
  const oncologistFullName = user ? `${user.firstname} ${user.lastname}`.trim() : "";
  const normalizedOncologistName = oncologistFullName.toLowerCase();
  const currentPatient = patients.find(
    (patient) => patient.PATname === patientFullName
  );

  const visibleSessions = isPatient
    ? sessions.filter(
        (session) =>
          session.status !== "canceled" && session.patient.PATname === patientFullName
      )
    : isOncologist
    ? sessions.filter(
        (session) =>
          session.status !== "canceled" &&
          (!session.doctors?.length ||
            session.doctors?.some((doctor) => {
              if (doctor.DRname === "To be assigned") return true;
              const doctorName = doctor.DRname
                ?.replace(/^Dr\.\s*/i, "")
                .trim()
                .toLowerCase();
              return doctorName === normalizedOncologistName;
            }))
      )
    : sessions.filter((session) => session.status !== "canceled");

  const sortedVisibleSessions = [...visibleSessions].sort((first, second) => {
    const firstDate = getAppointmentDateTime(first).getTime();
    const secondDate = getAppointmentDateTime(second).getTime();
    return firstDate - secondDate;
  });

  const sessionsByDay = sortedVisibleSessions.reduce((groups, session) => {
    const dayKey = session.date;
    if (!groups[dayKey]) {
      groups[dayKey] = [];
    }
    groups[dayKey].push(session);
    return groups;
  }, {});

  const daySections = Object.entries(sessionsByDay);

  const resetForm = () => {
    setFormData({
      type: "",
      date: "",
      start_time: "",
      end_time: "",
      patient_id: "",
      treatment_unit_id: "",
      doctor_id: "",
      nurse_id: "",
      protocol: "",
      notes: "",
    });
    setEditingAppointmentId(null);
    setShowPatientTimeDropdown(false);
  };

  const syncAppointmentToGoogle = async (appointment) => {
    if (!calendarStatus.connected || calendarSyncing) return;

    setCalendarSyncing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/google/create-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ appointment }),
      });
      const data = await response.json();

      setCalendarMessage(
        response.ok && data.success
          ? "Appointment saved to Google Calendar. Open your calendar and refresh."
          : data.message || "Appointment saved, but Google Calendar was not updated."
      );
      setCalendarMessageType(response.ok && data.success ? "success" : "error");
    } catch {
      setCalendarMessage("Appointment saved, but Google Calendar sync failed.");
      setCalendarMessageType("error");
    } finally {
      setCalendarSyncing(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.date && formData.date < todayInputValue()) {
      setMessage({
        text: "Appointments cannot be scheduled in the past.",
        type: "error",
      });
      return;
    }

    if (isPatient) {
      if (
        !formData.type ||
        !formData.date ||
        !formData.start_time ||
        !formData.doctor_id ||
        !formData.protocol
      ) {
        setMessage({
          text: "Please fill in the required appointment details.",
          type: "error",
        });
        return;
      }

      const clinician =
        clinicians.find((doctor) => String(doctor.id) === formData.doctor_id) ||
        clinicians[0];
      const preferredUnit =
        treatmentUnits.find(
          (unit) => String(unit.id) === formData.treatment_unit_id
        ) || {
          name: "To be assigned",
          floor_number: "-",
        };

      if (
        hasScheduleConflict({
          ...formData,
          editingId: editingAppointmentId,
        })
      ) {
        setMessage({
          text: "This treatment unit is already booked at the selected time.",
          type: "error",
        });
        return;
      }

      const newAppointment = {
        id: editingAppointmentId || Date.now(),
        type: formData.type,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        status: "scheduled",
        protocol: formData.protocol,
        notes: formData.notes || "Awaiting review by the oncology team.",
        patient: {
          PATname: patientFullName,
          RSN: currentPatient?.RSN || "Pending ID",
        },
        treatment_unit: preferredUnit,
        doctors: [clinician],
        nurses: [{ NUname: "To be assigned" }],
      };

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          editingAppointmentId
            ? `/api/appointments/${editingAppointmentId}`
            : "/api/appointments",
          {
            method: editingAppointmentId ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token || ""}`,
            },
            body: JSON.stringify({
              ...formData,
              patient_id: currentPatient?.id,
            }),
          }
        );
        const data = await response.json();

        if (!response.ok || !data.success || !data.appointment) {
          throw new Error(data.message || "Could not save appointment.");
        }
        newAppointment.id = data.appointment.id;
      } catch (error) {
        setMessage({
          text: error.message || "Could not save appointment in the database.",
          type: "error",
        });
        return;
      }

      setSessions((current) =>
        editingAppointmentId
          ? current.map((session) =>
              session.id === editingAppointmentId ? newAppointment : session
            )
          : [newAppointment, ...current]
      );
      setMessage({
        text: editingAppointmentId
          ? "Your appointment has been updated successfully."
          : "Your appointment has been scheduled successfully.",
        type: "success",
      });
      await syncAppointmentToGoogle({
        ...newAppointment,
        patientName: patientFullName,
        unitName: preferredUnit.name,
      });
      setShowCreateForm(false);
      setSelectedAppointmentId(null);
      resetForm();
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return;
    }

    if (
      !formData.type ||
      !formData.date ||
      !formData.start_time ||
      !formData.end_time ||
      !formData.patient_id ||
      !formData.treatment_unit_id ||
      !formData.doctor_id ||
      !formData.nurse_id ||
      !formData.protocol
    ) {
      setMessage({
        text: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    const patient = patients.find(
      (entry) => String(entry.id) === String(formData.patient_id)
    );
    const unit = treatmentUnits.find(
      (entry) => String(entry.id) === String(formData.treatment_unit_id)
    );
    const clinician = clinicians.find(
      (entry) => String(entry.id) === String(formData.doctor_id)
    );
    const nurse = nurses.find((entry) => String(entry.id) === String(formData.nurse_id));

    if (hasScheduleConflict({ ...formData, editingId: editingAppointmentId })) {
      setMessage({
        text: "This treatment unit is already booked at the selected time.",
        type: "error",
      });
      return;
    }

    const newSession = {
      id: Date.now(),
      type: formData.type,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      status: "scheduled",
      protocol: formData.protocol,
      notes: formData.notes || "Scheduled by oncology team.",
      patient: {
        PATname: patient?.PATname || "Selected patient",
        RSN: patient?.RSN || "",
      },
      treatment_unit: {
        name: unit?.name || "Selected unit",
        floor_number: unit?.floor_number || "-",
      },
      doctors: [clinician || clinicians[0]],
      nurses: [nurse || nurses[0]],
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.appointment) {
        throw new Error(data.message || "Could not save treatment session.");
      }
      newSession.id = data.appointment.id;
    } catch (error) {
      setMessage({
        text: error.message || "Could not save treatment session in the database.",
        type: "error",
      });
      return;
    }

    setSessions((current) => [newSession, ...current]);
    setMessage({
      text: "Treatment session scheduled successfully.",
      type: "success",
    });
    await syncAppointmentToGoogle({
      ...newSession,
      patientName: patient?.PATname || "Selected patient",
      unitName: unit?.name || "Selected unit",
    });
    setShowCreateForm(false);
    resetForm();
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status === "pending" ? "scheduled" : status;

    switch (normalizedStatus) {
      case "scheduled":
        return "bg-sky-500 text-white";
      case "done":
        return "bg-emerald-500 text-white";
      case "canceled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusLabel = (status) => {
    const normalizedStatus = status === "pending" ? "scheduled" : status;

    switch (normalizedStatus) {
      case "scheduled":
        return "Scheduled";
      case "done":
        return "Done";
      case "canceled":
        return "Canceled";
      default:
        return "Scheduled";
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      chemotherapy: "Chemotherapy",
      radiotherapy: "Radiotherapy",
      supportive_care: "Supportive Care",
      follow_up: "Follow-Up Visit",
    };
    return types[type] || type;
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime || endTime === "Pending confirmation") {
      return "Pending confirmation";
    }

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diff = (end - start) / (1000 * 60);
    return `${diff} minutes`;
  };

  const handleEditAppointment = (session) => {
    if (!canEditAppointment(session)) {
      setMessage({
        text: "Appointments cannot be edited within one hour of their scheduled time.",
        type: "error",
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return;
    }

    const clinicianId = clinicians.find(
      (doctor) => doctor.DRname === session.doctors[0]?.DRname
    )?.id;
    const unitId = treatmentUnits.find(
      (unit) => unit.name === session.treatment_unit.name
    )?.id;

    setFormData({
      type: session.type,
      date: session.date,
      start_time: session.start_time,
      end_time: session.end_time,
      patient_id: "",
      treatment_unit_id: unitId ? String(unitId) : "",
      doctor_id: clinicianId ? String(clinicianId) : "",
      nurse_id: "",
      protocol: session.protocol,
      notes: session.notes || "",
    });
    setEditingAppointmentId(session.id);
    setShowCreateForm(true);
    setSelectedAppointmentId(session.id);
    setShowPatientTimeDropdown(false);
    setTimeout(() => {
      patientFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not cancel appointment.");
      }
    } catch (error) {
      setMessage({
        text: error.message || "Could not cancel appointment in the database.",
        type: "error",
      });
      return;
    }

    setSessions((current) =>
      current.filter((session) => session.id !== appointmentId)
    );
    if (editingAppointmentId === appointmentId) {
      resetForm();
      setShowCreateForm(false);
    }
    setSelectedAppointmentId(null);
    setMessage({
      text: "The appointment has been cancelled and removed permanently.",
      type: "success",
    });
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-8 md:py-10" ref={contentRef}>
        <div className="mx-auto max-w-7xl">
          <div className="fadeUp mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-3">
                {isPatient ? "My" : "Treatment"}
                <span className="block text-cyan-700">
                  {isPatient ? "Appointments" : "Schedule"}
                </span>
              </h1>
              <p className="text-base md:text-lg text-slate-600">
                {isPatient
                  ? "Review your oncology appointments and request a new visit."
                  : "Manage chemotherapy, radiotherapy, and supportive care sessions"}
              </p>
            </div>
            {isPatient && (
              <button
                onClick={() => {
                  if (showCreateForm) {
                    setShowCreateForm(false);
                    resetForm();
                  } else {
                    setShowCreateForm(true);
                  }
                }}
                className="rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-800"
              >
                {showCreateForm ? "Cancel" : "Request Appointment"}
              </button>
            )}
          </div>

          {isPatient && (
            <div className="fadeUp mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Patient</p>
                <p className="text-xl font-bold text-slate-950">{patientFullName}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Patient ID</p>
                <p className="text-xl font-bold text-slate-950">
                  {currentPatient?.RSN || "Pending ID"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Appointments</p>
                <p className="text-xl font-bold text-slate-950">
                  {visibleSessions.length}
                </p>
              </div>
            </div>
          )}

          <div className="fadeUp mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-cyan-700">
                  Google Calendar Sync
                </p>
                <h2 className="text-xl font-bold text-slate-950">
                  {calendarStatus.connected
                    ? "Connected to your real Google Calendar"
                    : "Connect your Gmail calendar for automatic appointment sync"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  When connected, new oncology appointments are created in the
                  signed-in Google Calendar account.
                </p>
                {calendarMessage && (
                  <p
                    className={`mt-3 rounded-md border px-3 py-2 text-sm font-semibold ${
                      calendarMessageType === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : calendarMessageType === "error"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {calendarMessage}
                  </p>
                )}
              </div>
              <button
                onClick={handleConnectGoogleCalendar}
                disabled={calendarStatus.connected}
                className={`rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                  calendarStatus.connected
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "bg-cyan-700 text-white hover:bg-cyan-800"
                }`}
              >
                {calendarStatus.connected
                  ? calendarSyncing
                    ? "Syncing..."
                    : "Calendar Connected"
                  : "Connect Google Calendar"}
              </button>
            </div>
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

          {showCreateForm && (
            <div
              ref={patientFormRef}
              className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-12"
            >
              <h2 className="text-3xl font-bold text-slate-950 mb-6">
                {isPatient
                  ? editingAppointmentId
                    ? "Edit Appointment"
                    : "Request A New Appointment"
                  : "Schedule New Treatment Session"}
              </h2>

              {isPatient ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  >
                    <option value="">Select appointment type</option>
                    <option value="follow_up">Follow-Up Visit</option>
                    <option value="chemotherapy">Chemotherapy</option>
                    <option value="radiotherapy">Radiotherapy</option>
                    <option value="supportive_care">Supportive Care</option>
                  </select>

                  <select
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  >
                    <option value="">Preferred clinician</option>
                    {clinicians.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.DRname} - {doctor.SPEC}
                      </option>
                    ))}
                  </select>

                  <select
                    name="treatment_unit_id"
                    value={formData.treatment_unit_id}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  >
                    <option value="">Preferred unit</option>
                    {treatmentUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} - {getTypeLabel(unit.type)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    name="protocol"
                    value={formData.protocol}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                    placeholder="Reason for appointment"
                  />

                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={todayInputValue()}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  />

                  <div className="relative" ref={patientTimeDropdownRef}>
                    <button
                      type="button"
                      onClick={() =>
                        formData.type &&
                        setShowPatientTimeDropdown((current) => !current)
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 text-left flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!formData.type}
                    >
                      <span>
                        {selectedPatientTimeSlot?.label ||
                          (formData.type
                            ? "Select appointment time"
                            : "Select appointment type first")}
                      </span>
                      <span className="text-slate-500">v</span>
                    </button>

                    {showPatientTimeDropdown && (
                      <div className="absolute top-full left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {patientTimeSlots.map((slot) => (
                          <button
                            key={slot.start}
                            type="button"
                            onClick={() => {
                              handlePatientTimeSlotChange({
                                target: { value: slot.start },
                              });
                              setShowPatientTimeDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full md:col-span-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                    placeholder="Add any symptoms, preferences, or notes for the care team"
                  ></textarea>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  >
                    <option value="">Select treatment type</option>
                    <option value="chemotherapy">Chemotherapy</option>
                    <option value="radiotherapy">Radiotherapy</option>
                    <option value="supportive_care">Supportive Care</option>
                    <option value="follow_up">Follow-Up Visit</option>
                  </select>

                  <select
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  >
                    <option value="">Select patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.PATname} ({patient.RSN})
                      </option>
                    ))}
                  </select>

                  <select
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  >
                    <option value="">Select clinician</option>
                    {clinicians.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.DRname} - {doctor.SPEC}
                      </option>
                    ))}
                  </select>

                  <select
                    name="treatment_unit_id"
                    value={formData.treatment_unit_id}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  >
                    <option value="">Select treatment unit</option>
                    {treatmentUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} - {getTypeLabel(unit.type)}
                      </option>
                    ))}
                  </select>

                  <select
                    name="nurse_id"
                    value={formData.nurse_id}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  >
                    <option value="">Select nurse</option>
                    {nurses.map((nurse) => (
                      <option key={nurse.id} value={nurse.id}>
                        {nurse.NUname}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    name="protocol"
                    value={formData.protocol}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                    placeholder="Protocol or session note"
                  />

                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={todayInputValue()}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  />

                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  />

                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  />
                </div>
              )}

              <button
                onClick={handleSubmit}
                className="mt-6 rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-800"
              >
                {isPatient
                  ? editingAppointmentId
                    ? "Save Changes"
                    : "Submit Request"
                  : "Save Session"}
              </button>
            </div>
          )}

          <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-950 mb-6">
              {isPatient ? "My Appointments" : "All Treatment Sessions"}
            </h2>

            {visibleSessions.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-600">
                No appointments found yet.
              </div>
            ) : (
              <div className="space-y-8">
                {daySections.map(([day, daySessions]) => (
                  <div key={day} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-slate-950">
                        {new Date(day).toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600">
                        {daySessions.length}{" "}
                        {daySessions.length === 1 ? "appointment" : "appointments"}
                      </span>
                    </div>

                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm cursor-pointer"
                        onClick={() =>
                          isPatient &&
                          setSelectedAppointmentId((current) =>
                            current === session.id ? null : session.id
                          )
                        }
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="mb-2 flex items-center gap-3">
                              <span className="h-3 w-3 rounded-full bg-cyan-600" />
                              <h4 className="text-xl font-bold text-slate-950">
                                {getTypeLabel(session.type)}
                              </h4>
                            </div>
                            <p className="text-sm text-slate-500">
                              {session.treatment_unit.name} - Floor{" "}
                              {session.treatment_unit.floor_number}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            {calendarStatus.connected && session.status === "scheduled" && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  syncAppointmentToGoogle({
                                    ...session,
                                    patientName: session.patient?.PATname,
                                    unitName: session.treatment_unit?.name,
                                  });
                                }}
                                disabled={calendarSyncing}
                                className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {calendarSyncing ? "Syncing..." : "Sync to Google Calendar"}
                              </button>
                            )}
                            <span
                              className={`px-3 py-1 text-xs ${getStatusColor(
                                session.status
                              )} rounded-md font-semibold uppercase`}
                            >
                              {getStatusLabel(session.status)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-slate-700 text-sm">
                          {!isPatient && (
                            <div>
                              <p className="font-semibold text-cyan-700">Patient</p>
                              <p>{session.patient.PATname}</p>
                              <p>{session.patient.RSN}</p>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-cyan-700">Clinician</p>
                            <p>{session.doctors[0].DRname}</p>
                            <p>{session.doctors[0].SPEC}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-cyan-700">Nurse</p>
                            <p>{session.nurses[0].NUname}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-cyan-700">
                              {isPatient ? "Purpose" : "Protocol"}
                            </p>
                            <p>{session.protocol}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-cyan-700">Scheduled</p>
                            <p>
                              {new Date(session.date).toLocaleDateString()} at{" "}
                              {session.start_time}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-cyan-700">Duration</p>
                            <p>
                              {calculateDuration(session.start_time, session.end_time)}
                            </p>
                          </div>
                          <div className="md:col-span-2 lg:col-span-3">
                            <p className="font-semibold text-cyan-700">Notes</p>
                            <p>{session.notes || "No additional notes."}</p>
                          </div>
                        </div>

                        {isPatient && selectedAppointmentId === session.id && (
                          <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap gap-4">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEditAppointment(session);
                              }}
                              className={`px-6 py-3 rounded-md font-semibold transition-all ${
                                canEditAppointment(session)
                                  ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCancelAppointment(session.id);
                              }}
                              className="px-6 py-3 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



