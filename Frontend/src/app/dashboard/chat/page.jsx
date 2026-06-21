"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatCoach from "@/components/ChatCoach";

export default function ChatPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("lifeboard_token");
    if (!t) {
      router.push("/login");
      return
      
    }
    setToken(t);
  }, [router]);

  if (!token) return null;

  return <ChatCoach token={token} userName="User" />;
}
