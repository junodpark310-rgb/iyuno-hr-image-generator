"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { writePsd, Psd } from "ag-psd";

// ─── Canvas 스펙 상수 ──────────────────────────────────────────────────────────
const CANVAS_W = 964;
const CANVAS_H = 567;
const SCALE = 4;
const PAGE_H = 141.73; // PDF 페이지 높이 (pt)

// pt → canvas px 변환 유틸
const px = (pt: number) => pt * SCALE;
// PDF y좌표(아래에서 위) → Canvas y좌표(위에서 아래, baseline 기준)
const cy = (yFromBottom: number) => (PAGE_H - yFromBottom) * SCALE;

// ─── 색상 상수 ────────────────────────────────────────────────────────────────
const COLOR_DARK = "rgb(35,25,22)";
const COLOR_GRAY = "rgb(90,87,87)";
const COLOR_YELLOW = "rgb(244,176,74)";
const COLOR_DIVIDER = "rgb(220,221,221)";
const COLOR_ICON_BAR = "rgb(7,2,4)";
const COLOR_ICON_DOT = "rgb(244,177,75)";

// ─── iyuno 아이콘 바 데이터 ──────────────────────────────────────────────────
interface Bar {
  xPt: number;    // PDF x (pt)
  yTopPt: number; // PDF y_from_top (pt)
  hPt: number;    // 높이 (pt)
}

const ICON_BARS: Bar[] = [
  { xPt: 201.30, yTopPt: 24.26, hPt: 5.89 },
  { xPt: 205.60, yTopPt: 19.98, hPt: 12.04 },
  { xPt: 209.90, yTopPt: 22.11, hPt: 8.57 },
  { xPt: 214.20, yTopPt: 21.58, hPt: 9.90 },
  { xPt: 218.50, yTopPt: 23.72, hPt: 5.89 },
];
const BAR_W_PT = 2.676;
const BAR_RADIUS_PT = 1.338;
const DOT_CX_PT = 202.64;
const DOT_CY_FROM_TOP_PT = 21.72; // PAGE_H - 120.01
const DOT_R_PT = 1.472;

// ─── 타입 ─────────────────────────────────────────────────────────────────────
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

// ─── Canvas 드로우 함수들 ─────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawIyunoIcon(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COLOR_ICON_BAR;
  for (const bar of ICON_BARS) {
    const x = px(bar.xPt);
    const y = px(bar.yTopPt);
    const w = px(BAR_W_PT);
    const h = px(bar.hPt);
    const r = px(BAR_RADIUS_PT);
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(x, y, w, h, r);
    } else {
      // fallback: arc 기반 roundRect
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
    ctx.fill();
  }

  // 노란 점
  ctx.fillStyle = COLOR_ICON_DOT;
  ctx.beginPath();
  ctx.arc(px(DOT_CX_PT), px(DOT_CY_FROM_TOP_PT), px(DOT_R_PT), 0, Math.PI * 2);
  ctx.fill();
}

function drawDivider(ctx: CanvasRenderingContext2D) {
  // 세로 구분선: x=21.38pt, y_start=(141.73-61.53)*4=320.8, length=30.13*4=120.5
  const divX = px(21.38);
  const divYStart = cy(61.53);
  const divLength = px(30.13);
  ctx.strokeStyle = COLOR_DIVIDER;
  ctx.lineWidth = px(0.75); // 3pt PDF 선 → 상대적 두께
  ctx.beginPath();
  ctx.moveTo(divX, divYStart);
  ctx.lineTo(divX, divYStart + divLength);
  ctx.stroke();
}

function drawNameLine(ctx: CanvasRenderingContext2D, data: CardData) {
  // 영문 이름: x=19.23pt, y_from_bottom=90.51pt, font=Montserrat Bold 14pt
  ctx.fillStyle = COLOR_DARK;
  ctx.font = `bold ${px(14)}px "Montserrat", sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(data.nameEn, px(19.23), cy(90.51));

  // 한글 이름: x=110.16pt, y_from_bottom=91.26pt, font=Noto Sans KR 8pt
  ctx.fillStyle = COLOR_GRAY;
  ctx.font = `${px(8)}px "Noto Sans KR", sans-serif`;
  ctx.fillText(data.nameKr, px(110.16), cy(91.26));
}

function drawTitle(ctx: CanvasRenderingContext2D, data: CardData) {
  // 직함: x=19.28pt, y_from_bottom=79.23pt, Montserrat Bold 9pt
  ctx.fillStyle = COLOR_YELLOW;
  ctx.font = `bold ${px(9)}px "Montserrat", sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(data.title, px(19.28), cy(79.23));
}

