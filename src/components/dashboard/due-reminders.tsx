import { students } from "@/lib/data"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

export default function DueReminders() {
  const studentsWithDues = students
    .filter((student) => student.feeDetails.due > 0)
    .sort((a, b) => b.feeDetails.due - a.feeDetails.due)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Due Reminders</CardTitle>
        <CardDescription>Students with the highest outstanding dues.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {studentsWithDues.length > 0 ? (
            studentsWithDues.map((student) => (
            <div key={student.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                 <AvatarImage src={`https://picsum.photos/seed/${student.phone}/40/40`} alt={student.name} />
                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
              <div className="ml-auto font-medium">₹{student.feeDetails.due.toLocaleString()}</div>
            </div>
            ))
        ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No outstanding dues. Great work!</p>
        )}
      </CardContent>
    </Card>
  )
}
