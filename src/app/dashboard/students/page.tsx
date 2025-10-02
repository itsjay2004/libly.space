import { students } from '@/lib/data';
import { columns } from '@/components/students/columns';
import { DataTable } from '@/components/students/data-table';
import StudentActions from '@/components/students/student-actions';

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
        <p className="text-muted-foreground">Add, view, and manage student profiles.</p>
      </div>
      <div className="bg-card p-4 rounded-lg border">
        <DataTable columns={columns} data={students} />
      </div>
    </div>
  );
}
