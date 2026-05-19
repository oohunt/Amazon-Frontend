import { addToast, type ToastProps } from "@heroui/react";
/**
 * Success toast style
 */
const successToastStyles = {
    base: 'bg-green-500 rounded-lg shadow-md',
    title: 'text-white font-semibold',
    description: 'text-white opacity-90',
    content: 'flex items-center gap-2 py-2',
    icon: 'text-white h-5 w-5',
};

/**
 * Error hint styles
 */
const errorToastStyles = {
    base: 'bg-red-500 rounded-lg shadow-md',
    title: 'text-white font-semibold',
    description: 'text-white opacity-90',
    content: 'flex items-center gap-2 py-2',
    icon: 'text-white h-5 w-5',
};

/**
 * Warning toast style
 */
const warningToastStyles = {
    base: 'bg-yellow-500 rounded-lg shadow-md',
    title: 'text-white font-semibold',
    description: 'text-white opacity-90',
    content: 'flex items-center gap-2 py-2',
    icon: 'text-white h-5 w-5',
};

/**
 * Info toast style
 */
const infoToastStyles = {
    base: 'bg-blue-500 rounded-lg shadow-md',
    title: 'text-white font-semibold',
    description: 'text-white opacity-90',
    content: 'flex items-center gap-2 py-2',
    icon: 'text-white h-5 w-5',
};

/**
 * Default timeout setting
 */
const DEFAULT_TIMEOUT = {
    success: 5000,
    error: 8000,
    warning: 6000,
    info: 5000,
};

/**
 * Toast configuration type
 */
type ToastConfig = {
    title: string;
    description: string;
    timeout?: number;
    classNames?: Partial<ToastProps['classNames']>;
    [key: string]: unknown;
};

/**
 * Show success toast
 * @param config ToastConfigure
 */
export const showSuccessToast = (config: ToastConfig) => {
    addToast({
        timeout: DEFAULT_TIMEOUT.success,
        ...config,
        classNames: {
            ...successToastStyles,
            ...config.classNames,
        },
    });
};

/**
 * Show error toast
 * @param config ToastConfigure
 */
export const showErrorToast = (config: ToastConfig) => {
    addToast({
        timeout: DEFAULT_TIMEOUT.error,
        ...config,
        classNames: {
            ...errorToastStyles,
            ...config.classNames,
        },
    });
};

/**
 * Show warning toast
 * @param config ToastConfigure
 */
export const showWarningToast = (config: ToastConfig) => {
    addToast({
        timeout: DEFAULT_TIMEOUT.warning,
        ...config,
        classNames: {
            ...warningToastStyles,
            ...config.classNames,
        },
    });
};

/**
 * Show info toast
 * @param config ToastConfigure
 */
export const showInfoToast = (config: ToastConfig) => {
    addToast({
        timeout: DEFAULT_TIMEOUT.info,
        ...config,
        classNames: {
            ...infoToastStyles,
            ...config.classNames,
        },
    });
};

/**
 * Show toast based on type
 * @param config ToastConfigure
 * @param type Toast type
 */
export const showToast = (
    config: ToastConfig,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
) => {
    switch (type) {
        case 'success':
            showSuccessToast(config);
            break;
        case 'error':
            showErrorToast(config);
            break;
        case 'warning':
            showWarningToast(config);
            break;
        case 'info':
        default:
            showInfoToast(config);
            break;
    }
}; 