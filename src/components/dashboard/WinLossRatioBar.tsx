import { cn } from "@/lib/utils";

interface WinLossRatioBarProps {
    winValue: number;
    lossValue: number;
    beValue?: number;
    label: string;
    className?: string;
}

export const WinLossRatioBar = ({
    winValue,
    lossValue,
    beValue = 0,
    label,
    className
}: WinLossRatioBarProps) => {
    const total = winValue + lossValue + beValue;
    // Evitar división por cero
    const winPercentage = total > 0 ? (winValue / total) * 100 : 50;
    const lossPercentage = total > 0 ? (lossValue / total) * 100 : 50;
    const bePercentage = total > 0 ? (beValue / total) * 100 : 0;

    return (
        <div className={cn("w-full space-y-2", className)}>
            <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{winValue.toFixed(2)}</span>
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="font-medium">{lossValue.toFixed(2)}</span>
            </div>

            <div className="h-3 w-full flex rounded-full overflow-hidden bg-secondary">
                <div
                    className="bg-profit h-full transition-all duration-500 ease-in-out"
                    style={{ width: `${winPercentage}%` }}
                />
                {bePercentage > 0 && (
                    <div
                        className="bg-muted-foreground/40 h-full transition-all duration-500 ease-in-out"
                        style={{ width: `${bePercentage}%` }}
                    />
                )}
                <div
                    className="bg-loss h-full transition-all duration-500 ease-in-out"
                    style={{ width: `${lossPercentage}%` }}
                />
            </div>

            {bePercentage > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/40" />
                    BE: {beValue.toFixed(2)}
                </div>
            )}
        </div>
    );
};
