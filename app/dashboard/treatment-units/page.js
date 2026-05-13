"use client";
import React, { useState, useEffect, useRef } from "react";

export default function TreatmentUnitsPage() {
  const contentRef = useRef(null);
  const [treatmentUnits, setTreatmentUnits] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [resources, setResources] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    floor_number: "",
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
      const [unitsResponse, appointmentsResponse] = await Promise.all([
        fetch("/api/treatment-units"),
        fetch("/api/appointments"),
      ]);
      const [unitsData, appointmentsData] = await Promise.all([
        unitsResponse.json(),
        appointmentsResponse.json(),
      ]);

      if (!unitsResponse.ok || !unitsData.success) {
        throw new Error(unitsData.message || "Could not load treatment units.");
      }
      if (!appointmentsResponse.ok || !appointmentsData.success) {
        throw new Error(appointmentsData.message || "Could not load schedules.");
      }

      const dbUnits = unitsData.treatmentUnits || [];
      const dbSchedules = (appointmentsData.appointments || []).map((appointment) => {
        const unit = dbUnits.find((entry) => entry.name === appointment.unit_name);
        return {
          id: appointment.id,
          Date: String(appointment.date).slice(0, 10),
          STime: String(appointment.start_time).slice(0, 5),
          ETime: String(appointment.end_time).slice(0, 5),
          unitId: unit?.id,
          session: {
            type: appointment.type,
            patient: { PATname: appointment.patient_name },
          },
        };
      });

      setUser(parsedUser);
      setTreatmentUnits(dbUnits);
      setSchedules(dbSchedules);
      setResources(unitsData.resources || []);
    } catch (error) {
      console.error("Error fetching treatment-unit data:", error);
      setMessage({
        text: error.message || "Could not load treatment units from the database.",
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.type || !formData.floor_number) {
      setMessage({
        text: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    try {
      const response = await fetch("/api/treatment-units", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setTreatmentUnits((current) => [...current, data.treatmentUnit]);
      } else {
        throw new Error(data.message || "Could not save treatment unit.");
      }
    } catch (error) {
      setMessage({
        text: error.message || "Could not save treatment unit in the database.",
        type: "error",
      });
      return;
    }

    setMessage({
      text: "Treatment unit created successfully.",
      type: "success",
    });
    setShowCreateForm(false);
    setFormData({
      name: "",
      type: "",
      floor_number: "",
    });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-emerald-500 text-white";
      case "busy":
        return "bg-red-500 text-white";
      case "maintenance":
        return "bg-amber-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      chemotherapy: "Chemotherapy",
      radiotherapy: "Radiotherapy",
      supportive_care: "Supportive Care",
      follow_up: "Follow-Up",
    };
    return types[type] || type;
  };

  const getUnitSchedules = (unitId) =>
    schedules.filter((schedule) => schedule.unitId === unitId);

  const getUnitResources = (unitId) =>
    resources.filter((resource) => resource.unit_id === unitId);

  const unitTypeOrder = [
    "chemotherapy",
    "radiotherapy",
    "follow_up",
    "supportive_care",
  ];

  const unitsByType = unitTypeOrder.map((type) => ({
    type,
    label: getTypeLabel(type),
    units: treatmentUnits
      .filter((unit) => unit.type === type)
      .sort((first, second) =>
        first.name.localeCompare(second.name, undefined, { numeric: true })
      ),
  }));

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
                Treatment
                <span className="block text-cyan-700">
                  Units
                </span>
              </h1>
              <p className="text-base md:text-lg text-slate-600">
                Monitor oncology treatment spaces, resources, and session flow
              </p>
            </div>
            {user?.role === "Admin" && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
              >
                {showCreateForm ? "Cancel" : "Add Treatment Unit"}
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

          {showCreateForm && user?.role === "Admin" && (
            <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm mb-12">
              <h2 className="text-3xl font-bold text-slate-950 mb-6">
                Add New Treatment Unit
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  placeholder="Unit name"
                />
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                >
                  <option value="">Select type</option>
                  <option value="chemotherapy">Chemotherapy</option>
                  <option value="radiotherapy">Radiotherapy</option>
                  <option value="supportive_care">Supportive Care</option>
                  <option value="follow_up">Follow-Up</option>
                </select>
                <input
                  type="number"
                  name="floor_number"
                  value={formData.floor_number}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                  placeholder="Floor"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="mt-6 rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-800"
              >
                Create Unit
              </button>
            </div>
          )}

          <div className="space-y-10">
            {unitsByType.map((group) => (
              <div
                key={group.type}
                className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-950">{group.label}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {group.units.map((unit) => unit.name).join(" | ")}
                    </p>
                  </div>
                  <span className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                    {group.units.length} units
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {group.units.map((unit) => {
                    const unitSchedules = getUnitSchedules(unit.id);
                    const unitResources = getUnitResources(unit.id);

                    return (
                      <div
                        key={unit.id}
                        className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-slate-950">
                              {unit.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              Floor {unit.floor_number}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs ${getStatusColor(
                              unit.status
                            )} rounded-md font-semibold uppercase`}
                          >
                            {unit.status}
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="mb-3">
                            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                              <span>Utilization</span>
                              <span>{Math.min(unitSchedules.length * 25, 100)}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200">
                              <div
                                className="progress-fill h-2 rounded-full bg-cyan-700"
                                style={{
                                  width: `${Math.min(unitSchedules.length * 25, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-cyan-700 font-semibold mb-2">
                            Resources
                          </p>
                          <div className="space-y-1 text-sm text-slate-700">
                            {unitResources.length > 0 ? (
                              unitResources.map((resource) => (
                                <p key={resource.id}>{resource.resource_name}</p>
                              ))
                            ) : (
                              <p className="text-slate-500">
                                No resources assigned yet.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                          <p className="text-sm text-cyan-700 font-semibold mb-3">
                            Scheduled Sessions
                          </p>
                          {unitSchedules.length > 0 ? (
                            <div className="space-y-2">
                              {unitSchedules.map((schedule) => (
                                <div key={schedule.id} className="text-sm text-slate-700">
                                  <p>
                                    {schedule.STime} - {schedule.ETime}
                                  </p>
                                  <p>{getTypeLabel(schedule.session.type)}</p>
                                  <p>Patient: {schedule.session.patient.PATname}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">
                              No scheduled sessions for this unit.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



