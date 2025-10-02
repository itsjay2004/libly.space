import type { Student, LibrarySettings, Payment } from './types';

export const shifts = [
  { id: 'shift-1', name: 'Morning Shift', startTime: '08:00 AM', endTime: '02:00 PM', capacity: 50 },
  { id: 'shift-2', name: 'Evening Shift', startTime: '03:00 PM', endTime: '09:00 PM', capacity: 50 },
  { id: 'shift-3', name: 'Night Shift', startTime: '10:00 PM', endTime: '06:00 AM', capacity: 25 },
];

export const librarySettings: LibrarySettings = {
  totalSeats: 125,
  shifts: shifts,
};

export const students: Student[] = [
  {
    id: 'student-1',
    name: 'Aarav Sharma',
    studentId: 'LS-001',
    email: 'aarav.sharma@example.com',
    phone: '9876543210',
    status: 'active',
    seatNumber: 1,
    shiftId: 'shift-1',
    joinDate: '2023-01-15',
    feeDetails: { totalFee: 1500, paid: 1500, due: 0, lastPaymentDate: '2024-07-01' },
  },
  {
    id: 'student-2',
    name: 'Diya Patel',
    studentId: 'LS-002',
    email: 'diya.patel@example.com',
    phone: '9876543211',
    status: 'active',
    seatNumber: 2,
    shiftId: 'shift-1',
    joinDate: '2023-02-01',
    feeDetails: { totalFee: 1500, paid: 1000, due: 500, lastPaymentDate: '2024-06-05' },
  },
  {
    id: 'student-3',
    name: 'Rohan Gupta',
    studentId: 'LS-003',
    email: 'rohan.gupta@example.com',
    phone: '9876543212',
    status: 'active',
    seatNumber: 10,
    shiftId: 'shift-2',
    joinDate: '2023-03-10',
    feeDetails: { totalFee: 1500, paid: 1500, due: 0, lastPaymentDate: '2024-07-02' },
  },
  {
    id: 'student-4',
    name: 'Priya Singh',
    studentId: 'LS-004',
    email: 'priya.singh@example.com',
    phone: '9876543213',
    status: 'inactive',
    seatNumber: null,
    shiftId: null,
    joinDate: '2023-04-20',
    feeDetails: { totalFee: 1500, paid: 0, due: 1500, lastPaymentDate: null },
  },
  {
    id: 'student-5',
    name: 'Advik Kumar',
    studentId: 'LS-005',
    email: 'advik.kumar@example.com',
    phone: '9876543214',
    status: 'active',
    seatNumber: 15,
    shiftId: 'shift-3',
    joinDate: '2023-05-01',
    feeDetails: { totalFee: 2000, paid: 2000, due: 0, lastPaymentDate: '2024-07-04' },
  },
    {
    id: 'student-6',
    name: 'Isha Reddy',
    studentId: 'LS-006',
    email: 'isha.reddy@example.com',
    phone: '9876543215',
    status: 'active',
    seatNumber: 3,
    shiftId: 'shift-1',
    joinDate: '2023-06-12',
    feeDetails: { totalFee: 1500, paid: 1500, due: 0, lastPaymentDate: '2024-07-03' },
  },
  {
    id: 'student-7',
    name: 'Kabir Das',
    studentId: 'LS-007',
    email: 'kabir.das@example.com',
    phone: '9876543216',
    status: 'active',
    seatNumber: 12,
    shiftId: 'shift-2',
    joinDate: '2023-07-18',
    feeDetails: { totalFee: 1500, paid: 0, due: 1500, lastPaymentDate: '2024-06-10' },
  },
];

export const payments: Payment[] = [
    { id: 'pay-1', studentId: 'student-1', amount: 1500, date: '2024-07-01', month: 'July' },
    { id: 'pay-2', studentId: 'student-2', amount: 1000, date: '2024-06-05', month: 'June' },
    { id: 'pay-3', studentId: 'student-3', amount: 1500, date: '2024-07-02', month: 'July' },
    { id: 'pay-4', studentId: 'student-5', amount: 2000, date: '2024-07-04', month: 'July' },
    { id: 'pay-5', studentId: 'student-6', amount: 1500, date: '2024-07-03', month: 'July' },
    { id: 'pay-6', studentId: 'student-1', amount: 1500, date: '2024-06-01', month: 'June' },
    { id: 'pay-7', studentId: 'student-3', amount: 1500, date: '2024-06-02', month: 'June' },
    { id: 'pay-8', studentId: 'student-5', amount: 2000, date: '2024-06-04', month: 'June' },
    { id: 'pay-9', studentId: 'student-6', amount: 1500, date: '2024-06-03', month: 'June' },
];

export const getMonthlyCollection = () => {
    const monthlyData: { [key: string]: number } = {};
    payments.forEach(payment => {
        if (monthlyData[payment.month]) {
            monthlyData[payment.month] += payment.amount;
        } else {
            monthlyData[payment.month] = payment.amount;
        }
    });

    const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    return monthOrder.map(month => ({
        month,
        total: monthlyData[month] || 0,
    })).filter(d => d.total > 0);
};
