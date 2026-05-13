"use client";
import React from "react";

export default function AboutStandardsPage() {
  const standards = [
    {
      code: "ISO 9001",
      title: "Quality Management",
      applied:
        "The platform structures repeatable processes: registration, scheduling, prescriptions, messages, and analytics.",
    },
    {
      code: "JCI",
      title: "Patient Safety",
      applied:
        "Role access, patient records, medication notes, and safe scheduling support patient-centered care.",
    },
    {
      code: "WHO IPC",
      title: "Safe Care Environment",
      applied:
        "Treatment-unit visibility helps organize rooms, resources, and patient flow in clinical spaces.",
    },
    {
      code: "HL7 FHIR",
      title: "Interoperability",
      applied:
        "Patients, appointments, care plans, staff, and prescriptions are separated into structured resources.",
    },
  ];

  const links = [
    ["Patient record", "FHIR Patient + JCI patient identification"],
    ["Appointment", "FHIR Appointment + ISO process control"],
    ["Prescription", "Medication safety + care documentation"],
    ["Treatment unit", "Facility safety + operational monitoring"],
  ];

  return (
    <div className="clinical-shell min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Standards And Safety
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            The standards are connected to real website functions.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            This page explains how healthcare quality, patient safety,
            infection prevention, and interoperability ideas appear inside the
            oncology platform.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {standards.map((standard) => (
            <article
              key={standard.code}
              className="soft-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="inline-flex rounded-md bg-cyan-50 px-3 py-1 text-sm font-bold text-cyan-800">
                {standard.code}
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">
                {standard.title}
              </h2>
              <p className="mt-3 leading-7 text-slate-600">
                {standard.applied}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="soft-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              Relationship Between Standards
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              ISO 9001 gives the quality-management base. JCI translates that
              into hospital safety expectations. WHO IPC focuses on safe
              clinical spaces. HL7 FHIR shows how the data can be structured for
              communication with other hospital systems.
            </p>
          </div>

          <div className="soft-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              Website Feature Mapping
            </h2>
            <div className="mt-5 space-y-3">
              {links.map(([feature, standard], index) => (
                <div key={feature} className="flex gap-3 rounded-lg bg-slate-50 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-700 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-950">{feature}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {standard}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
