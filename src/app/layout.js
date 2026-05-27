import localFont from "next/font/local";
import "./globals.css";
import "../styles/animations.css";

const pretendard = localFont({
  src: "../resources/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata = {
  title: "메뉴 배치 테스트",
  description: "사용자 테스트 화면에서 메뉴 구조를 직접 배치해보는 도구",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f5f6fb] text-[#1e293b]">{children}</body>
    </html>
  );
}
