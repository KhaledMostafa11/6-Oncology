"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const contentRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    specialization: "",
    licenseNumber: "",
    bio: "",
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
    fetchUserProfile();
  }, [router]);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const sessionUser = JSON.parse(storedUser);
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load profile.");
      }

      setUser(data.user);
      setProfileData({
        firstname: data.user.firstname,
        lastname: data.user.lastname,
        email: data.user.email,
        phone: data.user.phone || "",
        specialization: data.user.specialization || "",
        licenseNumber: data.user.licenseNumber || "",
        bio: data.user.bio || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({
        text: error.message || "Could not load profile from the database.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify(profileData),
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not update profile.");
        }

        setUser((current) => ({
          ...current,
          ...data.user,
          specialization: profileData.specialization,
          licenseNumber: profileData.licenseNumber,
          bio: profileData.bio,
        }));
      } catch (error) {
        throw new Error(error.message || "Could not update profile in the database.");
      }

      setMessage({
        text: "Profile updated successfully!",
        type: "success",
      });
      setEditing(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      setMessage({ text: "Error updating profile", type: "error" });
    }
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-8 md:py-10" ref={contentRef}>
        <div className="mx-auto max-w-4xl">
          <div className="fadeUp mb-8 text-center">
            <div className="mb-6 inline-block">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-lg bg-cyan-700 text-4xl font-bold text-white shadow-sm">
                {user?.firstname?.[0]}
                {user?.lastname?.[0]}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-950 mb-3 leading-tight">
              {user?.firstname} {user?.lastname}
            </h1>
            <p className="text-base md:text-lg text-slate-600">
              {user?.role} | {user?.department}
            </p>
          </div>

          {message.text && (
            <div className="fadeUp mb-8">
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

          <div className="fadeUp mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-slate-950">
                Profile Information
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    type="text"
                    name="firstname"
                    value={profileData.firstname}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                    placeholder="First name"
                  />
                  <input
                    type="text"
                    name="lastname"
                    value={profileData.lastname}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                    placeholder="Last name"
                  />
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                    placeholder="Email"
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                    placeholder="Phone"
                  />
                  {user?.role !== "Patient" && (
                    <>
                      <input
                        type="text"
                        name="specialization"
                        value={profileData.specialization}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                        placeholder="Specialization"
                      />
                      <input
                        type="text"
                        name="licenseNumber"
                        value={profileData.licenseNumber}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                        placeholder="License number"
                      />
                    </>
                  )}
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    className="w-full md:col-span-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-700"
                    rows="4"
                    placeholder="Bio"
                  ></textarea>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSubmit}
                    className="rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      fetchUserProfile();
                    }}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-cyan-700 font-semibold mb-1">
                      Email
                    </p>
                    <p className="text-slate-700">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-cyan-700 font-semibold mb-1">
                      Phone
                    </p>
                    <p className="text-slate-700">{user?.phone}</p>
                  </div>
                  {user?.role !== "Patient" && (
                    <>
                      <div>
                        <p className="text-sm text-cyan-700 font-semibold mb-1">
                          Specialization
                        </p>
                        <p className="text-slate-700">{user?.specialization}</p>
                      </div>
                      <div>
                        <p className="text-sm text-cyan-700 font-semibold mb-1">
                          License Number
                        </p>
                        <p className="text-slate-700">{user?.licenseNumber}</p>
                      </div>
                    </>
                  )}
                </div>

                {user?.bio && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <p className="text-sm text-cyan-700 font-semibold mb-2">
                      Bio
                    </p>
                    <p className="text-slate-700">{user?.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="fadeUp rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-950 mb-6">Statistics</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {user?.role === "Patient" ? (
                <>
                  <div className="rounded-lg bg-slate-50 p-5 text-center">
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {user?.patientStatistics?.completedSessions || 0}
                    </p>
                    <p className="text-cyan-700">Completed Sessions</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-5 text-center">
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {user?.patientStatistics?.remainingSessions || 0}
                    </p>
                    <p className="text-cyan-700">Remaining Sessions</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-5 text-center">
                    <p className="text-2xl font-bold text-slate-950 mb-2">
                      {user?.patientStatistics?.nextFollowUp || "Not scheduled"}
                    </p>
                    <p className="text-cyan-700">Next Follow-Up</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-slate-50 p-5 text-center">
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {user?.totalCases || 0}
                    </p>
                    <p className="text-cyan-700">Managed Cases</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-5 text-center">
                    <p className="text-4xl font-bold text-slate-950 mb-2">
                      {user?.joinedDate
                        ? new Date().getFullYear() -
                          new Date(user.joinedDate).getFullYear()
                        : "Not recorded"}
                    </p>
                    <p className="text-cyan-700">Years of Experience</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-5 text-center">
                    <p className="text-2xl font-bold text-slate-950 mb-2">
                      {user?.department}
                    </p>
                    <p className="text-cyan-700">Department</p>
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



