export interface Student {
  id: string;
  id_number?: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  seat_number: number | null;
  shift_id: string | null;
  join_date: string;
  library_id: string;
  shifts?: { name: string; start_time: string; end_time: string; fee: number } | null;
  payments?: { amount: number; status: 'paid' | 'due' }[];
}

export interface Shift {
  id: string;
  library_id?: string;
  name: string;
  start_time: string;
  end_time: string;
  fee: number;
}

export interface LibrarySettings {
  totalSeats: number;
  shifts: Shift[];
}

export interface Payment {
  id: string;
  student_id: string;
  library_id: string;
  amount: number;
  payment_date: string; 
  due_date: string;
  for_month: string; 
  status: 'paid' | 'due';
}
