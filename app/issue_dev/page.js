"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function IssueDetailPage() {
  const router = useRouter();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [developerEmail, setDeveloperEmail] = useState(null);

  useEffect(() => {
    // Access sessionStorage inside useEffect
    const developerId = sessionStorage.getItem("developer_id");
    const email = sessionStorage.getItem("developer_email");
    setDeveloperEmail(email);

    if (!developerId) {
      router.push("/login_dev");
      return;
    }

    const issueId = sessionStorage.getItem("issue_id");
    console.log("Retrieved issue ID:", issueId); // Debugging log

    if (!issueId) {
      setError("No issue ID provided.");
      setLoading(false);
      return;
    }

    const fetchIssueById = async (issueId) => {
      try {
        const res = await fetch(`/api/issue?issueId=${issueId}`, {
          method: "GET",
        });

        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error);
        }

        const data = await res.json();
        setIssue(data);
      } catch (err) {
        console.error("Error fetching issue:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchIssueById(issueId);
  }, [router]);

  const handleStatusChange = async (newStatus) => {
    if (!developerEmail) {
      console.error("Developer email is not available in sessionStorage.");
      alert("Unable to update status: Developer email is missing.");
      return;
    }

    try {
      console.log(
        "Updating status with issue_id:",
        issue.issue_id,
        "new_status:",
        newStatus,
        "developer_email:",
        developerEmail
      );

      const res = await fetch(`/api/issue`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issue_id: issue.issue_id,
          new_status: newStatus,
          developer_email: developerEmail,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }

      const data = await res.json();
      setIssue({ ...issue, status: newStatus, resolved_by: data.resolved_by });
      console.log("Status updated successfully");
    } catch (err) {
      console.error("Unexpected error during status update:", err);
      alert("An unexpected error occurred while updating status.");
    }
  };

  if (loading) {
    return <p className="text-center">Loading issue details...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  if (!issue) {
    return <p className="text-center">No issue found.</p>;
  }

  return (
    <div>
      <div className="p-8 max-w-2xl mx-auto bg-gray-50 rounded-lg shadow-md mt-10">
        <Link
          href="/home_dev"
          className="text-gray-500 hover:text-gray-700 mb-6 inline-block"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-md">
            &larr;
          </span>
        </Link>
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          {issue.issue_header}
        </h1>
        <p className="text-sm text-gray-500 mb-4">Issue ID: {issue.issue_id}</p>
        <div className="mb-6">
          <p className="font-semibold text-lg mb-2 text-gray-800">
            Issue Detail:
          </p>
          <p className="text-gray-700 leading-relaxed">{issue.issue_detail}</p>
        </div>
        <div className="mb-6">
          <p className="font-semibold text-lg text-gray-800">Reported by:</p>
          <p className="text-gray-700 mb-4">{issue.reported_by || "Unknown"}</p>
        </div>

        <div className="mb-4">
          <label
            htmlFor="status"
            className="block text-sm font-semibold mb-2"
          >
            Status:
          </label>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-md font-semibold ${
                issue.status === "Not Started"
                  ? "bg-red-500 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
              onClick={() => handleStatusChange("Not Started")}
            >
              Not Started
            </button>
            <button
              className={`px-4 py-2 rounded-md font-semibold ${
                issue.status === "In Progress"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
              onClick={() => handleStatusChange("In Progress")}
            >
              In Progress
            </button>
            <button
              className={`px-4 py-2 rounded-md font-semibold ${
                issue.status === "Completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
              onClick={() => handleStatusChange("Completed")}
            >
              Completed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
