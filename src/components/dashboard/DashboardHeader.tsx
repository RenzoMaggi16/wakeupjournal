import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Percent } from "lucide-react";
import type { CalendarDisplayMode } from "@/components/Dashboard";
import { DateRangeFilter } from "@/components/shared/DateRangeFilter";
import type { DateRange } from "react-day-picker";

interface DashboardHeaderProps {
    selectedAccountId: string | null;
    onAccountChange: (accountId: string) => void;
    accounts: { id: string; account_name: string; account_type: string }[];
    dateRange: DateRange | undefined;
    setDateRange: (range: DateRange | undefined) => void;
    displayMode: CalendarDisplayMode;
    setDisplayMode: (mode: CalendarDisplayMode) => void;
}

export const DashboardHeader = ({ selectedAccountId, onAccountChange, accounts, dateRange, setDateRange, displayMode, setDisplayMode }: DashboardHeaderProps) => {
    const [userName, setUserName] = useState<string>("Trader");

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.first_name) {
                setUserName(user.user_metadata.first_name);
            }
        };
        getUser();
    }, []);

    return (
        <div className="flex flex-col gap-3 mb-1">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    Bienvenido <span className="text-gradient">{userName}</span>
                </h1>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
                <Select
                    value={selectedAccountId || ""}
                    onValueChange={onAccountChange}
                >
                    <SelectTrigger className="w-full sm:w-[180px] bg-card border-border/50">
                        <SelectValue placeholder="Seleccionar Cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">🌐 Ver todo</SelectItem>
                        {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                                {acc.account_type === 'live' ? '🏦 ' : '🧪 '}
                                {acc.account_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Display Mode Toggle */}
                <Select value={displayMode} onValueChange={(val) => setDisplayMode(val as CalendarDisplayMode)}>
                    <SelectTrigger className="w-full sm:w-[140px] bg-card border-border/50">
                        <SelectValue placeholder="Modo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="dollars">
                            <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Dólares</span>
                        </SelectItem>
                        <SelectItem value="percentage">
                            <span className="flex items-center gap-2"><Percent className="h-4 w-4" /> Porcentaje</span>
                        </SelectItem>
                    </SelectContent>
                </Select>

                {/* Date Range Filter (reusable component) */}
                <DateRangeFilter
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    className="col-span-2 sm:col-span-1"
                />
            </div>
        </div>
    );
};