function drawTeam(ctx: CanvasRenderingContext2D, data: CardData) {
  // 팀명: x=19.28pt, y_from_bottom=69.66pt, Montserrat Regular 8pt
  ctx.fillStyle = COLOR_YELLOW;
  ctx.font = `${px(8)}px "Montserrat", sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(data.team, px(19.28), cy(69.66));
}

function drawContactInfo(ctx: CanvasRenderingContext2D, data: CardData) {
  ctx.textBaseline = "alphabetic";
  ctx.font = `${px(7)}px "Montserrat", sans-serif`;
  ctx.fillStyle = COLOR_DARK;

  // 전화: x=26.31pt, y_from_bottom=56.74pt, 7pt
  const phoneY = cy(56.74);
  const contactX = px(26.31);
  const phoneText = data.mobile
    ? `${data.phone}   |   ${data.mobile}`
    : data.phone;
  ctx.fillText(phoneText, contactX, phoneY);

  // 이메일: phone_y - 1.208*7pt 라인간격 (아래에서 위로 → Canvas는 빼기)
  const emailYFromBottom = 56.74 - 1.208 * 7;
  ctx.fillText(data.email, contactX, cy(emailYFromBottom));
}

function drawAddress(ctx: CanvasRenderingContext2D, data: CardData) {
  ctx.textBaseline = "alphabetic";
  ctx.font = `${px(6)}px "Montserrat", sans-serif`;
  ctx.fillStyle = COLOR_GRAY;

  // 주소1: x=26.18pt, y_from_bottom=39.53pt
  ctx.fillText(data.address1, px(26.18), cy(39.53));

  // 주소2: addr1_y - 1.333*6pt
  const addr2YFromBottom = 39.53 - 1.333 * 6;
  ctx.fillText(data.address2, px(26.18), cy(addr2YFromBottom));
}

function drawWebsite(ctx: CanvasRenderingContext2D) {
  // www.iyuno.com: x=19.97pt, y_from_bottom=19.92pt, Montserrat Bold 7pt
  ctx.fillStyle = COLOR_DARK;
  ctx.font = `bold ${px(7)}px "Montserrat", sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("www.iyuno.com", px(19.97), cy(19.92));
}

