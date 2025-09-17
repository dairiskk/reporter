import React from "react";
import { Button } from "@/components/ui/button";

export function ReviewModal({ open, onClose, onSave, reason, comments, setReason, setComments, reasons }: {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  reason: string;
  comments: string;
  setReason: (r: string) => void;
  setComments: (c: string) => void;
  reasons: string[];
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-20 backdrop-blur-sm">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Review</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Review Reason</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          >
            {reasons.map(r => (
              <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Comments</label>
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            className="border rounded px-2 py-1 w-full min-h-[80px] resize-y"
            placeholder="Comments"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
