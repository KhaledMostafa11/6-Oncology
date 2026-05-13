"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_CREDENTIALS = {
  email: "lead.oncology@hospital.com",
  password: "OncologyAdmin123!",
};

const mockUsers = [
  {
    email: ADMIN_CREDENTIALS.email,
    password: ADMIN_CREDENTIALS.password,
    role: "Admin",
    firstname: "Lead",
    lastname: "Oncologist",
    department: "General Oncology Department",
    token: "mock-admin-token-12345",
  },
  {
    email: "oncologist@hospital.com",
    password: "oncology123",
    role: "Oncologist",
    firstname: "Maya",
    lastname: "Hassan",
    department: "Medical Oncology",
    token: "mock-oncologist-token-12345",
  },
  {
    email: "nurse.oncology@hospital.com",
    password: "nurse123",
    role: "Oncology Nurse",
    firstname: "Nour",
    lastname: "Adel",
    department: "Infusion Unit",
    token: "mock-nurse-token-12345",
  },
  {
    email: "patient@hospital.com",
    password: "patient123",
    role: "Patient",
    firstname: "Salma",
    lastname: "Maher",
    department: "Patient Services",
    token: "mock-patient-token-12345",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const contentRef = useRef(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const apiCall = async (url, options) => {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (response.ok && data.success) {
        return data;
      }
    } catch (error) {
      console.warn("Database login unavailable, using demo login.", error);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (url.includes("/api/auth/login")) {
      const body = JSON.parse(options.body);
      const user = mockUsers.find(
        (entry) => entry.email === body.email && entry.password === body.password
      );

      if (user) {
        return {
          success: true,
          token: user.token,
          user: {
            _id: "user1",
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            department: user.department,
          },
          message: "Login successful.",
        };
      }

      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    return {
      success: false,
      message: "Invalid endpoint",
    };
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage({ text: "", type: "" });
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setMessage({ text: "Please fill in all fields", type: "error" });
      return;
    }

    try {
      setLoading(true);

      const data = await apiCall("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage({ text: data.message, type: "success" });

        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage({
        text: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="relative z-10 px-4 py-16 w-full" ref={contentRef}>
        <div className="mx-auto max-w-md">
          <div className="text-center mb-8 fadeUp">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-700 text-sm font-bold text-white shadow-sm">
              ONC
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-3 tracking-tight">
              Welcome
              <span className="block text-cyan-700">
                Back
              </span>
            </h1>
            <p className="text-base text-slate-600">
              Sign in to access the oncology care dashboard
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
              <div>
                <label className="block text-slate-700 mb-2 font-medium text-sm">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-2 font-medium text-sm">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700 transition-all"
                  placeholder="Enter your password"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-md bg-cyan-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </div>

          <div className="fadeUp text-center mt-6">
            <p className="text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-cyan-700 font-semibold hover:text-cyan-900 transition-colors"
              >
                Register here
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