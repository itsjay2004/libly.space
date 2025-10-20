// --- IMPORTANT: This file now contains a CLIENT and a SERVER helper ---
import { createClient as createClientComponent } from './client';
import { createClient as createServerComponent } from './server';
import { cookies } from 'next/headers';

// Define a TypeScript interface for the shape of our data
export interface DashboardStats {
  activeMembers: number;
  expiringSoonCount: number;
  occupiedSeats: number;
  monthlyRevenue: number;
  revenueChartData: { month: string; revenue: number }[];
  expiringSoonList: { id: string; name: string; phone: string; membership_expiry_date: string }[];
  paymentMethodStats: { payment_method: string; transaction_count: number; total_amount: number }[];
}


// --- SERVER-SIDE HELPER ---
// This version uses the server client and is meant for Server Components (like page.tsx)
export const fetchDashboardStatsSERVER = async (): Promise<DashboardStats | null> => {
  const cookieStore = cookies();
  const supabase = createServerComponent(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: libraryData, error: libraryError } = await supabase
    .from('libraries')
    .select('id')
    .eq('owner_id', user.id)
    .single();
  
  if (libraryError || !libraryData) {
    console.error("Could not find library for user:", user.id);
    return null;
  }
  
  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    library_id_param: libraryData.id,
  });

  if (error) {
    console.error('Error fetching dashboard stats from RPC (SERVER):', error);
    return null;
  }

  return data as DashboardStats;
};


// --- CLIENT-SIDE HELPER ---
// This version is for client components, should we need it later for caching.
export const fetchDashboardStatsCLIENT = async (
  libraryId: string
): Promise<DashboardStats | null> => {
  if (!libraryId) {
    console.error('Library ID is required to fetch dashboard stats.');
    return null;
  }
  const supabase = createClientComponent();
  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    library_id_param: libraryId,
  });

  if (error) {
    console.error('Error fetching dashboard stats from RPC (CLIENT):', error);
    return null;
  }

  return data as DashboardStats;
};
