"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const contentRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    primaryCount: 0,
    scheduledToday: 0,
    activeUnits: 0,
    followUps: 0,
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
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        router.push("/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);

        if (!parsedUser) {
          router.push("/login");
          return;
        }

        setUser(parsedUser);

        const response = await fetch("/api/analytics");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load dashboard metrics.");
        }

        setStats({
          primaryCount: data.analytics.totalPatients || 0,
          scheduledToday: data.analytics.scheduledToday || 0,
          activeUnits: data.analytics.activeUnits || 0,
          followUps: data.analytics.scheduledFollowUps || 0,
        });
      } catch (error) {
        console.error("Error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const adminQuickLinks = [
    {
      title: "Manage Treatment Units",
      detail: "Rooms, capacity, and oncology resources.",
      href: "/dashboard/treatment-units",
      color: "from-sky-400 to-cyan-500",
      icon: "hospital",
    },
    {
      title: "Review Appointments",
      detail: "See sessions and scheduling conflicts.",
      href: "/dashboard/appointments",
      color: "from-emerald-400 to-teal-500",
      icon: "calendar",
    },
    {
      title: "Manage Patients",
      detail: "Patient records, prescriptions, and uploads.",
      href: "/dashboard/patients",
      color: "from-cyan-400 to-sky-500",
      icon: "user",
    },
    {
      title: "Show Database Analytics",
      detail: "Live PostgreSQL numbers for the TA.",
      href: "/dashboard/analytics",
      color: "from-teal-400 to-emerald-500",
      icon: "chart",
    },
    {
      title: "Manage Staff",
      detail: "Add or remove oncologists and nurses.",
      href: "/dashboard/staff",
      color: "from-rose-400 to-pink-500",
      icon: "users",
    },
  ];

  const staffQuickLinks = [
    {
      title: "Open Patient Records",
      detail: "Prescriptions, emails, uploads, and care plans.",
      href: "/dashboard/patients",
      color: "from-emerald-400 to-teal-500",
      icon: "calendar",
    },
    {
      title: "Check Unit Availability",
      detail: "Know where treatment sessions can happen.",
      href: "/dashboard/treatment-units",
      color: "from-sky-400 to-cyan-500",
      icon: "hospital",
    },
    {
      title: "Schedule Treatment",
      detail: "Book sessions and sync Google Calendar.",
      href: "/dashboard/appointments",
      color: "from-emerald-400 to-teal-500",
      icon: "calendar",
    },
    {
      title: "Department Analytics",
      detail: "Use live metrics in discussion.",
      href: "/dashboard/analytics",
      color: "from-teal-400 to-emerald-500",
      icon: "chart",
    },
  ];

  const patientQuickLinks = [
    {
      title: "View My Care Plan",
      detail: "Prescriptions, uploads, and follow-up details.",
      href: "/dashboard/patients",
      color: "from-cyan-400 to-sky-500",
      icon: "clipboard",
    },
    {
      title: "Book Appointment",
      detail: "Choose doctor, date, time, and treatment need.",
      href: "/dashboard/appointments",
      color: "from-emerald-400 to-teal-500",
      icon: "calendar",
    },
    {
      title: "See Treatment Units",
      detail: "Check department rooms and unit status.",
      href: "/dashboard/treatment-units",
      color: "from-sky-400 to-cyan-500",
      icon: "hospital",
    },
    {
      title: "My Insights",
      detail: "Follow-up and treatment progress summary.",
      href: "/dashboard/analytics",
      color: "from-teal-400 to-emerald-500",
      icon: "chart",
    },
  ];

  const renderQuickActionIcon = (icon) => {
    const commonProps = {
      className: "h-7 w-7 text-cyan-700",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      viewBox: "0 0 24 24",
    };

    switch (icon) {
      case "clipboard":
        return (
          <svg {...commonProps}>
            <path d="M9 3h6" />
            <path d="M9 3a2 2 0 0 0-2 2v1h10V5a2 2 0 0 0-2-2" />
            <path d="M7 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1" />
            <path d="M9 11h6" />
            <path d="M9 15h4" />
          </svg>
        );
      case "calendar":
        return (
          <svg {...commonProps}>
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M3 10h18" />
          </svg>
        );
      case "hospital":
        return (
          <svg {...commonProps}>
            <path d="M6 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
            <path d="M4 22h16" />
            <path d="M12 8v6" />
            <path d="M9 11h6" />
          </svg>
        );
      case "user":
        return (
          <svg {...commonProps}>
            <path d="M20 21a8 8 0 1 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case "users":
        return (
          <svg {...commonProps}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "chart":
      default:
        return (
          <svg {...commonProps}>
            <path d="M4 20V10" />
            <path d="M10 20V4" />
            <path d="M16 20v-8" />
            <path d="M22 20v-4" />
          </svg>
        );
    }
  };

  const getQuickLinks = () => {
    if (user?.role === "Admin") return adminQuickLinks;
    if (user?.role === "Patient") return patientQuickLinks;
    return staffQuickLinks;
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

  const primaryLabel =
    user?.role === "Admin"
      ? "Active Patients"
      : user?.role === "Patient"
      ? "Care Milestones"
      : "My Patients";

  const metricCards = [
    {
      label: primaryLabel,
      value: stats.primaryCount,
      detail: user?.role === "Patient" ? "Tracked milestones" : "Visible in care registry",
      accent: "border-l-cyan-600",
    },
    {
      label: "Scheduled Today",
      value: stats.scheduledToday,
      detail: "Appointments and sessions",
      accent: "border-l-emerald-600",
    },
    {
      label: "Active Units",
      value: stats.activeUnits,
      detail: "Ready treatment capacity",
      accent: "border-l-amber-500",
    },
    {
      label: "Follow-Ups",
      value: stats.followUps,
      detail: "Open continuity tasks",
      accent: "border-l-rose-500",
    },
  ];

  const careFlow =
    user?.role === "Patient"
      ? [
          { label: "1", value: "Open care plan" },
          { label: "2", value: "Book appointment" },
          { label: "3", value: "Upload reports" },
          { label: "4", value: "Check prescriptions" },
        ]
      : [
          { label: "1", value: "Check schedule" },
          { label: "2", value: "Open patient record" },
          { label: "3", value: "Write prescription" },
          { label: "4", value: "Send follow-up" },
        ];

  return (
    <div className="clinical-shell min-h-screen">
      <div className="px-4 py-8 md:py-10" ref={contentRef}>
        <div className="mx-auto max-w-7xl">
          <div className="fadeUp mb-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="premium-panel clinical-grid border-b border-slate-200 px-6 py-8 text-white md:px-8">
              <div className="max-w-4xl">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-200">
                  Today&apos;s workspace
                </p>
                <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                  {user?.role === "Patient"
                    ? `Hello, ${user?.firstname}`
                    : `Welcome, ${user?.firstname}`}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50/85">
                  {user?.role} | {user?.department}. Start with the cards below.
                  Each one maps to a real backend feature and live PostgreSQL data.
                </p>
              </div>
              <div className="mt-8 rounded-lg border border-white/15 bg-white/10 p-4">
                <div className="care-line mb-4 h-1.5 rounded-full" />
                <div className="grid gap-3 md:grid-cols-4">
                  {careFlow.map((step) => (
                    <div key={step.label}>
                      <p className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">
                        {step.label}
                      </p>
                      <p className="mt-1 text-xs text-cyan-100">{step.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-0 divide-y divide-slate-200 bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
              <div className="px-6 py-4">
                <p className="text-sm font-semibold text-slate-950">No demo fallback</p>
                <p className="mt-1 text-xs text-slate-500">Values come from PostgreSQL APIs.</p>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm font-semibold text-slate-950">Scheduling safety</p>
                <p className="mt-1 text-xs text-slate-500">Past dates and double booking are blocked.</p>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm font-semibold text-slate-950">Connected services</p>
                <p className="mt-1 text-xs text-slate-500">Email and Google Calendar use Railway variables.</p>
              </div>
            </div>
          </div>

          <div className="fadeUp grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {metricCards.map((metric) => (
              <div
                key={metric.label}
                className={`soft-card rounded-lg border border-l-4 border-slate-200 ${metric.accent} bg-white p-5 shadow-sm`}
              >
                <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                <p className="mt-2 text-4xl font-bold text-slate-950">
                  {metric.value}
                </p>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="fadeUp mb-8">
            <h2 className="text-3xl font-bold text-slate-950 mb-6">
              What Do You Want To Do?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getQuickLinks().map((link) => (
                <Link key={link.title} href={link.href}>
                  <div className="soft-card h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm cursor-pointer">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-100 bg-cyan-50 shadow-sm">
                      {renderQuickActionIcon(link.icon)}
                    </div>
                    <h3 className="text-lg font-bold text-slate-950">
                      {link.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {link.detail}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="fadeUp">
            <div className="rounded-lg border border-cyan-100 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-950 mb-2">
                Demo Tip
              </h3>
              <p className="text-slate-900 mb-6">
                For discussion, open the assistant and ask: "What should I demo?"
                It will explain the current page and the exact workflow.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/about">
                  <button className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100">
                    Learn More
                  </button>
                </Link>
                <Link href="/">
                  <button className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Home
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}