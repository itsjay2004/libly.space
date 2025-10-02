export interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  seatNumber: number | null;
  shiftId: string | null;
  joinDate: string;
  feeDetails: {
    totalFee: number;
    paid: number;
    due: number;
    lastPaymentDate: string | null;
  };
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

export interface LibrarySettings {
  totalSeats: number;
  shifts: Shift[];
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  month: string;
}
