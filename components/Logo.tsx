interface LogoProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function Logo({
  title = "PitchLink",
  subtitle = "우리 축구팀 관리 플랫폼",
  className = "",
}: LogoProps) {
  return (
    <div className={`text-center ${className}`}>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
