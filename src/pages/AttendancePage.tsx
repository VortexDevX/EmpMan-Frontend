import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "../lib/api";
import { useAuth } from "../contexts/useAuth";
import { getApiErrorMessage } from "../lib/errors";
import { FormAlert } from "../components/ui/FormLayout";

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AttendancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const isLeadership = user?.role === "admin" || user?.role === "manager";

  const { data: myAttendance = [] } = useQuery({
    queryKey: ["attendance", "me", user?.employee_id],
    queryFn: () => attendanceApi.getForEmployee(user!.employee_id).then((r) => r.data),
    enabled: !!user?.employee_id,
  });

  const { data: teamAttendance = [] } = useQuery({
    queryKey: ["attendance", "team"],
    queryFn: () => attendanceApi.getTeamForDate().then((r) => r.data),
    enabled: isLeadership,
  });

  const today = useMemo(() => localDateKey(new Date()), []);
  const todayRecord = myAttendance.find((record) => String(record.work_date).slice(0, 10) === today);

  const checkIn = useMutation({
    mutationFn: () => attendanceApi.checkIn(user!.employee_id, note),
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
  const checkOut = useMutation({
    mutationFn: () => attendanceApi.checkOut(user!.employee_id, note),
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white section-title">Attendance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Mark today attendance and monitor recent records.
        </p>
      </div>

      <div className="surface-card p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Today</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {todayRecord
            ? `Status: ${todayRecord.status} • Worked ${todayRecord.work_minutes ?? 0} mins`
            : "No record for today yet"}
        </p>
        {(checkIn.error || checkOut.error) && (
          <div className="mt-4">
            <FormAlert tone="error">
              {getApiErrorMessage(checkIn.error || checkOut.error, "Attendance could not be updated. Please try again.")}
            </FormAlert>
          </div>
        )}
        <div className="mt-4 flex flex-col sm:flex-row gap-3" aria-busy={checkIn.isPending || checkOut.isPending}>
          <label htmlFor="attendance-note" className="sr-only">Optional attendance note</label>
          <input
            id="attendance-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            className="input-shell flex-1"
          />
          <button
            type="button"
            onClick={() => checkIn.mutate()}
            disabled={checkIn.isPending || !!todayRecord?.check_in_at}
            className="btn-primary"
          >
            {checkIn.isPending ? "Checking in…" : "Check In"}
          </button>
          <button
            type="button"
            onClick={() => checkOut.mutate()}
            disabled={checkOut.isPending || !todayRecord?.check_in_at || !!todayRecord?.check_out_at}
            className="btn-secondary"
          >
            {checkOut.isPending ? "Checking out…" : "Check Out"}
          </button>
        </div>
      </div>

      <div className="surface-card p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Attendance</h2>
        <div className="mt-3 divide-y divide-slate-200/70 dark:divide-slate-700/60">
          {myAttendance.slice(0, 10).map((row) => (
            <div key={row.id} className="py-2.5 text-sm flex justify-between gap-3">
              <span className="text-slate-700 dark:text-slate-300">{String(row.work_date).slice(0, 10)}</span>
              <span className="text-slate-500 dark:text-slate-400">{row.status}</span>
            </div>
          ))}
          {myAttendance.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-2">No attendance records yet.</p>
          )}
        </div>
      </div>

      {isLeadership && (
        <div className="surface-card p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Team Snapshot (Today)</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {teamAttendance.map((row) => (
              <div key={row.id} className="glass-soft p-3">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Employee #{row.employee_id}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {row.status} • {row.work_minutes ?? 0} mins
                </p>
              </div>
            ))}
            {teamAttendance.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No team attendance records for today.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
