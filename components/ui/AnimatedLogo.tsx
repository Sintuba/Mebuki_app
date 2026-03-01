"use client"

import { useEffect, useRef, useCallback } from "react"
import gsap from "gsap"

export interface AnimatedLogoProps {
  size?: number
  className?: string
  onAnimationComplete?: () => void
  autoPlay?: boolean
  brandName?: string
  brandColor?: string
}

export function AnimatedLogo({
  size = 80,
  className = "",
  onAnimationComplete,
  autoPlay = true,
  brandName = "MEBUKI",
  brandColor = "#22C55E",
}: AnimatedLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stemRef = useRef<SVGPathElement>(null)
  const leftLeafRef = useRef<SVGPathElement>(null)
  const leftVeinRef = useRef<SVGPathElement>(null)
  const rightLeafRef = useRef<SVGPathElement>(null)
  const rightVeinRef = useRef<SVGPathElement>(null)
  const groundRef = useRef<SVGPathElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  const animate = useCallback(() => {
    const tl = gsap.timeline({ onComplete: onAnimationComplete })

    // ロゴが「中央」に見えるよう、テキスト幅+gapの半分だけ右にオフセット
    const textWidth = textRef.current?.offsetWidth ?? 0
    const gap = 12 // gap-3 = 12px
    const centerOffset = (textWidth + gap) / 2

    gsap.set(
      [stemRef.current, leftLeafRef.current, leftVeinRef.current,
       rightLeafRef.current, rightVeinRef.current, groundRef.current],
      { strokeDasharray: 200, strokeDashoffset: 200, opacity: 1 }
    )
    // ロゴを中央位置（右にオフセット）かつ非表示でセット
    gsap.set(containerRef.current, { scale: 0, opacity: 0, x: centerOffset })
    // テキストは最初から非表示（レイアウト空間は確保）
    if (textRef.current) gsap.set(textRef.current, { opacity: 0 })

    // Phase 1: ロゴが中央でポップイン
    tl.to(containerRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
    // Phase 2: SVGパスを描画
      .to(groundRef.current, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out" }, "-=0.2")
      .to(stemRef.current, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, "-=0.1")
      .to(leftLeafRef.current, { strokeDashoffset: 0, duration: 0.4, ease: "back.out(1.5)" }, "-=0.2")
      .to(leftVeinRef.current, { strokeDashoffset: 0, duration: 0.2, ease: "power2.out" }, "-=0.1")
      .to(rightLeafRef.current, { strokeDashoffset: 0, duration: 0.4, ease: "back.out(1.5)" }, "-=0.3")
      .to(rightVeinRef.current, { strokeDashoffset: 0, duration: 0.2, ease: "power2.out" }, "-=0.1")
    // Phase 3: ロゴが左の最終位置へスライド
      .to(containerRef.current, { x: 0, duration: 0.5, ease: "power3.inOut" })
    // Phase 4: テキストがフェードイン（スライドに少し重ねる）
    if (textRef.current) {
      tl.to(textRef.current, { opacity: 1, duration: 0.4, ease: "power2.out" }, "-=0.25")
    }
    // Phase 5: 最後に小さくバウンス
    tl.to(containerRef.current, { scale: 1.05, duration: 0.15, ease: "power2.out" })
      .to(containerRef.current, { scale: 1, duration: 0.15, ease: "power2.in" })

    return tl
  }, [onAnimationComplete])

  useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(() => animate(), 100)
      return () => clearTimeout(timer)
    }
  }, [autoPlay, animate])

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        ref={containerRef}
        className="flex items-center justify-center rounded-[22%] shrink-0"
        style={{ width: size, height: size, backgroundColor: brandColor, opacity: 0 }}
      >
        <svg
          width={size * 0.65}
          height={size * 0.65}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path ref={stemRef} d="M 50 78 L 50 50" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0" />
          <path ref={leftLeafRef}
            d="M 50 50 L 50 45 C 50 36 47 29 42 24 Q 34 16 24 16 Q 20 16 20 20 Q 20 30 26 38 C 32 46 40 50 50 50"
            stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0"
          />
          <path ref={leftVeinRef} d="M 36 30 Q 40 36 46 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0" />
          <path ref={rightLeafRef}
            d="M 50 50 C 60 50 68 46 74 38 Q 80 30 80 20 Q 80 16 76 16 Q 66 16 58 24 C 53 29 50 36 50 45"
            stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0"
          />
          <path ref={rightVeinRef} d="M 64 30 Q 60 36 54 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0" />
          <path ref={groundRef}
            d="M 28 82 Q 36 88 50 88 Q 64 88 72 82"
            stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0"
          />
        </svg>
      </div>
      <span
        ref={textRef}
        className="font-bold tracking-tight"
        style={{ fontSize: size * 0.5, color: brandColor, opacity: 0 }}
      >
        {brandName}
      </span>
    </div>
  )
}
