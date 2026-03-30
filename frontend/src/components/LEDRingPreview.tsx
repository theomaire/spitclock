import type { ReactElement } from "react";
import type { Color, PreviewFrame } from "../types";

interface Props {
  frame: PreviewFrame | null;
  clockLedCount?: number;
  illumLedCount?: number;
  illumSkipFirst?: number;
}

function colorToHex(c: Color): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function colorBrightness(c: Color): number {
  return (c[0] + c[1] + c[2]) / 3;
}

function glowFilter(c: Color, id: string): ReactElement {
  const brightness = colorBrightness(c);
  if (brightness < 5) return <></>;
  const stdDev = 3 + (brightness / 255) * 8;
  return (
    <filter id={id} x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur in="SourceGraphic" stdDeviation={stdDev} />
    </filter>
  );
}

export default function LEDRingPreview({
  frame,
  clockLedCount = 36,
  illumLedCount = 16,
  illumSkipFirst = 1,
}: Props) {
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 170;
  const innerR = 105;
  const ledRadius = 8;
  const innerLedRadius = 6;

  const ringColors: Color[] = frame?.ring ?? Array(clockLedCount).fill([0, 0, 0]);
  const illumColors: Color[] = frame?.illum ?? Array(illumLedCount).fill([0, 0, 0]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ background: "#111", borderRadius: 16 }}
    >
      <defs>
        {ringColors.map((c, i) => glowFilter(c, `rg${i}`))}
        {illumColors.map((c, i) => glowFilter(c, `ig${i}`))}
      </defs>

      {/* Clock face guides */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#222" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#1a1a1a" strokeWidth={1} />

      {/* 12/3/6/9 markers */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg - 90) * (Math.PI / 180);
        const x = cx + Math.cos(rad) * (outerR + 18);
        const y = cy + Math.sin(rad) * (outerR + 18);
        const label = { 0: "12", 90: "3", 180: "6", 270: "9" }[deg];
        return (
          <text
            key={deg}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#444"
            fontSize={11}
            fontFamily="monospace"
          >
            {label}
          </text>
        );
      })}

      {/* Outer ring — clock LEDs (facing inward) */}
      {ringColors.map((color, i) => {
        const angle = (i / clockLedCount) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * outerR;
        const y = cy + Math.sin(angle) * outerR;
        const bright = colorBrightness(color);
        return (
          <g key={`r${i}`}>
            {bright > 5 && (
              <circle
                cx={x}
                cy={y}
                r={ledRadius + 4}
                fill={colorToHex(color)}
                opacity={0.3}
                filter={`url(#rg${i})`}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={ledRadius}
              fill={bright > 2 ? colorToHex(color) : "#1a1a1a"}
              stroke="#333"
              strokeWidth={0.5}
            />
          </g>
        );
      })}

      {/* Inner ring — illumination strip LEDs (facing outward) */}
      {illumColors.map((color, i) => {
        if (i < illumSkipFirst) return null;
        const activeCount = illumLedCount - illumSkipFirst;
        const idx = i - illumSkipFirst;
        const angle = (idx / activeCount) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * innerR;
        const y = cy + Math.sin(angle) * innerR;
        const bright = colorBrightness(color);
        return (
          <g key={`i${i}`}>
            {bright > 5 && (
              <circle
                cx={x}
                cy={y}
                r={innerLedRadius + 3}
                fill={colorToHex(color)}
                opacity={0.35}
                filter={`url(#ig${i})`}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={innerLedRadius}
              fill={bright > 2 ? colorToHex(color) : "#1a1a1a"}
              stroke="#333"
              strokeWidth={0.5}
            />
          </g>
        );
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="#333" />

      {/* Labels */}
      <text x={cx} y={size - 8} textAnchor="middle" fill="#555" fontSize={10} fontFamily="monospace">
        outer: {clockLedCount} LEDs (clock) &middot; inner: {illumLedCount - illumSkipFirst} LEDs (illum)
      </text>
    </svg>
  );
}
