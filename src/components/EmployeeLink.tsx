import { Link } from "react-router-dom";

interface EmployeeLinkProps {
  employeeId?: number | null;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function EmployeeLink({ employeeId, children, className = "", title }: EmployeeLinkProps) {
  if (!employeeId) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link
      to={`/employees/${employeeId}`}
      className={`text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 hover:underline ${className}`}
      title={title || "Open employee details"}
    >
      {children}
    </Link>
  );
}

