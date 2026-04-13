"use client";

export default function Timeline() {
  const steps = [
    { day: "Day -10", task: "Download App & Start Onboarding" },
    { day: "Day -5", task: "Upload Documents" },
    { day: "Day -2", task: "Complete Learning Modules" },
    { day: "Day 0", task: "Join NPCI 🚀" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl mb-6">Your Journey</h1>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div
            key={i}
            className="bg-white/5 p-4 rounded-xl border border-white/10"
          >
            <p className="text-orange-400 font-semibold">{step.day}</p>
            <p className="text-gray-300">{step.task}</p>
          </div>
        ))}
      </div>
    </div>
  );
}