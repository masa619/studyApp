import React from "react";
import { Button } from '@/components/ui/button';

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    children: React.ReactNode;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white p-6 rounded-lg shadow-xl">
                {children}
                <div className="flex justify-end gap-4 mt-4">
                    <Button onClick={onClose} variant="outline">
                        キャンセル
                    </Button>
                    <Button onClick={onConfirm} variant="destructive">
                        確認
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Modal;