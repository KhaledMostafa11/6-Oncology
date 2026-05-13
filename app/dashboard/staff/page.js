"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MOCK_STAFF = [
  {
    id: 1,
    name: "Maya Hassan",
    role: "Oncologist",
    specialty: "Medical Oncology",
    email: "oncologist@hospital.com",
  },
  {
    id: 2,
    name: "Nour Adel",
    role: "Oncology Nurse",
    specialty: "Infusion Unit",
    email: "nurse.oncology@hospital.com",
  },
];

export default function StaffManagementPage() {
  const router = useRouter();
  const contentRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [dbAvailable, setDbAvailable] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "Oncologist",
    specialization: "",
    department: "General Oncology Department",
  });

  useEffect(() => {
    const elements = contentRef.current?.querySelectorAll(".fadeUp");
    if (!elements) return;
    Array.from(elements).forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(40px)";
      el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
      setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 100 + i * 150);
    });
  }, [loading]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) { router.push("/login"); return; }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "Admin") { router.push("/dashboard"); return; }
    setUser(parsedUser);
    fetchStaff();
  }, [router]);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff);
        setDbAvailable(true);
      } else {
        throw new Error();
      }
    } catch {
      setStaff(MOCK_STAFF);
      setDbAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!formData.firstname || !formData.lastname || !formData.email || !formData.password) {
      setMessage({ text: "Please fill in all required fields.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: formData.role }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `${formData.role} added successfully.`, type: "success" });
        setShowAddForm(false);
        setFormData({
          firstname: "", lastname: "", email: "", password: "",
          role: "Oncologist", specialization: "",
          department: "General Oncology Department",
        });
        fetchStaff();
      } else {
        // fallback: add to mock list
        const newMember = {
          id: Date.now(),
          name: `${formData.firstname} ${formData.lastname}`,
          role: formData.role,
          specialty: formData.specialization || formData.role,
          email: formData.email,
        };
        setStaff((prev) => [...prev, newMember]);
        setMessage({ text: `${formData.role} added (demo mode — DB unavailable).`, type: "success" });
        setShowAddForm(false);
        setFormData({
          firstname: "", lastname: "", email: "", password: "",
          role: "Oncologist", specialization: "",
          department: "General Oncology Department",
        });
      }
    } catch {
      setMessage({ text: "Could not connect to server.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (member) => {
    try {
      const res = await fetch(`/api/staff?id=${member.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStaff((prev) => prev.filter((s) => s.id !== member.id));
        setMessage({ text: `${member.name} removed successfully.`, type: "success" });
      } else {
        throw new Error();
      }
    } catch {
      // fallback: remove from local list
      setStaff((prev) => prev.filter((s) => s.id !== member.id));
      setMessage({ text: `${member.name} removed (demo mode).`, type: "success" });
    }
    setDeleteConfirm(null);
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

  const doctors = staff.filter((s) => s.role === "Oncologist");
  const nurses = staff.filter((s) => s.role === "Oncology Nurse");

  return (
    <div className="clinical-shell min-h-screen">
      <div className="px-4 py-8 md:py-10" ref={contentRef}>
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="fadeUp mb-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="premium-panel clinical-grid border-b border-slate-200 px-6 py-8 text-white md:px-8">
              <div className="max-w-4xl">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-200">
                  Admin Panel
                </p>
                <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                  Staff Management
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50/85">
                  View, add, and remove oncologists and nurses in the department.
                </p>
              </div>
            </div>
            <div className="grid gap-0 divide-y divide-slate-200 bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
              <div className="px-6 py-4">
                <p className="text-sm font-semibold text-slate-950">Total Staff</p>
                <p className="mt-1 text-xs text-slate-500">{staff.length} active members</p>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm font-semibold text-slate-950">Oncologists</p>
                <p className="mt-1 text-xs text-slate-500">{doctors.length} doctors</p>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm font-semibold text-slate-950">Nurses</p>
                <p className="mt-1 text-xs text-slate-500">{nurses.length} nursing staff</p>
              </div>
            </div>
          </div>

          {/* DB warning */}
          {!dbAvailable && (
            <div className="fadeUp mb-6 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-medium text-amber-800">
                Database unavailable — showing demo data. Changes are local only.
              </p>
            </div>
          )}

          {/* Message */}
          {message.text && (
            <div className="fadeUp mb-6">
              <div className={`rounded-lg border p-4 ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          )}

          {/* Add button */}
          <div className="fadeUp mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-950">Department Staff</h2>
            <button
              onClick={() => { setShowAddForm(!showAddForm); setMessage({ text: "", type: "" }); }}
              className="rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
            >
              {showAddForm ? "Cancel" : "+ Add Staff Member"}
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="fadeUp mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950 mb-5">New Staff Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                    placeholder="staff@hospital.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                    placeholder="Set a password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                  >
                    <option value="Oncologist">Oncologist</option>
                    <option value="Oncology Nurse">Oncology Nurse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                    placeholder="e.g. Medical Oncology"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleAddStaff}
                  disabled={submitting}
                  className="rounded-md bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Adding..." : "Add Staff Member"}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="rounded-md bg-white border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Oncologists */}
          <div className="fadeUp mb-8">
            <h3 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">{doctors.length}</span>
              Oncologists
            </h3>
            {doctors.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 text-sm">
                No oncologists found. Add one above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((member) => (
                  <StaffCard key={member.id} member={member} onDelete={() => setDeleteConfirm(member)} />
                ))}
              </div>
            )}
          </div>

          {/* Nurses */}
          <div className="fadeUp mb-8">
            <h3 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{nurses.length}</span>
              Oncology Nurses
            </h3>
            {nurses.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 text-sm">
                No nurses found. Add one above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nurses.map((member) => (
                  <StaffCard key={member.id} member={member} onDelete={() => setDeleteConfirm(member)} />
                ))}
              </div>
            )}
          </div>

          {/* Back link */}
          <div className="fadeUp">
            <Link href="/dashboard">
              <button className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-950 mb-2">Remove Staff Member</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove <span className="font-semibold text-slate-900">{deleteConfirm.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteStaff(deleteConfirm)}
                className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffCard({ member, onDelete }) {
  const isDoctor = member.role === "Oncologist";
  return (
    <div className="soft-card rounded-lg border border-l-4 border-slate-200 bg-white p-5 shadow-sm"
      style={{ borderLeftColor: isDoctor ? "#0891b2" : "#059669" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
          {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isDoctor ? "bg-cyan-50 text-cyan-700" : "bg-emerald-50 text-emerald-700"}`}>
          {member.role}
        </span>
      </div>
      <h4 className="text-base font-bold text-slate-950">{member.name}</h4>
      <p className="text-xs text-slate-500 mt-0.5">{member.specialty}</p>
      <p className="text-xs text-slate-400 mt-0.5">{member.email}</p>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={onDelete}
          className="text-xs font-semibold text-red-600 hover:text-red-800 transition"
        >
          Remove from department
        </button>
      </div>
    </div>
  );
}