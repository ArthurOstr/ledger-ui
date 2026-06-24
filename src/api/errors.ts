import axios from 'axios';

export interface ApiError {
    status?: number;
    message: string;
}

export const getApiError = (err: unknown): ApiError => {
    if (axios.isAxiosError(err)) {
        return {
            status: err.response?.status,
            message: err.response?.data?.detail ?? err.message,
        };
    }

    if (err instanceof Error) {
        return { message: err.message };
    }

    return { message: 'An unexpected error occurred while communicating with the vault.'}
}