"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();
  const contentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    totalPatients: 0,
    activeTreatments: 0,
    completedCycles: 0,
    avgSessionTime: "",
    unitUtilization: 0,
    scheduledFollowUps: 0,
    totalClinicians: 0,
    activeUnits: 0,
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
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        router.push("/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        const response = await fetch("/api/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load analytics.");
        }

        setAnalyticsData(data.analytics);
      } catch (error) {
        console.error("Error fetching data:", error);
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          Could not load analytics from the database. Please check the PostgreSQL
          connection and try again.
        </div>
      </div>
    );
  }

  const completionRate = isPatient
    ? analyticsData.totalSessions > 0
      ? Math.round((analyticsData.completedCycles / analyticsData.totalSessions) * 100)
      : 0
    : analyticsData.activeTreatments > 0
      ? Math.round((analyticsData.completedCycles / analyticsData.activeTreatments) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-8 md:py-10" ref={contentRef}>
        <div className="mx-auto max-w-7xl">
          <div className="fadeUp mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-3">
              {isPatient ? "My" : "Oncology"}
              <span className="block text-cyan-700">
                {isPatient ? "Insights" : "Analytics"}
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-600">
              {isPatient
                ? "Personal treatment progress, session tracking, and upcoming care insights."
                : "Department performance and treatment activity metrics"}
            </p>
          </div>

          <div className="fadeUp grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {isPatient ? (
              <>
                <div className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Completed Sessions</p>
                  <p className="text-3xl font-bold text-slate-950">
                    {analyticsData.completedCycles}
                  </p>
                </div>
                <div className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Remaining Sessions</p>
                  <p className="text-3xl font-bold text-slate-950">
                    {analyticsData.remainingSessions}
                  </p>
                </div>
                <div className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Average Session</p>
                  <p className="text-3xl font-bold text-slate-950">
                    {analyticsData.avgSessionTime}
                  </p>
                </div>
                <div className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Next Appointment</p>
                  <p className="text-2xl font-bold text-slate-950">
                    {analyticsData.nextAppointment}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Total Patients</p>
                  <p className="text-3xl font-bold text-slate-950">
                    {analyticsData.totalPatients}
                  </p>
                </div>
                <div className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Active Treatments</p>
                  <p className="text-3xl font-bold text-slate-950">
                    {analyticsData.activeTreatments}
                  </p>
                </div>
                <div className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Average Session</p>
                  <p className="text-3xl font-bold text-slate-950">
                    {analyticsData.avgSessionTime}
                  </p>
                </div>
                <div className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Unit Utilization</p>
                  <p className="text-3xl font-bold text-slate-950">
                    {analyticsData.unitUtilization}%
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="fadeUp mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-950 mb-6">
              {isPatient ? "Treatment Progress" : "Treatment Performance"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isPatient ? (
                <>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <p className="text-lg font-semibold text-slate-950 mb-3">
                      Completion Rate
                    </p>
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {completionRate}%
                    </p>
                    <p className="text-slate-500 text-sm">
                      Completed sessions relative to your total treatment plan
                    </p>
                  </div>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <p className="text-lg font-semibold text-slate-950 mb-3">
                      Attendance Rate
                    </p>
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {analyticsData.onTimeAttendance}%
                    </p>
                    <p className="text-slate-500 text-sm">
                      On-time attendance across your recent visits
                    </p>
                  </div>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <p className="text-lg font-semibold text-slate-950 mb-3">
                      Active Care Team
                    </p>
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {analyticsData.totalClinicians}
                    </p>
                    <p className="text-slate-500 text-sm">
                      Clinicians currently involved in your treatment
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <p className="text-lg font-semibold text-slate-950 mb-3">
                      Cycle Completion
                    </p>
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {completionRate}%
                    </p>
                    <p className="text-slate-500 text-sm">
                      Completed cycles relative to active treatment load
                    </p>
                  </div>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <p className="text-lg font-semibold text-slate-950 mb-3">
                      Scheduled Follow-Ups
                    </p>
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {analyticsData.scheduledFollowUps}
                    </p>
                    <p className="text-slate-500 text-sm">
                      Upcoming follow-up visits across the department
                    </p>
                  </div>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <p className="text-lg font-semibold text-slate-950 mb-3">
                      Active Units
                    </p>
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {analyticsData.activeUnits}
                    </p>
                    <p className="text-slate-500 text-sm">
                      Treatment spaces currently supporting patient care
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-950 mb-6">
              {isPatient ? "Personal Overview" : "Department Overview"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isPatient ? (
                <>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {analyticsData.totalSessions}
                    </p>
                    <p className="text-cyan-700">Total Planned Sessions</p>
                  </div>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {analyticsData.scheduledFollowUps}
                    </p>
                    <p className="text-cyan-700">Upcoming Follow-Ups</p>
                  </div>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {analyticsData.treatmentProgress}%
                    </p>
                    <p className="text-cyan-700">Overall Treatment Progress</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {analyticsData.totalPatients}
                    </p>
                    <p className="text-cyan-700">Registered Oncology Patients</p>
                  </div>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {analyticsData.totalClinicians}
                    </p>
                    <p className="text-cyan-700">Clinicians and Care Staff</p>
                  </div>
                  <div className="soft-card rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {analyticsData.activeUnits}
                    </p>
                    <p className="text-cyan-700">Operational Treatment Units</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