function drawBackCanvas(ctx: CanvasRenderingContext2D, data: CardData) {
  drawBackground(ctx);
  drawIyunoIcon(ctx);
  drawDivider(ctx);
  drawNameLine(ctx, data);
  drawTitle(ctx, data);
  drawTeam(ctx, data);
  drawContactInfo(ctx, data);
  drawAddress(ctx, data);
  drawWebsite(ctx);
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function BusinessCard() {
  const [data, setData] = useState<CardData>(defaultData);
  const frontRef = useRef<HTMLDivElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);

  const update = (key: keyof CardData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const renderCanvas = useCallback(async (currentData: CardData) => {
    const canvas = backCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await document.fonts.ready;
    drawBackCanvas(ctx, currentData);
  }, []);

  useEffect(() => {
    renderCanvas(data);
  }, [data, renderCanvas]);

  const downloadFront = async () => {
    if (!frontRef.current) return;
    const dataUrl = await toPng(frontRef.current, {
      pixelRatio: 1,
      cacheBust: true,
    });
    const link = document.createElement("a");
    link.download = "businesscard_front.png";
    link.href = dataUrl;
    link.click();
  };

  const downloadBack = () => {
    const canvas = backCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "businesscard_back.png";
    link.href = dataUrl;
    link.click();
  };

  const downloadBackPdf = () => {
    const canvas = backCanvasRef.current;
    if (!canvas) return;

    // 명함 크기: 85×50mm
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [85, 50] });
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, 85, 50);
    pdf.save("businesscard_back.pdf");
  };

  const downloadFrontPdf = async () => {
    if (!frontRef.current) return;
    const dataUrl = await toPng(frontRef.current, { pixelRatio: 1, cacheBust: true });
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [85, 50] });
    pdf.addImage(dataUrl, "PNG", 0, 0, 85, 50);
    pdf.save("businesscard_front.pdf");
  };

  const downloadFrontPsd = async () => {
    if (!frontRef.current) return;
    const dataUrl = await toPng(frontRef.current, { pixelRatio: 1, cacheBust: true });

    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const psd: Psd = {
      width: canvas.width,
      height: canvas.height,
      children: [{
        name: "Business Card Front",
        canvas: canvas,
        left: 0,
        top: 0,
      }],
    };

    const buffer = writePsd(psd);
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "businesscard_front.psd";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadBothPng = async () => {
    await downloadFront();
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    downloadBack();
  };

  const downloadBothPdf = async () => {
    await downloadFrontPdf();
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    downloadBackPdf();
  };

  const downloadBothPsd = async () => {
    await downloadFrontPsd();
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    await downloadBackPsd();
  };

  const downloadBackPsd = async () => {
    const canvas = backCanvasRef.current;
    if (!canvas) return;
    await document.fonts.ready;

    const createTextLayer = (
      name: string,
      text: string,
      fontStyle: string,
      color: string,
      x: number,
      y: number
    ) => {
      const layerCanvas = document.createElement("canvas");
      layerCanvas.width = CANVAS_W;
      layerCanvas.height = CANVAS_H;
      const ctx = layerCanvas.getContext("2d")!;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = color;
      ctx.font = fontStyle;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(text, x, y);
      return {
        name,
        canvas: layerCanvas,
        left: 0,
        top: 0,
      };
    };

    // 배경 레이어
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = CANVAS_W;
    bgCanvas.height = CANVAS_H;
    const bgCtx = bgCanvas.getContext("2d")!;
    bgCtx.fillStyle = "#FFFFFF";
    bgCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 아이콘 레이어
    const iconCanvas = document.createElement("canvas");
    iconCanvas.width = CANVAS_W;
    iconCanvas.height = CANVAS_H;
    const iconCtx = iconCanvas.getContext("2d")!;
    iconCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawIyunoIcon(iconCtx);

    // 구분선 레이어
    const dividerCanvas = document.createElement("canvas");
    dividerCanvas.width = CANVAS_W;
    dividerCanvas.height = CANVAS_H;
    const divCtx = dividerCanvas.getContext("2d")!;
    divCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawDivider(divCtx);

    const layers = [
      createTextLayer(
        "Name (EN)",
        data.nameEn,
        `bold ${px(14)}px "Montserrat", sans-serif`,
        COLOR_DARK,
        px(19.23),
        cy(90.51)
      ),
      createTextLayer(
        "Name (KR)",
        data.nameKr,
        `${px(8)}px "Noto Sans KR", sans-serif`,
        COLOR_GRAY,
        px(110.16),
        cy(91.26)
      ),
      createTextLayer(
        "Title",
        data.title,
        `bold ${px(9)}px "Montserrat", sans-serif`,
        COLOR_YELLOW,
        px(19.28),
        cy(79.23)
      ),
      createTextLayer(
        "Team",
        data.team,
        `${px(8)}px "Montserrat", sans-serif`,
        COLOR_YELLOW,
        px(19.28),
        cy(69.66)
      ),
      createTextLayer(
        "Phone",
        data.mobile ? `${data.phone}   |   ${data.mobile}` : data.phone,
        `${px(7)}px "Montserrat", sans-serif`,
        COLOR_DARK,
        px(26.31),
        cy(56.74)
      ),
      createTextLayer(
        "Email",
        data.email,
        `${px(7)}px "Montserrat", sans-serif`,
        COLOR_DARK,
        px(26.31),
        cy(56.74 - 1.208 * 7)
      ),
      createTextLayer(
        "Address 1",
        data.address1,
        `${px(6)}px "Montserrat", sans-serif`,
        COLOR_GRAY,
        px(26.18),
        cy(39.53)
      ),
      createTextLayer(
        "Address 2",
        data.address2,
        `${px(6)}px "Montserrat", sans-serif`,
        COLOR_GRAY,
        px(26.18),
        cy(39.53 - 1.333 * 6)
      ),
      createTextLayer(
        "Website",
        "www.iyuno.com",
        `bold ${px(7)}px "Montserrat", sans-serif`,
        COLOR_DARK,
        px(19.97),
        cy(19.92)
      ),
    ];

    const psd: Psd = {
      width: CANVAS_W,
      height: CANVAS_H,
      children: [
        { name: "Background", canvas: bgCanvas, left: 0, top: 0 },
        { name: "iyuno Icon", canvas: iconCanvas, left: 0, top: 0 },
        { name: "Divider", canvas: dividerCanvas, left: 0, top: 0 },
        ...layers.map((l) => ({
          name: l.name,
          canvas: l.canvas,
          left: l.left,
          top: l.top,
        })),
      ],
    };

    const buffer = writePsd(psd);
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "businesscard_back.psd";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
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
        <div className="space-y-3 mt-6">
          {/* 앞면 */}
          <p className="text-xs font-medium text-gray-500">앞면 다운로드</p>
          <div className="flex gap-2">
            <button
              onClick={downloadFront}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              PNG
            </button>
            <button
              onClick={downloadFrontPdf}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              PDF
            </button>
            <button
              onClick={downloadFrontPsd}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              PSD
            </button>
          </div>

          {/* 뒷면 */}
          <p className="text-xs font-medium text-gray-500">뒷면 다운로드</p>
          <div className="flex gap-2">
            <button
              onClick={downloadBack}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              PNG
            </button>
            <button
              onClick={downloadBackPdf}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              PDF
            </button>
            <button
              onClick={downloadBackPsd}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              PSD
            </button>
          </div>

          {/* 앞뒤 세트 */}
          <p className="text-xs font-medium text-gray-500">앞뒤 세트 다운로드</p>
          <div className="flex gap-2">
            <button
              onClick={downloadBothPng}
              className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors cursor-pointer"
            >
              PNG 세트
            </button>
            <button
              onClick={downloadBothPdf}
              className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors cursor-pointer"
            >
              PDF 세트
            </button>
            <button
              onClick={downloadBothPsd}
              className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors cursor-pointer"
            >
              PSD 세트
            </button>
          </div>
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
            style={{ width: 964, height: 567 }}
            className="relative overflow-hidden shadow-lg"
          >
            <img
              src="/templates/bc_front.png"
              alt="Business Card Front"
              width={964}
              height={567}
              style={{ display: "block", width: 964, height: 567, objectFit: "cover" }}
            />
          </div>
        </div>

        {/* Back */}
        <div>
          <p className="text-xs text-gray-500 mb-2">뒷면</p>
          <canvas
            ref={backCanvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ display: "block", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
          />
        </div>
      </div>
    </div>
  );
}
