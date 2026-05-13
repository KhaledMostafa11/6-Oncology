"use client";
import React, { useEffect, useState } from "react";

export default function AboutPage() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load analytics.");
        }

        setAnalytics(data.analytics);
      } catch (error) {
        console.error("About analytics error:", error);
        setAnalytics(null);
      }
    };

    loadAnalytics();
  }, []);

  const users = [
    {
      title: "Patients",
      text: "Register, request appointments, view prescriptions, upload reports, and see care-team messages.",
    },
    {
      title: "Oncologists",
      text: "Review patient records, write prescriptions, schedule sessions, and send follow-up emails.",
    },
    {
      title: "Nurses",
      text: "Track sessions, treatment units, patient status, and upcoming department activity.",
    },
    {
      title: "Admins",
      text: "Manage department data, patients, treatment units, and live operational analytics.",
    },
  ];

  const metrics = [
    { value: analytics?.totalPatients, label: "Patients in registry" },
    { value: analytics?.activeTreatments, label: "Active care plans" },
    { value: analytics?.activeUnits, label: "Treatment units" },
    { value: analytics?.totalClinicians, label: "Care staff" },
  ];

  return (
    <div className="clinical-shell min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
            About The Department System
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            One workspace for oncology patients, care teams, and treatment units.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Oncology care is long-running and multi-step. This platform keeps
            appointment planning, treatment capacity, patient records,
            prescriptions, messages, and follow-up information connected.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="soft-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-3xl font-bold text-slate-950">
                {metric.value ?? "--"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {metric.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="soft-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Why Oncology Needs Coordination
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">
              Treatment is not a single visit.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              A patient may need chemotherapy, radiotherapy, supportive care,
              lab review, prescriptions, and follow-up visits over time. The
              system organizes these steps so doctors and patients can see what
              is planned and what has already happened.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {users.map((item) => (
              <article
                key={item.title}
                className="soft-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Care Journey
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">
                How the website supports the patient path
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {["Register", "Book", "Treat", "Follow up"].map((item, index) => (
                <div key={item} className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-cyan-700">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
