"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const contentRef = useRef(null);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    age: "",
    sex: "",
    bloodType: "",
    city: "",
    emergencyContact: "",
    diagnosis: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage({ text: "", type: "" });
  };

  const handleSubmit = async () => {
    if (
      !formData.firstname ||
      !formData.lastname ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.phone ||
      !formData.age ||
      !formData.sex
    ) {
      setMessage({ text: "Please fill in all required fields", type: "error" });
      return;
    }

    if (formData.password.length < 8) {
      setMessage({
        text: "Password must be at least 8 characters long",
        type: "error",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }

    if (Number(formData.age) < 0 || Number(formData.age) > 120) {
      setMessage({ text: "Please enter a valid patient age", type: "error" });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ text: data.message, type: "success" });
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch (error) {
      setMessage({
        text: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-10">
      <div className="relative z-10 px-4 w-full" ref={contentRef}>
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8 fadeUp">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-700 text-sm font-bold text-white shadow-sm">
              ONC
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-3 tracking-tight">
              Create
              <span className="block text-cyan-700">
                Account
              </span>
            </h1>
            <p className="text-base text-slate-600">
              Join the oncology care coordination platform
            </p>
          </div>

          {message.text && (
            <div className="fadeUp mb-6">
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

          <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 mb-2 font-medium text-sm">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 font-medium text-sm">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-2 font-medium text-sm">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                  placeholder="name@hospital.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 mb-2 font-medium text-sm">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 font-medium text-sm">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 mb-2 font-medium text-sm">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                    placeholder="Patient phone"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 font-medium text-sm">
                    Age *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                    placeholder="Patient age"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 mb-2 font-medium text-sm">
                    Sex *
                  </label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                  >
                    <option value="">Select sex</option>
                    <option value="f">Female</option>
                    <option value="m">Male</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 font-medium text-sm">
                    Blood Type
                  </label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                  >
                    <option value="">Unknown</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                  placeholder="City / demographic area"
                />
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                  placeholder="Emergency contact"
                />
              </div>

              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                rows="3"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                placeholder="Known diagnosis, symptoms, or reason for oncology registration"
              />

              <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Note:</span> Public
                  registration is only available for patients. Staff and admin
                  users are managed by the hospital administrator.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-md bg-cyan-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </div>

          <div className="fadeUp text-center mt-6">
            <p className="text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-cyan-700 font-semibold hover:text-cyan-900 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="fadeUp text-center mt-4">
            <Link
              href="/"
              className="text-slate-500 transition hover:text-cyan-700 text-sm"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


