"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./globals.css";

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantMessages, setAssistantMessages] = useState([
    {
      role: "assistant",
      text: "Hi. I can explain this page, tell you what to demo next, and help with appointments, prescriptions, email, PostgreSQL, and Google Calendar.",
    },
  ]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        setLoading(false);
        return;
      }

      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to get user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";

  const askAssistant = async () => {
    const question = assistantQuestion.trim();
    if (!question) return;

    setAssistantMessages((current) => [
      ...current,
      { role: "user", text: question },
    ]);
    setAssistantQuestion("");

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, path: pathname, role: user?.role }),
      });
      const data = await response.json();
      setAssistantMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.answer || "I could not answer that yet.",
        },
      ]);
    } catch {
      setAssistantMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "Assistant is offline right now, but the oncology system is still usable.",
        },
      ]);
    }
  };

  const getNavLinks = () => {
    if (!user) {
      return [
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
      ];
    }

    if (user.role === "Admin") {
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/treatment-units", label: "Treatment Units" },
        { href: "/dashboard/appointments", label: "Treatment Schedule" },
        { href: "/dashboard/patients", label: "Patients" },
        { href: "/dashboard/analytics", label: "Analytics" },
      ];
    }

    if (user.role === "Patient") {
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/patients", label: "My Care Plan" },
        { href: "/dashboard/appointments", label: "Appointments" },
        { href: "/dashboard/analytics", label: "Insights" },
      ];
    }

    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/treatment-units", label: "Treatment Units" },
      { href: "/dashboard/appointments", label: "My Appointments" },
      { href: "/dashboard/patients", label: "Patients" },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <html lang="en">
      <head>
        <title>Oncology Department Platform</title>
        <meta
          name="description"
          content="General oncology department platform for patient care coordination, treatment scheduling, and follow-up tracking."
        />
      </head>
      <body className="bg-gray-50">
        {loading && !isAuthPage ? (
          <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700"></div>
              <p className="text-sm font-medium text-slate-600">Loading...</p>
            </div>
          </div>
        ) : isAuthPage ? (
          children
        ) : (
          <div className="min-h-screen bg-slate-50">
            <nav className="app-nav sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur md:px-8 lg:px-12 xl:px-16">
              <Link href="/" className="flex items-center gap-3">
                <div className="brand-mark flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-700 to-emerald-600 text-sm font-bold text-white shadow-sm">
                  ONC
                </div>
                <div className="hidden sm:block">
                  <div className="text-lg font-bold text-gray-800">
                    General Oncology
                  </div>
                  <div className="text-xs text-gray-500">
                    Department Platform
                  </div>
                </div>
              </Link>

              <div className="hidden md:flex items-center gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition hover:bg-cyan-50 hover:text-cyan-800 ${
                      pathname === link.href
                        ? "bg-cyan-50 text-cyan-800 shadow-sm"
                        : "text-slate-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {user && (
                  <div className="flex items-center gap-4">
                    <Link href="/profile">
                      <div className="hidden cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:border-cyan-200 hover:bg-cyan-50 lg:flex">
                        <div className="brand-mark flex h-8 w-8 items-center justify-center rounded-md bg-cyan-700 text-sm font-bold text-white">
                          {user.firstname?.[0]}
                          {user.lastname?.[0]}
                        </div>
                        <div className="text-xs">
                          <div className="font-semibold text-gray-800">
                            {user.firstname} {user.lastname}
                          </div>
                          <div className="text-gray-500">{user.role}</div>
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
                    >
                      Logout
                    </button>
                  </div>
                )}

                {!user && (
                  <Link
                    href="/login"
                    className="rounded-md bg-cyan-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-cyan-800"
                  >
                    Login
                  </Link>
                )}
              </div>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
                className="md:hidden"
              >
                <svg
                  width="21"
                  height="15"
                  viewBox="0 0 21 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="21" height="1.5" rx=".75" fill="#0891B2" />
                  <rect x="8" y="6" width="13" height="1.5" rx=".75" fill="#0891B2" />
                  <rect x="6" y="13" width="15" height="1.5" rx=".75" fill="#0891B2" />
                </svg>
              </button>

              <div
                className={`${
                  mobileOpen ? "flex" : "hidden"
                } absolute left-0 top-[60px] z-50 w-full flex-col items-start gap-2 border-t border-slate-200 bg-white px-6 py-4 text-sm shadow-md md:hidden`}
              >
                {user && (
                  <Link href="/profile" onClick={() => setMobileOpen(false)}>
                    <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-200 w-full">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-700 font-bold text-white">
                        {user.firstname?.[0]}
                        {user.lastname?.[0]}
                      </div>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-800">
                          {user.firstname} {user.lastname}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.role} | {user.department}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block py-2 w-full transition-colors hover:text-cyan-700 ${
                      pathname === link.href
                        ? "text-cyan-700 font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {user && (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="w-full mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 transition text-white rounded-full text-sm font-medium"
                  >
                    Logout
                  </button>
                )}

                {!user && (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="mt-4 block w-full rounded-md bg-cyan-700 px-6 py-2 text-center text-sm font-medium text-white transition hover:bg-cyan-800"
                  >
                    Login
                  </Link>
                )}
              </div>
            </nav>

            <main className="bg-slate-50">{children}</main>

            {user && (
              <div className="fixed bottom-5 right-5 z-50">
                {assistantOpen && (
                  <div className="mb-3 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-cyan-100 bg-white shadow-2xl">
                    <div className="premium-panel px-4 py-3 text-white">
                      <p className="text-sm font-bold">Oncology Care Assistant</p>
                      <p className="text-xs text-cyan-50">
                        Page-aware project helper
                      </p>
                    </div>
                    <div className="max-h-80 space-y-3 overflow-y-auto bg-slate-50 p-4">
                      {assistantMessages.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={`rounded-lg px-3 py-2 text-sm ${
                            message.role === "user"
                              ? "ml-10 bg-cyan-700 text-white"
                              : "mr-10 border border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {message.text}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white px-3 py-2">
                      {["What should I demo?", "Why is data empty?", "How Calendar sync works?"].map(
                        (prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => setAssistantQuestion(prompt)}
                            className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800 hover:bg-cyan-100"
                          >
                            {prompt}
                          </button>
                        )
                      )}
                    </div>
                    <div className="flex gap-2 border-t border-slate-200 p-3">
                      <input
                        value={assistantQuestion}
                        onChange={(event) =>
                          setAssistantQuestion(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") askAssistant();
                        }}
                        className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-700 focus:outline-none"
                        placeholder="Ask about the system..."
                      />
                      <button
                        onClick={askAssistant}
                        className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setAssistantOpen((current) => !current)}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-700"
                >
                  {assistantOpen ? "Close Assistant" : "Care Assistant"}
                </button>
              </div>
            )}

            <style jsx global>{`
              @import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");

              * {
                font-family: "Poppins", sans-serif;
              }
            `}</style>

            <footer className="w-full border-t border-slate-200 bg-white py-8 text-slate-500">
              <div className="mx-auto max-w-7xl px-4">
                <div className="mb-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-700 text-sm font-bold text-white">
                      ONC
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        General Oncology
                      </div>
                      <div className="text-xs text-slate-500">
                        Department Platform
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    Coordinated treatment scheduling | multidisciplinary care |
                    patient follow-up visibility
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div>
                    <h3 className="mb-3 font-semibold text-slate-900">
                      Quick Links
                    </h3>
                    <div className="space-y-2">
                      <Link
                        href="/"
                        className="block text-slate-500 transition-colors hover:text-cyan-700"
                      >
                        Home
                      </Link>
                      <Link
                        href="/dashboard"
                        className="block text-slate-500 transition-colors hover:text-cyan-700"
                      >
                        Dashboard
                      </Link>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold text-slate-900">Contact</h3>
                    <div className="space-y-2 text-slate-500">
                      <p>support@hospital.com</p>
                      <p>+1 (555) 123-4567</p>
                      <p>123 Hospital Street</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold text-slate-900">
                      Department
                    </h3>
                    <div className="space-y-2 text-slate-500">
                      <p>General Oncology Department</p>
                      <p>Medical and Radiation Oncology</p>
                      <p>Continuity of Care and Follow-Up</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <p className="text-center">
                    Copyright (c) {new Date().getFullYear()}{" "}
                    <span className="font-semibold text-slate-900">
                      Oncology Department Platform
                    </span>
                    . All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        )}
      </body>
    </html>
  );
}
