import type { Student, LibrarySettings, Payment, Shift } from './types';
import { differenceInMonths, startOfMonth } from 'date-fns';

export const shifts: Shift[] = [
  { id: 'shift-1', name: 'Morning Shift', startTime: '08:00', endTime: '14:00', capacity: 50, fee: 1500 },
  { id: 'shift-2', name: 'Evening Shift', startTime: '15:00', endTime: '21:00', capacity: 50, fee: 1500 },
  { id: 'shift-3', name: 'Night Shift', startTime: '22:00', endTime: '06:00', capacity: 25, fee: 2000 },
  { id: 'shift-4', name: 'Full Day', startTime: '08:00', endTime: '21:00', capacity: 125, fee: 2500 },
];

export const librarySettings: LibrarySettings = {
  totalSeats: 125,
  shifts: shifts,
};

export const rawStudents: Omit<Student, 'feeDetails'>[] = [
  {
    id: 'student-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '9876543210',
    status: 'active',
    seatNumber: 1,
    shiftId: 'shift-1',
    joinDate: '2023-01-15',
  },
  {
    id: 'student-2',
    name: 'Diya Patel',
    email: 'diya.patel@example.com',
    phone: '9876543211',
    status: 'active',
    seatNumber: 2,
    shiftId: 'shift-1',
    joinDate: '2024-05-01',
  },
  {
    id: 'student-3',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@example.com',
    phone: '9876543212',
    status: 'active',
    seatNumber: 10,
    shiftId: 'shift-2',
    joinDate: '2023-03-10',
  },
  {
    id: 'student-4',
    name: 'Priya Singh',
    email: 'priya.singh@example.com',
    phone: '9876543213',
    status: 'inactive',
    seatNumber: null,
    shiftId: null,
    joinDate: '2023-04-20',
  },
  {
    id: 'student-5',
    name: 'Advik Kumar',
    email: 'advik.kumar@example.com',
    phone: '9876543214',
    status: 'active',
    seatNumber: 15,
    shiftId: 'shift-3',
    joinDate: '2023-05-01',
  },
    {
    id: 'student-6',
    name: 'Isha Reddy',
    email: 'isha.reddy@example.com',
    phone: '9876543215',
    status: 'active',
    seatNumber: 3,
    shiftId: 'shift-1',
    joinDate: '2023-06-12',
  },
  {
    id: 'student-7',
    name: 'Kabir Das',
    email: 'kabir.das@example.com',
    phone: '9876543216',
    status: 'active',
    seatNumber: 12,
    shiftId: 'shift-2',
    joinDate: '2024-06-18',
  },
  {
    id: 'student-8',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    phone: '9876543217',
    status: 'active',
    seatNumber: 5,
    shiftId: 'shift-1',
    joinDate: '2023-08-01',
  },
];

export const payments: Payment[] = [
    { id: 'pay-1', studentId: 'student-1', amount: 1500, date: '2024-07-01', month: 'July', year: 2024 },
    { id: 'pay-2', studentId: 'student-2', amount: 1000, date: '2024-06-05', month: 'June', year: 2024 },
    { id: 'pay-3', studentId: 'student-3', amount: 1500, date: '2024-07-02', month: 'July', year: 2024 },
    { id: 'pay-4', studentId: 'student-5', amount: 2000, date: '2024-07-04', month: 'July', year: 2024 },
    { id: 'pay-5', studentId: 'student-6', amount: 1500, date: '2024-07-03', month: 'July', year: 2024 },
    { id: 'pay-6', studentId: 'student-1', amount: 1500, date: '2024-06-01', month: 'June', year: 2024 },
    { id: 'pay-7', studentId: 'student-3', amount: 1500, date: '2024-06-02', month: 'June', year: 2024 },
    { id: 'pay-8', studentId: 'student-5', amount: 2000, date: '2024-06-04', month: 'June', year: 2024 },
    { id: 'pay-9', studentId: 'student-6', amount: 1500, date: '2024-06-03', month: 'June', year: 2024 },
];

export const getStudentsWithCalculatedDues = (): Student[] => {
    const today = new Date();

    return rawStudents.map(student => {
        const studentPayments = payments.filter(p => p.studentId === student.id);
        const totalPaid = studentPayments.reduce((acc, p) => acc + p.amount, 0);

        if (student.status === 'inactive' || !student.shiftId) {
             const lastPayment = studentPayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            return {
                ...student,
                feeDetails: {
                    totalFee: totalPaid,
                    paid: totalPaid,
                    due: 0,
                    lastPaymentDate: lastPayment?.date || null,
                }
            };
        }

        const shift = shifts.find(s => s.id === student.shiftId);
        const monthlyFee = shift?.fee || 0;

        const joinDate = startOfMonth(new Date(student.joinDate));
        
        // Calculate months since joining, including the current month.
        const monthsSinceJoining = differenceInMonths(today, joinDate) + 1;
        
        const totalFee = monthsSinceJoining * monthlyFee;
        const due = totalFee - totalPaid;
        
        const lastPayment = studentPayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        return {
            ...student,
            feeDetails: {
                totalFee: totalFee,
                paid: totalPaid,
                due: due > 0 ? due : 0,
                lastPaymentDate: lastPayment?.date || null,
            }
        };
    });
};

export const students = getStudentsWithCalculatedDues();


export const getMonthlyCollection = () => {
    const monthlyData: { [key: string]: number } = {};
    const currentYear = new Date().getFullYear();
    const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const currentYearPayments = payments.filter(p => new Date(p.date).getFullYear() === currentYear);

    currentYearPayments.forEach(payment => {
        const paymentMonths = Array.isArray(payment.month) ? payment.month : [payment.month];
        const amountPerMonth = payment.amount / paymentMonths.length;

        paymentMonths.forEach(monthStr => {
            const monthName = monthStr.split(' ')[0];
             if (monthlyData[monthName]) {
                monthlyData[monthName] += amountPerMonth;
            } else {
                monthlyData[monthName] = amountPerMonth;
            }
        });
    });

    return monthOrder.map(month => ({
        month: month.substring(0, 3),
        total: monthlyData[month] || 0,
    }));
};