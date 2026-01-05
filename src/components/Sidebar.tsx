'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    LayoutDashboard,
    Receipt,
    Scale,
    FileSpreadsheet,
    LogOut,
    Menu,
    Wallet,
    Camera,
    Loader2,
    Settings,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & stats' },
    { href: '/dashboard/expenses', label: 'Expenses', icon: Receipt, description: 'Track spending' },
    { href: '/dashboard/dues', label: 'Dues', icon: Scale, description: 'Person balances' },
    { href: '/dashboard/import-export', label: 'Import/Export', icon: FileSpreadsheet, description: 'Data management' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, updateProfileImage } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState(user?.profileImage || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const handleUpdateProfileImage = async () => {
        if (!imageUrl.trim()) return;

        setIsUpdating(true);
        try {
            await updateProfileImage(imageUrl);
            setIsProfileOpen(false);
        } catch (error) {
            console.error('Failed to update profile image:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] flex items-center justify-center shadow-lg shadow-[#D25353]/30">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold gradient-text">
                            ExpenseTracker
                        </h1>
                        <p className="text-xs text-muted-foreground">Manage finances</p>
                    </div>
                </div>
            </div>

            <Separator className="opacity-50" />

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
                <TooltipProvider delayDuration={0}>
                    <nav className="space-y-1.5">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={item.href}
                                            onClick={onNavigate}
                                            className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                                                ? 'bg-gradient-to-r from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] text-white shadow-lg shadow-[#D25353]/25'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                                            <span className="font-medium">{item.label}</span>
                                            {isActive && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            )}
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="hidden lg:block">
                                        <p>{item.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}

                        {/* Admin Settings Link */}
                        {user?.role === 'admin' && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="/dashboard/settings"
                                        onClick={onNavigate}
                                        className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${pathname === '/dashboard/settings'
                                            ? 'bg-gradient-to-r from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] text-white shadow-lg shadow-[#D25353]/25'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                            }`}
                                    >
                                        <Settings className={`w-5 h-5 transition-transform duration-300 ${pathname === '/dashboard/settings' ? '' : 'group-hover:scale-110'}`} />
                                        <span className="font-medium">Settings</span>
                                        {pathname === '/dashboard/settings' && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="hidden lg:block">
                                    <p>System settings</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </nav>
                </TooltipProvider>
            </ScrollArea>

            <Separator className="opacity-50" />

            {/* User section */}
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                    <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                        <DialogTrigger asChild>
                            <button className="relative group">
                                <Avatar className="h-11 w-11 border-2 border-[#EA7B7B]/30 cursor-pointer transition-transform hover:scale-105">
                                    {user?.profileImage ? (
                                        <AvatarImage src={user.profileImage} alt={user.name} />
                                    ) : null}
                                    <AvatarFallback className="bg-gradient-to-br from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] text-white font-bold">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Camera className="w-4 h-4 text-white" />
                                </div>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Update Profile Picture</DialogTitle>
                                <DialogDescription>
                                    Enter an image URL for your profile picture
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="flex justify-center">
                                    <Avatar className="h-24 w-24 border-4 border-[#EA7B7B]/30">
                                        {imageUrl ? (
                                            <AvatarImage src={imageUrl} alt="Preview" />
                                        ) : null}
                                        <AvatarFallback className="bg-gradient-to-br from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] text-white font-bold text-2xl">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">Image URL</Label>
                                    <Input
                                        id="imageUrl"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                                <Button
                                    onClick={handleUpdateProfileImage}
                                    disabled={isUpdating || !imageUrl.trim()}
                                    className="w-full bg-gradient-to-r from-[#9E3B3B] via-[#D25353] to-[#EA7B7B]"
                                >
                                    {isUpdating ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    {isUpdating ? 'Updating...' : 'Update Picture'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate text-sm">
                            {user?.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <ThemeToggle />
                </div>

                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-11"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </Button>
            </div>
        </div>
    );
}

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile: Sheet */}
            <div className="lg:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="fixed top-4 left-4 z-50 bg-card/80 backdrop-blur-sm border-border/50 shadow-lg rounded-xl"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 border-r-border/50">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Navigation Menu</SheetTitle>
                        </SheetHeader>
                        <SidebarContent onNavigate={() => setIsOpen(false)} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop: Static Sidebar */}
            <aside className="hidden lg:block w-72 bg-card/95 backdrop-blur-xl border-r border-border/50 h-screen sticky top-0">
                <SidebarContent />
            </aside>
        </>
    );
}
