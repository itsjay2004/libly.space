"use client";

import StudentActions from "./student-actions";

export default function ClientStudentActions({ student }: { student: any }) {
  return <StudentActions student={student} onActionComplete={() => window.location.reload()} />;
}
