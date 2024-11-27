export interface  Session {
    isSessionExpired: boolean;
    setSessionExpired: (expired: boolean) => void;
    token?: string;
    setToken?: (token: string) => void;
};