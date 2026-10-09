import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="8" fill="#1e3a5f" />
        <path
          d="M21.6 10.8a7.15 7.15 0 1 0 .15 10.35"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="3.15"
          strokeLinecap="round"
        />
        <rect x="20.15" y="14.15" width="5.1" height="3.7" rx="1.05" fill="#f8fafc" />
      </svg>
    ),
    size,
  );
}
