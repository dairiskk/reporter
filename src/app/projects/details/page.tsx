"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/navbar";
import { useToast } from "@/components/ui/toast-provider";
import { ReviewModal } from "@/components/ui/review-modal";

const PAGE_SIZE = 25;
const REVIEW_REASONS = [
  "ENV_ISSUE",
  "TEST_SCRIPT_ISSUE",
  "NEW_REQUIREMENT",
  "FLAKY_TEST",
  "DATA_ISSUE",
  "EXTERNAL_DEPENDENCY",
  "OTHER",
];

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
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState<{ reason: string; comments: string }>({ reason: "OTHER", comments: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [showComment, setShowComment] = useState<string | null>(null);

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
          // Refetch results from API after upload
          fetch(`/api/projects/${projectId}/results`)
            .then(res => res.json())
            .then(data => setResults(Array.isArray(data) ? data : []))
            .catch(() => showToast("Failed to load project results", "error"));
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

  function startEditReview(result: any) {
    setEditingReviewId(result.id);
    setReviewForm({ reason: result.review?.reason || "OTHER", comments: result.review?.comments || "" });
    setModalOpen(true);
  }
  function cancelEditReview() {
    setEditingReviewId(null);
    setReviewForm({ reason: "OTHER", comments: "" });
    setModalOpen(false);
  }
  function getUserIdFromToken() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId;
    } catch {
      return null;
    }
  }
  function saveReview(result: any) {
    const qaId = getUserIdFromToken();
    if (!qaId) {
      showToast("User ID not found in token", "error");
      return;
    }
    fetch(`/api/results/${result.id}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ reason: reviewForm.reason, comments: reviewForm.comments, qaId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast("Review updated", "success");
          setResults(prev => prev.map(r => r.id === result.id ? { ...r, reviewed: true, review: { reason: reviewForm.reason, comments: reviewForm.comments } } : r));
          cancelEditReview();
        } else {
          showToast(data.error || "Failed to update review", "error");
        }
      })
      .catch(() => showToast("Failed to update review", "error"));
  }

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
                <th className="px-4 py-2 text-left">Duration (ms)</th>
                <th className="px-4 py-2 text-left">Reviewed</th>
                <th className="px-4 py-2 text-left">Review Reason</th>
                <th className="px-4 py-2 text-left">Review Comments</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(result => (
                <tr key={result.id} className="border-b">
                  <td className="px-4 py-2 whitespace-nowrap">{result.testName}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{result.status}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(result.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{result.duration ?? "-"}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{result.reviewed ? "Yes" : "No"}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{result.review?.reason ?? "-"}</td>
                  <td className="px-4 py-2 max-w-[200px] truncate whitespace-nowrap">
                    {result.status !== "passed" ? (
                      result.review?.comments ? (
                        <button
                          className="text-blue-500 underline"
                          onClick={e => {
                            e.preventDefault();
                            setShowComment(result.review.comments);
                          }}
                        >Show comment</button>
                      ) : (
                        "-"
                      )
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {result.status !== "passed" ? (
                      <Button size="sm" variant="outline" onClick={() => startEditReview(result)}>
                        Edit
                      </Button>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
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
      <ReviewModal
        open={modalOpen}
        onClose={cancelEditReview}
        onSave={() => {
          const result = results.find(r => r.id === editingReviewId);
          if (result) saveReview(result);
        }}
        reason={reviewForm.reason}
        comments={reviewForm.comments}
        setReason={r => setReviewForm(f => ({ ...f, reason: r }))}
        setComments={c => setReviewForm(f => ({ ...f, comments: c }))}
        reasons={REVIEW_REASONS}
      />
      {showComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-20 backdrop-blur-sm">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Review Comment</h2>
            <pre className="whitespace-pre-wrap mb-4">{showComment}</pre>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setShowComment(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
