"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";

interface CardData {
  nameEn: string;
  nameKr: string;
  title: string;
  team: string;
  phone: string;
  mobile: string;
  email: string;
  address1: string;
  address2: string;
}

const defaultData: CardData = {
  nameEn: "Junoh Park",
  nameKr: "박준오",
  title: "Team Leader",
  team: "Localization Group - Korean Subtitle Team",
  phone: "+82 2 516 6748",
  mobile: "+82 10-0000-0000",
  email: "junoh.park@iyuno.com",
  address1: "11th & 12th Floor, Dream Tower, 19 World Cup",
  address2: "Buk-ro 56-gil, Mapo-gu, Seoul, Korea, 03923",
};

const fields: { key: keyof CardData; label: string }[] = [
  { key: "nameEn", label: "영문 이름" },
  { key: "nameKr", label: "한글 이름" },
  { key: "title", label: "직함" },
  { key: "team", label: "팀/부서" },
  { key: "phone", label: "전화번호" },
  { key: "mobile", label: "휴대폰" },
  { key: "email", label: "이메일" },
  { key: "address1", label: "주소 1" },
  { key: "address2", label: "주소 2" },
];

export default function BusinessCard() {
  const [data, setData] = useState<CardData>(defaultData);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const update = (key: keyof CardData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const downloadImage = async (
    ref: React.RefObject<HTMLDivElement | null>,
    filename: string
  ) => {
    if (!ref.current) return;
    const dataUrl = await toPng(ref.current, {
      pixelRatio: 3,
      cacheBust: true,
    });
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">명함 정보 입력</h2>
        <div className="space-y-3">
          {fields.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {label}
              </label>
              <input
                type="text"
                value={data[key]}
                onChange={(e) => update(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => downloadImage(frontRef, "businesscard_front.png")}
            className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          >
            앞면 다운로드
          </button>
          <button
            onClick={() => downloadImage(backRef, "businesscard_back.png")}
            className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          >
            뒷면 다운로드
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">미리보기</h2>

        {/* Front */}
        <div>
          <p className="text-xs text-gray-500 mb-2">앞면</p>
          <div
            ref={frontRef}
            style={{ width: 600, height: 354 }}
            className="relative overflow-hidden shadow-lg"
          >
            <img
              src="/templates/bc_front.png"
              alt="Business Card Front"
              width={600}
              height={354}
              style={{ display: "block", width: 600, height: 354, objectFit: "cover" }}
            />
          </div>
        </div>

        {/* Back */}
        <div>
          <p className="text-xs text-gray-500 mb-2">뒷면</p>
          <div
            ref={backRef}
            style={{ width: 600, height: 354 }}
            className="bg-white relative overflow-hidden shadow-lg"
          >
            {/* iyuno icon top right */}
            <div className="absolute top-6 right-6">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <rect x="2" y="6" width="4" height="28" rx="2" fill="#1a1a1a" />
                <rect x="10" y="0" width="4" height="40" rx="2" fill="#1a1a1a" />
                <rect x="18" y="0" width="4" height="40" rx="2" fill="#1a1a1a" />
                <rect x="26" y="0" width="4" height="40" rx="2" fill="#1a1a1a" />
                <rect x="34" y="10" width="4" height="22" rx="2" fill="#1a1a1a" />
                <circle cx="4" cy="3" r="3" fill="#E8A020" />
              </svg>
            </div>

            <div className="absolute left-10 top-10">
              {/* Name */}
              <div className="flex items-baseline gap-3 mb-0.5">
                <span
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: 28,
                    fontWeight: "bold",
                    color: "#1a1a1a",
                  }}
                >
                  {data.nameEn}
                </span>
                <span
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: 16,
                    color: "#888",
                  }}
                >
                  {data.nameKr}
                </span>
              </div>

              {/* Title */}
              <p
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: 16,
                  fontWeight: "bold",
                  color: "#E8A020",
                  marginBottom: 2,
                }}
              >
                {data.title}
              </p>

              {/* Team */}
              <p
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: 14,
                  color: "#b0b0b0",
                  marginBottom: 16,
                }}
              >
                {data.team}
              </p>

              {/* Contact info with left border */}
              <div
                style={{
                  borderLeft: "3px solid #E8A020",
                  paddingLeft: 12,
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: 13,
                    color: "#333",
                    marginBottom: 2,
                  }}
                >
                  {data.phone} &nbsp;|&nbsp; {data.mobile}
                </p>
                <p
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: 13,
                    color: "#333",
                    marginBottom: 4,
                  }}
                >
                  {data.email}
                </p>
                <p
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: 12,
                    color: "#888",
                    lineHeight: 1.5,
                  }}
                >
                  {data.address1}
                  <br />
                  {data.address2}
                </p>
              </div>

              {/* Website */}
              <p
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: 13,
                  fontWeight: "bold",
                  color: "#1a1a1a",
                }}
              >
                www.iyuno.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
