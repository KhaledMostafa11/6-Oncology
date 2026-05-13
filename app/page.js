"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [analytics, setAnalytics] = useState(null);
  const [metricsAvailable, setMetricsAvailable] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load analytics.");
        }

        setAnalytics(data.analytics);
        setMetricsAvailable(true);
      } catch (error) {
        console.error("Home analytics error:", error);
        setAnalytics(null);
        setMetricsAvailable(false);
      }
    };

    loadAnalytics();
  }, []);

  const journey = [
    {
      step: "01",
      title: "Register Patient",
      text: "Patient identity, demographics, diagnosis, and department record are created in PostgreSQL.",
    },
    {
      step: "02",
      title: "Plan Appointment",
      text: "The patient or care team selects doctor, treatment unit, date, time, and clinical purpose.",
    },
    {
      step: "03",
      title: "Coordinate Treatment",
      text: "The schedule links patient, clinician, nurse, and treatment space in one appointment record.",
    },
    {
      step: "04",
      title: "Follow Up",
      text: "Prescriptions, messages, uploads, analytics, and Google Calendar keep continuity visible.",
    },
  ];

  const services = [
    "Medical oncology and chemotherapy coordination",
    "Radiotherapy session scheduling",
    "Supportive care and follow-up visits",
    "Patient communication and prescription tracking",
  ];

  const metrics = [
    { label: "Patients", value: analytics?.totalPatients },
    { label: "Units", value: analytics?.activeUnits },
    { label: "Follow-ups", value: analytics?.scheduledFollowUps },
    { label: "Clinicians", value: analytics?.totalClinicians },
  ];

  const capabilities = [
    {
      title: "Appointments",
      text: "Past dates are blocked and treatment-unit conflicts are rejected by the backend.",
    },
    {
      title: "Patient Records",
      text: "Patients, diagnoses, care plans, prescriptions, uploads, and messages are grouped together.",
    },
    {
      title: "Doctor Tools",
      text: "Doctors can write prescriptions, send patient emails, and review care activity.",
    },
    {
      title: "Connected Calendar",
      text: "Confirmed appointments can be synced to a real Google Calendar account.",
    },
  ];

  return (
    <main className="clinical-shell min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-8 md:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="fadeUp">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-cyan-700">
              General Oncology Department Platform
            </p>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
              A clearer way to coordinate oncology care.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
              This website connects patients, doctors, nurses, treatment units,
              prescriptions, messages, and appointments in one database-backed
              department workflow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-md bg-cyan-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-800 hover:shadow-md"
              >
                Open Website
              </Link>
              <Link
                href="/register"
                className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50"
              >
                Patient Registration
              </Link>
            </div>
          </div>

          <div className="soft-card fadeUp rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="premium-panel clinical-grid rounded-lg p-6 text-white">
              <p className="text-sm font-semibold text-cyan-100">
                Patient Journey
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                From first registration to follow-up care
              </h2>
              <div className="mt-6 space-y-4">
                {journey.map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/15 text-sm font-bold">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-cyan-50/85">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-3xl font-bold text-slate-950">
                    {metric.value ?? "--"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-slate-700">
              {metricsAvailable
                ? "These numbers are loaded from PostgreSQL through the analytics API."
                : "Metrics will appear when the PostgreSQL database is available."}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Department Services
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              Built for real oncology work, not a generic hospital page.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              The website focuses on the daily tasks of an oncology department:
              treatment sessions, patient follow-up, doctor communication, and
              safe use of clinical units.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <div
                key={service}
                className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 h-1.5 w-12 rounded-md bg-cyan-700" />
                <p className="font-semibold leading-7 text-slate-900">
                  {service}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              What The System Proves
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              Features are organized around patient safety and continuity.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((item) => (
              <article
                key={item.title}
                className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
