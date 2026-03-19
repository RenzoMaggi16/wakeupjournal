import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value?: string | number | React.ReactNode;
  subValue?: string | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const StatCard = ({
  title,
  value,
  subValue,
  children,
  className,
  headerClassName,
  contentClassName,
}: StatCardProps) => {
  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
      className
    )}>
      {/* Subtle gradient accent line at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      
      <CardHeader className={cn("pb-2", headerClassName)}>
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-1", contentClassName)}>
        {value && <div className="text-2xl font-bold tracking-tight">{value}</div>}
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
};
