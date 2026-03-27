"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Section {
  header: string;
  content: string;
}

interface PositionStyle {
  fontSize: number;
  gap: number; // white gap height between logo and 채용공고
  x: number; // horizontal offset from left margin
  y: number; // vertical offset within the gap area
}

interface JDData {
  positionName: string;
  positionStyle: PositionStyle;
  sections: Section[];
}

const defaultData: JDData = {
  positionName: "한국어 더빙팀 Project Manager",
  positionStyle: { fontSize: 20, gap: 38, x: 30, y: 5 },
  sections: [
    {
      header: "채용분야 및 인원",
      content:
        "Korean Dubbing Team, Project Manager / 정규직 (수습기간 3개월)\n총 2인 (여 1인 포함 / 장 0인 / 보훈 0인)",
    },
    {
      header: "소개",
      content:
        "글로벌 더빙팀의 프로젝트를 관리하는 업무를 수행합니다.\n아이유노 더빙팀으로 입사하면 다양한 언어의 더빙 컨텐츠를 경험할 수 있습니다.",
    },
    {
      header: "담당업무",
      content:
        "• 한국어 수급 관리 및 고객사 PM 커뮤니케이션\n• 더빙 스케줄 관리 및 SOW에 따라 납품일 준수하여 운영\n• 고객사 가이드라인 준수",
    },
    {
      header: "자격요건",
      content:
        "• 한국어/외국어 더빙 프로덕션 분야 (Business Level)\n• 프로젝트 매니지먼트 경험 3년 이상\n• 조직과의 원활한 협업 및 효율적인 커뮤니케이션 능력 보유\n• 프로세스 개선 및 효율화에 대한 관심이 높은 자\n• 고객사의 요구에 대한 신속한 문제 해결 및 대응 능력을 갖추신 분\n• 그 외 기타 자격",
    },
    {
      header: "우대사항",
      content:
        "• 더빙에 대한 이해가 있으신 분\n• 미디어 업계 (영상 번역/자막) 유관 경험이 있으신 분",
    },
    {
      header: "응시자격",
      content:
        "• 남자, 여자, 장애인, 국가유공 대상자 전형으로 해당 시 별도 제출서류 제출",
    },
  ],
};

const FONT_FAMILY =
  '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", Arial, sans-serif';

// Template image slicing coordinates
const TEMPLATE_W = 868;
const TOP_LOGO_END = 275; // end of iyuno logo area (includes full logo)
const TOP_BANNER_START = 310; // start of 채용공고 text
const TOP_END = 772; // end of top fixed area (monster graphic + separator line at y=769-770)
const BOTTOM_START = 1860; // start of bottom fixed area
const BOTTOM_END = 4152; // end of template (trim bottom grey band)

const TRIM_LEFT = 5;
const TRIM_TOP = 5;
const TRIM_RIGHT = 4;

const MARGIN = 30;
const HEADER_SIZE = 30;
const BODY_SIZE = 16;
const HEADER_LH = 38;
const BODY_LH = 26;
const SECTION_GAP = 35;
// Position name defaults removed — now dynamic via data.positionStyle

