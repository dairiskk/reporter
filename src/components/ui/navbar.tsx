"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 bg-white shadow">
      <div className="font-bold text-lg">Reporter</div>
      <div>
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </nav>
  );
}
