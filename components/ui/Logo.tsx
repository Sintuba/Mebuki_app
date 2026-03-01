"use client"

interface LogoProps {
  size?: number
  className?: string
  variant?: "default" | "icon" | "wordmark"
  showBackground?: boolean
  brandName?: string
  brandColor?: string
}

export default function Logo({
  size = 40,
  className = "",
  variant = "default",
  showBackground = false,
  brandName = "MEBUKI",
  brandColor = "#22C55E",
}: LogoProps) {
  const sproutSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M 50 75 L 50 45
           C 50 38 48 32 44 28
           Q 38 22 30 22
           Q 28 22 28 24
           Q 28 32 32 38
           C 36 44 42 48 50 48"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 38 32 Q 41 37 46 42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M 50 48
           C 58 48 64 44 68 38
           Q 72 32 72 24
           Q 72 22 70 22
           Q 62 22 56 28
           C 52 32 50 38 50 45"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 62 32 Q 59 37 54 42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M 32 78 Q 38 82 50 82 Q 62 82 68 78"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )

  const iconSvg = (
    <svg
      width={size * 0.65}
      height={size * 0.65}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-white"
    >
      <path
        d="M 50 78 L 50 45
           C 50 36 47 29 42 24
           Q 34 16 24 16
           Q 20 16 20 20
           Q 20 30 26 38
           C 32 46 40 50 50 50"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 36 30 Q 40 36 46 42"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M 50 50
           C 60 50 68 46 74 38
           Q 80 30 80 20
           Q 80 16 76 16
           Q 66 16 58 24
           C 53 29 50 36 50 45"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 64 30 Q 60 36 54 42"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M 28 82 Q 36 88 50 88 Q 64 88 72 82"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )

  if (variant === "icon" || showBackground) {
    return (
      <div
        className="flex items-center justify-center rounded-[22%]"
        style={{ width: size, height: size, backgroundColor: brandColor }}
      >
        {iconSvg}
      </div>
    )
  }

  if (variant === "wordmark") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className="flex items-center justify-center rounded-[22%] shrink-0"
          style={{ width: size, height: size, backgroundColor: brandColor }}
        >
          {iconSvg}
        </div>
        <span
          className="font-bold tracking-tight"
          style={{ fontSize: size * 0.6, color: brandColor }}
        >
          {brandName}
        </span>
      </div>
    )
  }

  return sproutSvg
}
