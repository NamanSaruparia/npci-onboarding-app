"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } else {
      alert("Login failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="space-y-4">

        <h1 className="text-xl font-semibold">Login</h1>

        <input
          placeholder="Email"
          className="p-2 bg-gray-800 rounded"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          className="p-2 bg-gray-800 rounded"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="bg-orange-500 px-4 py-2 rounded"
        >
          Login
        </button>

      </div>
    </div>
  );
}