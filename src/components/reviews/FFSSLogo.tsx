import { CircleDot } from "lucide-react";

interface FFSSLogoProps {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: {
    icon: "w-8 h-8",
    title: "text-sm",
    subtitle: "text-[10px]",
  },
  md: {
    icon: "w-12 h-12",
    title: "text-lg",
    subtitle: "text-xs",
  },
  lg: {
    icon: "w-16 h-16",
    title: "text-2xl",
    subtitle: "text-sm",
  },
};

export function FFSSLogo({ size = "md" }: FFSSLogoProps) {
  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
        <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-full p-3 shadow-lg">
          <CircleDot className={`${classes.icon} text-primary-foreground`} />
        </div>
      </div>
      <div className="text-center">
        <h1 className={`${classes.title} font-bold text-foreground tracking-tight`}>
          FFSS
        </h1>
        <p className={`${classes.subtitle} text-muted-foreground font-medium`}>
          Federasi Futsal Sulawesi Selatan
        </p>
      </div>
    </div>
  );
}
