import { toast } from 'react-hot-toast';

// Success toast
export const showSuccess = (message: string) => {
    toast.success(message, {
        duration: 3000,
        position: 'top-right',
        style: {
            background: '#10b981',
            color: '#fff',
            borderRadius: '0.5rem',
            padding: '1rem',
        },
    });
};

// Error toast
export const showError = (message: string) => {
    toast.error(message, {
        duration: 4000,
        position: 'top-right',
        style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '0.5rem',
            padding: '1rem',
        },
    });
};

// Info toast
export const showInfo = (message: string) => {
    toast(message, {
        duration: 3000,
        position: 'top-right',
        icon: 'ℹ️',
        style: {
            background: '#3b82f6',
            color: '#fff',
            borderRadius: '0.5rem',
            padding: '1rem',
        },
    });
};
