"use client";

import { useState } from "react";
import BusinessCard from "@/components/BusinessCard";
import JobDescription from "@/components/JobDescription";

type Tab = "businesscard" | "jobdescription";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("businesscard");

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            iyuno HR Image Generator{" "}
            <span className="text-sm font-normal text-gray-400">(By Junoh Park)</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            명함 & 채용공고 이미지 생성기
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("businesscard")}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
              activeTab === "businesscard"
                ? "bg-gray-900 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            명함 (Business Card)
          </button>
          <button
            onClick={() => setActiveTab("jobdescription")}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
              activeTab === "jobdescription"
                ? "bg-gray-900 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            채용공고 (Job Description)
          </button>
        </div>

        {activeTab === "businesscard" ? <BusinessCard /> : <JobDescription />}
      </div>
    </main>
  );
}
