"use client";
import React from "react";

export default function TeamPage() {
  const members = [
    {
      name: "Member 1",
      role: "Public Frontend and UI",
      work: "Home, About, Standards, Team pages, navigation, responsive layout, and visual consistency.",
    },
    {
      name: "Member 2",
      role: "Patient Workflow",
      work: "Patient registry, care-plan view, patient uploads, prescriptions display, and patient-facing screens.",
    },
    {
      name: "Member 3",
      role: "Scheduling and Operations",
      work: "Treatment units, appointment schedule, double-booking validation, Google Calendar sync, and analytics screens.",
    },
    {
      name: "Member 4",
      role: "Database and Documentation",
      work: "PostgreSQL schema, backend API support, Railway deployment, README, and final report.",
    },
  ];

  return (
    <div className="clinical-shell min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Project Team
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Task distribution for the oncology department project.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            This page explains who is responsible for each part of the final
            submission. Replace the placeholder names with the real group member
            names before discussion.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {members.map((member) => (
            <article
              key={member.name}
              className="soft-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 font-bold text-cyan-800">
                {member.name.split(" ")[1]}
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">
                {member.name}
              </h2>
              <p className="mt-1 text-sm font-semibold text-cyan-700">
                {member.role}
              </p>
              <p className="mt-4 leading-7 text-slate-600">{member.work}</p>
            </article>
          ))}
        </div>

        <section className="soft-card mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Collaboration Summary
          </h2>
          <p className="mt-4 max-w-4xl leading-7 text-slate-600">
            The project combines public website content, role-based dashboards,
            PostgreSQL database design, backend API routes, deployment,
            standards research, and report writing. Each member can discuss a
            clear part while still understanding the full oncology workflow.
          </p>
        </section>
      </main>
    </div>
  );
}
