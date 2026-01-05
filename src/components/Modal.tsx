'use client';

import { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 sm:px-6 py-4 border-b border-border/50 bg-muted/30">
                    <DialogTitle className="text-lg sm:text-xl font-semibold">
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-80px)]">
                    <div className="px-4 sm:px-6 py-4 overflow-x-hidden">
                        {children}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

