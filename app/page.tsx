"use client";

import { useEffect } from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { Hero } from "./components/Hero/Hero";
import { Navbar } from "./components/Navbar/Navbar";
import { Background } from "./components/Background/Background";

export default function Home() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <main className="relative min-h-screen">
      <Background />
      <Navbar />
      <Hero />
    </main>
  );
}
