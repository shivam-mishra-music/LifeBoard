"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("lifeboard_token");
    if (token) {
      router.replace("/dashboard");
    } else {
      setChecked(true);
    }
  }, [router]);

  // Avoid a flash of the landing page for users who are about to be redirected
  if (!checked) return <div className="min-h-screen bg-[#030611]" />;

  return <LandingPage />;
}