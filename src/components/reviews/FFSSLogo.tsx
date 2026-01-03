import ffiLogo from "@/assets/ffi-logo.png";

interface FFSSLogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}

const sizeClasses = {
  sm: "w-20",
  md: "w-32",
  lg: "w-40",
};

export function FFSSLogo({ size = "md", showSubtitle = true }: FFSSLogoProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={ffiLogo}
        alt="Federasi Futsal Indonesia"
        className={`${sizeClasses[size]} h-auto object-contain`}
      />
      {showSubtitle && (
        <p className="text-sm font-medium text-muted-foreground tracking-wide">
          Sulawesi Selatan
        </p>
      )}
    </div>
  );
}
