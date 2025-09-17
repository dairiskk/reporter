import React, { useRef } from "react";
import { Button } from "@/components/ui/button";

export function UploadModal({ open, onClose, onUpload, uploadName, setUploadName, loading }: {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  uploadName: string;
  setUploadName: (name: string) => void;
  loading?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-20 backdrop-blur-sm">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Upload Report</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Report Name</label>
          <input
            type="text"
            value={uploadName}
            onChange={e => setUploadName(e.target.value)}
            className="border rounded px-2 py-1 w-full"
            placeholder="Report name..."
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">JSON File</label>
          <input
            type="file"
            accept="application/json"
            ref={fileInputRef}
            className="border rounded px-2 py-1 w-full"
            disabled={loading}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={loading}
            onClick={() => {
              const file = fileInputRef.current?.files?.[0];
              if (file) onUpload(file);
            }}
          >
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}
