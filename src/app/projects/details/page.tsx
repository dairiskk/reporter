"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/navbar";
import { useToast } from "@/components/ui/toast-provider";

const PAGE_SIZE = 25;

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const projectId = params.get("id");
  const initialSearch = params.get("search") || "";
  const initialPage = parseInt(params.get("page") || "1", 10);
  const initialReviewed = params.get("reviewed") || "all";
  const { showToast } = useToast();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [reviewed, setReviewed] = useState(initialReviewed);

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

  // Filter and paginate results
  const filtered = results.filter(r => {
    const matchesSearch = r.testName.toLowerCase().includes(search.toLowerCase()) || r.status.toLowerCase().includes(search.toLowerCase());
    const matchesReviewed =
      reviewed === "all" ||
      (reviewed === "yes" && r.reviewed) ||
      (reviewed === "no" && !r.reviewed);
    return matchesSearch && matchesReviewed;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Progress bar calculation
  const reviewedCount = filtered.filter(r => r.reviewed).length;
  const notReviewedCount = filtered.length - reviewedCount;
  const totalCount = filtered.length;
  const reviewedPercent = totalCount ? Math.round((reviewedCount / totalCount) * 100) : 0;
  const notReviewedPercent = totalCount ? 100 - reviewedPercent : 0;

  // Update URL when search or page changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("id", projectId || "");
    url.searchParams.set("search", search);
    url.searchParams.set("page", String(page));
    url.searchParams.set("reviewed", reviewed);
    window.history.replaceState({}, "", url.toString());
  }, [search, page, reviewed, projectId]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">Project {projectId}</h1>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span>Reviewed: {reviewedCount}</span>
            <span>Not reviewed: {notReviewedCount}</span>
            <span>Total: {totalCount}</span>
          </div>
          <div className="w-full h-6 bg-gray-200 rounded overflow-hidden flex">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${reviewedPercent}%` }}
            />
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${notReviewedPercent}%` }}
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-medium">Upload Playwright Report</label>
          <input type="file" accept="application/json" onChange={handleUpload} className="mb-2" />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by test name or status..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="border rounded px-3 py-2 w-full max-w-md"
          />
          <select
            value={reviewed}
            onChange={e => { setReviewed(e.target.value); setPage(1); }}
            className="border rounded px-3 py-2"
          >
            <option value="all">All</option>
            <option value="yes">Reviewed</option>
            <option value="no">Not reviewed</option>
          </select>
        </div>
        <div className="overflow-x-auto rounded shadow bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Test Name</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(result => (
                <tr key={result.id} className="border-b">
                  <td className="px-4 py-2 whitespace-nowrap">{result.testName}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{result.status}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(result.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{result.reviewed ? "Yes" : "No"}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No results found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
