
import { LayoutDashboard, Users, Settings, Armchair, CreditCard } from 'lucide-react';

export const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard />, title: "Dashboard", description: "An overview of your library's status." },
    { href: "/dashboard/students", label: "Students", icon: <Users />, title: "Student Management", description: "Add, view, and manage student profiles." },
    { href: "/dashboard/seats", label: "Seats", icon: <Armchair />, title: "Seat Management", description: "Visually manage seat assignments for each shift." },
    { href: "/dashboard/payments", label: "Payments", icon: <CreditCard />, title: "Payment Management", description: "Record new payments and view transaction history." },
    { href: "/dashboard/library", label: "Library", icon: <Settings />, title: "Library Settings", description: "Configure your library's capacity and shifts." },
    { href: "/dashboard/account", label: "Account", icon: <Users />, title: "Account Settings", description: "Manage your account details." },
];
