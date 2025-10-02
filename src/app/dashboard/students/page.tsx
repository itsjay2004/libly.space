import { students } from '@/lib/data';
import { columns } from '@/components/students/columns';
import { DataTable } from '@/components/students/data-table';

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="bg-card p-4 rounded-lg border">
        <DataTable columns={columns} data={students} />
      </div>
    </div>
  );
}
