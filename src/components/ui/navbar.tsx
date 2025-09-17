"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Navbar() {
  const router = useRouter();

  // Hydration fix: get user email only after mount
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUserEmail(payload.email || "");
        } catch {}
      }
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 bg-white shadow">
      <div className="flex items-center gap-8">
        <div className="font-bold text-lg">Reporter</div>
        <button
          className="text-gray-700 hover:text-blue-600 font-medium"
          onClick={() => router.push("/projects")}
        >
          Projects
        </button>
        <button
          className="text-blue-600 hover:text-blue-800 font-medium"
          onClick={() => router.push("/dashboard")}
        >
          Dashboard
        </button>
      </div>
      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="text-gray-500 text-sm">{userEmail}</span>
        )}
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </nav>
  );
}
