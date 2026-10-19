import axios from 'axios';

export interface ApiError {
    status?: number;
    message: string;
}

interface ValidationDetail {
    msg?: unknown;
}

const extractDetailMessage = (detail: unknown): string | null => {
    if (typeof detail === 'string') {
        return detail;
    }

    if (Array.isArray(detail)) {
        const messages = detail
            .map((item): string | null => {
                if (typeof item === 'string') return item;
                if (item !== null && typeof item === 'object' && typeof (item as ValidationDetail).msg === 'string') {
                    return (item as ValidationDetail).msg as string;
                }
                return null;
            })
            .filter((msg): msg is string => msg !== null);

        if (messages.length > 0) {
            return messages.join(', ');
        }
    }

    return null;
};

export const getApiError = (err: unknown): ApiError => {
    if (axios.isAxiosError(err)) {
        const detailMessage = extractDetailMessage(err.response?.data?.detail);

        return {
            status: err.response?.status,
            message: detailMessage ?? err.message,
        };
    }

    if (err instanceof Error) {
        return { message: err.message };
    }

    return { message: 'An unexpected error occurred while communicating with the vault.' };
};
