import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { InfoTooltip } from './InfoTooltip';

interface ReportStatCardProps {
  title: string;
  tooltip?: string;
  value: string | number;
  subtext?: string;
  valueColor?: 'positive' | 'negative' | 'neutral';
  animationDelay?: number;
  className?: string;
}

export const ReportStatCard = ({
  title,
  tooltip,
  value,
  subtext,
  valueColor = 'neutral',
  animationDelay = 0,
  className,
}: ReportStatCardProps) => {
  const colorClass =
    valueColor === 'positive'
      ? 'text-[var(--profit-color)]'
      : valueColor === 'negative'
        ? 'text-[var(--loss-color)]'
        : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: animationDelay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Card
        className={cn(
          'group relative transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg h-full',
          className
        )}
      >
        {/* Gradient accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            {title}
            {tooltip && <InfoTooltip text={tooltip} />}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={cn('text-2xl font-bold tracking-tight', colorClass)}>
            {value}
          </div>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
