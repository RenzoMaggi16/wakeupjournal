import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatGridProps {
  title?: string;
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

const gridColsMap = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export const StatGrid = ({ title, children, columns = 4 }: StatGridProps) => {
  return (
    <section className="space-y-3">
      {title && (
        <motion.h2
          className="text-lg font-semibold text-foreground"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {title}
        </motion.h2>
      )}
      <div className={`grid gap-4 ${gridColsMap[columns]}`}>
        {children}
      </div>
    </section>
  );
};
