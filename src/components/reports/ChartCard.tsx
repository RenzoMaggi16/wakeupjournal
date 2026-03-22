import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { InfoTooltip } from './InfoTooltip';
import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  tooltip?: string;
  children: ReactNode;
  className?: string;
  animationDelay?: number;
  height?: string;
}

export const ChartCard = ({
  title,
  tooltip,
  children,
  className,
  animationDelay = 0,
  height = 'h-[300px]',
}: ChartCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        delay: animationDelay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Card className={cn('relative overflow-hidden', className)}>
        {/* Gradient accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            {title}
            {tooltip && <InfoTooltip text={tooltip} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={height}>{children}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
