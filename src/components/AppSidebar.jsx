"use client"

import { usePathname } from "next/navigation";
import { Sidebar, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { PhilippinePeso, ShoppingBasket, UsersRound } from "lucide-react";
import { useAuth } from "./AuthProvider";

const employeeDashboard = [
    { 
        title: 'Procurement', 
        icon: ShoppingBasket,
        href: '/procurement',
    },
    {
        title: 'Sales and Customer Support',
        icon: PhilippinePeso,
        href: '/sales'
    },
    {
        title: 'Human Resource',
        icon: UsersRound,
        href: '/'
    }
]

export function AppSidebar() {
    const { open } = useSidebar();
    const pathName = usePathname();
    const { user } = useAuth();

    let route = employeeDashboard;
    
    return (
        <Sidebar
            collapsible="icon"
        >
            <SidebarTrigger 
                className="rounded-full shadow-6xl bg-white absolute z-50 right-[-28px] top-[47%] -translate-x-1/2 -translate-y-1/2"
            />
            <SidebarContent 
                className={`rounded-md bg-cover border-r-green-100 border-0`}
                style={{ backgroundImage: "url(/images/sidebar_bg.svg)" }}
            >
                <Link 
                    className="text-center aspect-auto"
                    href="/"
                >
                    <Image
                        src="/svg/logo1.svg"
                        alt="Papiverse Logo"
                        width={open ? 50 : 30}
                        height={open ? 50 : 30}
                        className="mx-auto mt-4"
                    />
                    <div className="text-orange-900 font-extrabold">{ "HR EMPLOYEE" }</div>
                </Link>
                <SidebarMenu className={`mt-4 ${!open && "flex-center"}`}>
                    {route?.map((item, i) => (
                        <Link 
                            href={ item.href } 
                            className={`group/collapsible w-full hover:bg-slate-50 rounded-md ${!open && 'flex-center'}`} 
                            key={ i }
                        >
                            <SidebarMenuItem>
                                <SidebarMenuButton className="flex gap-2 pl-4">
                                    <item.icon className="w-4 h-4" />
                                    { item.title }
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </Link>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            {user && (
                <SidebarFooter className="p-4 border-t border-sidebar-border">
                    <div className={`flex flex-col ${!open ? 'items-center' : ''}`}>
                        <div className={`text-sm font-semibold text-sidebar-foreground ${!open ? 'truncate max-w-full' : ''}`}>
                            {open ? user.fullName : user.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        {open && (
                            <div className="text-xs text-sidebar-foreground/70 mt-1">
                                {user.position}
                            </div>
                        )}
                    </div>
                </SidebarFooter>
            )}
        </Sidebar>
    )
}