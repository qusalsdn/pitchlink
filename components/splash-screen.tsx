"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 스플래시 스크린 컴포넌트
 * - 최초 접속 시 2.5초간 표시
 * - 로고 애니메이션과 함께 페이드 아웃
 * - localStorage로 최초 접속 여부 확인
 * - framer-motion으로 구현
 */

interface SplashScreenProps {
  children: React.ReactNode;
}

export function SplashScreen({ children }: SplashScreenProps) {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("pitchlink-visited");

    // requestAnimationFrame으로 setState를 비동기적으로 실행
    requestAnimationFrame(() => {
      const isFirst = !hasVisited;
      setIsFirstVisit(isFirst);

      if (isFirst) {
        sessionStorage.setItem("pitchlink-visited", "true");
        // 2.5초 후 스플래시 닫기
        setTimeout(() => {
          setIsFirstVisit(false);
        }, 2500);
      }
    });
  }, []);

  // 로딩 중일 때는 아무것도 표시하지 않음 (hydration mismatch 방지)
  if (isFirstVisit === null) {
    return null;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isFirstVisit && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100"
          >
            {/* 로고 컨테이너 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col items-center gap-6"
            >
              {/* 축구 공 아이콘 */}
              <div className="relative">
                <motion.div
                  animate={{
                    y: [0, -12, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center"
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-green-600"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M12 2C12 2 14 6 14 12C14 18 12 22 12 22" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 2C12 2 10 6 10 12C10 18 12 22 12 22" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2 12C2 12 6 10 12 10C18 10 22 12 22 12" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2 12C2 12 6 14 12 14C18 14 22 12 22 12" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                </motion.div>

                {/* 빛나는 효과 */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-green-400 rounded-full blur-xl -z-10"
                />
              </div>

              {/* 브랜드 텍스트 */}
              <div className="text-center">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl font-bold text-gray-900 tracking-tight"
                >
                  PitchLink
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-sm text-gray-500 mt-1"
                >
                  축구팀 관리의 새로운 기준
                </motion.p>
              </div>
            </motion.div>

            {/* 로딩 인디케이터 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute bottom-16 flex flex-col items-center gap-3"
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                    className="w-2 h-2 bg-green-600 rounded-full"
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">로딩 중...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인 콘텐츠 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isFirstVisit ? 0 : 1 }}
        transition={{ duration: 0.3, delay: isFirstVisit ? 2.5 : 0 }}
      >
        {children}
      </motion.div>
    </>
  );
}