export default function JobDescription() {
  const [data, setData] = useState<JDData>(defaultData);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const templateImgRef = useRef<HTMLImageElement | null>(null);
  const [fontsReady, setFontsReady] = useState(false);

  // Load template image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      templateImgRef.current = img;
      setTemplateLoaded(true);
    };
    img.src = "/templates/Jobdescription.png";
  }, []);

  // Wait for fonts
  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  // Helper: measure wrapped text height without drawing
  const measureTextBlock = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      text: string,
      maxWidth: number,
      fontSize: number,
      lineHeight: number,
      bold = false
    ): number => {
      ctx.font = `${bold ? "bold " : ""}${fontSize}px ${FONT_FAMILY}`;
      let totalH = 0;
      const lines = text.split("\n");
      for (const line of lines) {
        if (!line) {
          totalH += lineHeight * 0.5;
          continue;
        }
        let currentLine = "";
        for (const char of line) {
          const testLine = currentLine + char;
          if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            totalH += lineHeight;
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) totalH += lineHeight;
      }
      return totalH;
    },
    []
  );

  // Helper: draw wrapped text, returns final Y
  const drawText = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number,
      lineHeight: number,
      color: string,
      bold = false
    ): number => {
      ctx.fillStyle = color;
      ctx.font = `${bold ? "bold " : ""}${fontSize}px ${FONT_FAMILY}`;
      const lines = text.split("\n");
      let curY = y;
      for (const line of lines) {
        if (!line) {
          curY += lineHeight * 0.5;
          continue;
        }
        let currentLine = "";
        for (const char of line) {
          const testLine = currentLine + char;
          if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            ctx.fillText(currentLine, x, curY);
            curY += lineHeight;
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          ctx.fillText(currentLine, x, curY);
          curY += lineHeight;
        }
      }
      return curY;
    },
    []
  );

  // Calculate middle content height
  const calcMiddleHeight = useCallback(
    (ctx: CanvasRenderingContext2D): number => {
      const contentW = TEMPLATE_W - MARGIN * 2;
      let h = 40; // top padding
      for (const section of data.sections) {
        // header
        h += measureTextBlock(
          ctx,
          section.header,
          contentW,
          HEADER_SIZE,
          HEADER_LH,
          true
        );
        h += 8; // gap between header and body
        // body
        if (section.content) {
          h += measureTextBlock(
            ctx,
            section.content,
            contentW,
            BODY_SIZE,
            BODY_LH,
            false
          );
        }
        h += SECTION_GAP;
      }
      h += 20; // bottom padding
      return h;
    },
    [data.sections, measureTextBlock]
  );

  // Draw canvas
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !templateImgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = templateImgRef.current;

    const contentW = TEMPLATE_W - MARGIN * 2;

    // Calculate heights
    const topLogoH = TOP_LOGO_END; // 0..235
    const posNameH = data.positionStyle.gap; // dynamic gap
    const topBannerH = TOP_END - TOP_BANNER_START; // 310..700
    const topTotalH = topLogoH + posNameH + topBannerH;

    const middleH = calcMiddleHeight(ctx);

    const bottomH = BOTTOM_END - BOTTOM_START; // 1860..4160

    const totalH = topTotalH + middleH + bottomH;
    canvas.width = TEMPLATE_W;
    canvas.height = totalH;

    // Fill white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, TEMPLATE_W, totalH);

    let drawY = 0;

    // ===== PART 1: TOP FIXED =====

    // 1a. Logo area (template y:0 to y:235) — trim border from src left+top+right
    ctx.drawImage(
      img,
      TRIM_LEFT,
      TRIM_TOP,
      TEMPLATE_W - TRIM_LEFT - TRIM_RIGHT,
      TOP_LOGO_END - TRIM_TOP,
      TRIM_LEFT,
      drawY + TRIM_TOP,
      TEMPLATE_W - TRIM_LEFT - TRIM_RIGHT,
      TOP_LOGO_END - TRIM_TOP
    );
    drawY += TOP_LOGO_END;

    // 1b. Position name in white gap
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, drawY, TEMPLATE_W, posNameH);
    if (data.positionName) {
      const pFS = data.positionStyle.fontSize;
      drawText(
        ctx,
        data.positionName,
        data.positionStyle.x,
        drawY + pFS + data.positionStyle.y,
        TEMPLATE_W - data.positionStyle.x - 20,
        pFS,
        pFS + 8,
        "#333333",
        true
      );
    }
    drawY += posNameH;

    // 1c. 채용공고 + monster + adventure banner (template y:310 to y:700) — trim border from src left+right
    ctx.drawImage(
      img,
      TRIM_LEFT,
      TOP_BANNER_START,
      TEMPLATE_W - TRIM_LEFT - TRIM_RIGHT,
      topBannerH,
      TRIM_LEFT,
      drawY,
      TEMPLATE_W - TRIM_LEFT - TRIM_RIGHT,
      topBannerH
    );
    drawY += topBannerH;

    // ===== PART 2: MIDDLE DYNAMIC =====
    const middleStartY = drawY;



    let curY = middleStartY + 40;

    for (const section of data.sections) {
      // Section header
      curY = drawText(
        ctx,
        section.header,
        MARGIN,
        curY,
        contentW,
        HEADER_SIZE,
        HEADER_LH,
        "#1a1a1a",
        true
      );
      curY += 8;

      // Section body
      if (section.content) {
        curY = drawText(
          ctx,
          section.content,
          MARGIN,
          curY,
          contentW,
          BODY_SIZE,
          BODY_LH,
          "#444444",
          false
        );
      }
      curY += SECTION_GAP;
    }

    drawY = middleStartY + middleH;

    // ===== PART 3: BOTTOM FIXED ===== — trim border from src left+right
    ctx.drawImage(
      img,
      TRIM_LEFT,
      BOTTOM_START,
      TEMPLATE_W - TRIM_LEFT - TRIM_RIGHT,
      bottomH,
      TRIM_LEFT,
      drawY,
      TEMPLATE_W - TRIM_LEFT - TRIM_RIGHT,
      bottomH
    );
  }, [data, calcMiddleHeight, drawText]);

  // Redraw on data/font/template change
  useEffect(() => {
    if (!templateLoaded || !fontsReady) return;
    drawCanvas();
  }, [data, templateLoaded, fontsReady, drawCanvas]);

  // --- Drag position name on canvas ---
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, origX: 0, origY: 0 });

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { cx: 0, cy: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      cx: (e.clientX - rect.left) * scaleX,
      cy: (e.clientY - rect.top) * scaleY,
    };
  };

  // Position name bounding box (in canvas coords)
  const getPosNameBounds = () => {
    const topLogoH = TOP_LOGO_END;
    const pFS = data.positionStyle.fontSize;
    const yStart = topLogoH;
    const yEnd = topLogoH + data.positionStyle.gap;
    return { x1: 0, y1: yStart, x2: TEMPLATE_W, y2: yEnd + pFS + 10 };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { cx, cy } = getCanvasCoords(e);
    const bounds = getPosNameBounds();
    if (cx >= bounds.x1 && cx <= bounds.x2 && cy >= bounds.y1 && cy <= bounds.y2) {
      draggingRef.current = true;
      dragStartRef.current = {
        mouseX: cx,
        mouseY: cy,
        origX: data.positionStyle.x,
        origY: data.positionStyle.y,
      };
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) {
      // Change cursor if hovering over position name area
      const { cx, cy } = getCanvasCoords(e);
      const bounds = getPosNameBounds();
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor =
          cx >= bounds.x1 && cx <= bounds.x2 && cy >= bounds.y1 && cy <= bounds.y2
            ? "grab"
            : "default";
      }
      return;
    }
    const { cx, cy } = getCanvasCoords(e);
    const dx = cx - dragStartRef.current.mouseX;
    const dy = cy - dragStartRef.current.mouseY;
    setData((prev) => ({
      ...prev,
      positionStyle: {
        ...prev.positionStyle,
        x: Math.max(0, Math.min(400, Math.round(dragStartRef.current.origX + dx))),
        y: Math.max(-10, Math.min(30, Math.round(dragStartRef.current.origY + dy))),
      },
    }));
  };

  const handleCanvasMouseUp = () => {
    draggingRef.current = false;
  };

  // --- Form handlers ---
  const updatePositionName = (value: string) => {
    setData((prev) => ({ ...prev, positionName: value }));
  };

  const updateSection = (
    index: number,
    field: "header" | "content",
    value: string
  ) => {
    setData((prev) => {
      const sections = [...prev.sections];
      sections[index] = { ...sections[index], [field]: value };
      return { ...prev, sections };
    });
  };

  const addSection = () => {
    setData((prev) => ({
      ...prev,
      sections: [...prev.sections, { header: "새 섹션", content: "" }],
    }));
  };

  const removeSection = (index: number) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    setData((prev) => {
      const sections = [...prev.sections];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= sections.length) return prev;
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...prev, sections };
    });
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = "job_description.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">채용공고 정보 입력</h2>
        <div className="space-y-4">
          {/* Position name */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <label className="block text-xs font-medium text-gray-500">
              포지션명 (헤더)
            </label>
            <input
              type="text"
              value={data.positionName}
              onChange={(e) => updatePositionName(e.target.value)}
              placeholder="포지션명을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: "글자 크기", key: "fontSize" as const, min: 12, max: 36 },
                { label: "공간 높이", key: "gap" as const, min: 0, max: 150 },
                { label: "X 위치", key: "x" as const, min: 0, max: 400 },
                { label: "Y 오프셋", key: "y" as const, min: -10, max: 30 },
              ]).map(({ label, key, min, max }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">
                    {label}: {data.positionStyle[key]}px
                  </label>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={data.positionStyle[key]}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        positionStyle: {
                          ...prev.positionStyle,
                          [key]: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full accent-gray-900"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic sections */}
          {data.sections.map((section, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">
                    섹션 {i + 1}
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveSection(i, "up")}
                      disabled={i === 0}
                      className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(i, "down")}
                      disabled={i === data.sections.length - 1}
                      className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSection(i)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  삭제
                </button>
              </div>
              <input
                type="text"
                value={section.header}
                onChange={(e) => updateSection(i, "header", e.target.value)}
                placeholder="섹션 제목"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <textarea
                value={section.content}
                onChange={(e) => updateSection(i, "content", e.target.value)}
                rows={4}
                placeholder="섹션 내용을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />
            </div>
          ))}

          {/* Add section button */}
          <button
            type="button"
            onClick={addSection}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            + 섹션 추가
          </button>
        </div>

        <button
          onClick={downloadImage}
          className="w-full mt-6 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
        >
          이미지 다운로드
        </button>
      </div>

      {/* Preview */}
      <div>
        <h2 className="text-lg font-semibold mb-2">미리보기</h2>
        <div className="overflow-y-auto max-h-[80vh] rounded-xl shadow-sm">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ display: templateLoaded && fontsReady ? "block" : "none" }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
          {(!templateLoaded || !fontsReady) && (
            <div className="flex items-center justify-center h-64 text-gray-400">
              템플릿 로딩 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
