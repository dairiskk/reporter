"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/navbar";
import { useToast } from "@/components/ui/toast-provider";

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const projectId = params.get("id");
  const { showToast } = useToast();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/projects/${projectId}/results`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(data => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        showToast("Failed to load project results", "error");
        setLoading(false);
      });
  }, [projectId, showToast]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    const formData = new FormData();
    formData.append("file", file);
    fetch(`/api/projects/${projectId}/results/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast("Report uploaded", "success");
          setResults(prev => [...prev, ...data.results]);
        } else {
          showToast(data.error || "Failed to upload report", "error");
        }
      })
      .catch(() => showToast("Failed to upload report", "error"));
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto py-12">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-6">Project {projectId}</h1>
            <div className="mb-6">
              <label className="block mb-2 font-medium">Upload Playwright Report</label>
              <input type="file" accept="application/json" onChange={handleUpload} className="mb-2" />
            </div>
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <ul className="space-y-2">
              {results.map(result => (
                <li key={result.id} className="bg-white rounded shadow px-4 py-2">
                  <div className="font-medium">{result.testName}</div>
                  <div className="text-gray-600">Status: {result.status}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
