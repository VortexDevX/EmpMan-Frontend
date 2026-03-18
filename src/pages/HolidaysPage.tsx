// src/pages/HolidaysPage.tsx
import { useQuery } from "@tanstack/react-query";
import { holidaysApi } from "../lib/api";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";

export function HolidaysPage() {
  const { data: holidays, isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: () => holidaysApi.list().then((r) => r.data),
  });

  if (isLoading) return <PageLoader />;

  const upcomingHolidays = holidays?.filter(
    (h: any) => new Date(h.date) >= new Date()
  ) || [];

  const pastHolidays = holidays?.filter(
    (h: any) => new Date(h.date) < new Date()
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white section-title">Holidays</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          View upcoming and past company holidays
        </p>
      </div>

      {/* Upcoming Holidays */}
      <Card padding="none" className="glass-panel">
        <CardHeader className="p-6 border-b border-slate-200 dark:border-slate-700">
          <CardTitle>Upcoming Holidays</CardTitle>
          <Badge variant="info">{upcomingHolidays.length}</Badge>
        </CardHeader>
        
        {upcomingHolidays.length === 0 ? (
          <EmptyState
            icon="event_busy"
            title="No upcoming holidays"
            description="There are no scheduled holidays coming up."
          />
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {upcomingHolidays.map((holiday: any) => (
              <div key={holiday.id} className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex flex-col items-center justify-center">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {new Date(holiday.date).toLocaleDateString("en", { month: "short" })}
                  </span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {new Date(holiday.date).getDate()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 dark:text-white">{holiday.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(holiday.date).toLocaleDateString("en", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge>{holiday.holiday_type}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Past Holidays */}
      {pastHolidays.length > 0 && (
        <Card padding="none" className="glass-panel">
          <CardHeader className="p-6 border-b border-slate-200 dark:border-slate-700">
            <CardTitle>Past Holidays</CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-200 dark:divide-slate-700 opacity-60">
            {pastHolidays.slice(0, 5).map((holiday: any) => (
              <div key={holiday.id} className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center">
                  <span className="text-xs font-medium text-slate-500">
                    {new Date(holiday.date).toLocaleDateString("en", { month: "short" })}
                  </span>
                  <span className="text-lg font-bold text-slate-600 dark:text-slate-300">
                    {new Date(holiday.date).getDate()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">{holiday.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
