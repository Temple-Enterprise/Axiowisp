import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
    fileName: string;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ fileName, onSave, onDiscard, onCancel }) => {
    return (
        <div className="confirm-dialog__overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-dialog__icon">
                    <AlertTriangle size={24} />
                </div>
                <div className="confirm-dialog__body">
                    <p className="confirm-dialog__title">Unsaved Changes</p>
                    <p className="confirm-dialog__desc">
                        <strong>{fileName}</strong> has unsaved changes. Do you want to save before closing?
                    </p>
                </div>
                <div className="confirm-dialog__actions">
                    <button className="confirm-dialog__btn confirm-dialog__btn--save" onClick={onSave}>
                        Save
                    </button>
                    <button className="confirm-dialog__btn confirm-dialog__btn--discard" onClick={onDiscard}>
                        Don't Save
                    </button>
                    <button className="confirm-dialog__btn confirm-dialog__btn--cancel" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
