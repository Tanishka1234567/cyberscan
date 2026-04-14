import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface User {
    otp?: string;
    username: string;
    password: string;
    otpTimestamp?: Time;
    email: string;
}
export interface AiAnalysisResult {
    explanation: string;
    verdict: string;
    available: boolean;
    confidence: number;
    riskLevel: string;
}
export type RegistrationResult = {
    __kind__: "invalidEmailFormat";
    invalidEmailFormat: null;
} | {
    __kind__: "invalidUsernameLength";
    invalidUsernameLength: null;
} | {
    __kind__: "duplicateEmail";
    duplicateEmail: null;
} | {
    __kind__: "duplicateUsername";
    duplicateUsername: null;
} | {
    __kind__: "success";
    success: string;
} | {
    __kind__: "invalidPasswordLength";
    invalidPasswordLength: null;
};
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ResultSummary {
    threatsFound: Array<string>;
    recordType: string;
    verdict: string;
    resolverName: string;
    recordValue: string;
    riskScore: bigint;
}
export interface ScanHistoryEntry {
    aiAnalysis?: AiAnalysisResult;
    scanType: ScanType;
    summary: ResultSummary;
    target: string;
    timestamp: Time;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type PasswordResetResult = {
    __kind__: "userNotFound";
    userNotFound: null;
} | {
    __kind__: "invalidOtp";
    invalidOtp: null;
} | {
    __kind__: "success";
    success: string;
} | {
    __kind__: "otpExpired";
    otpExpired: null;
};
export type LoginResult = {
    __kind__: "userNotFound";
    userNotFound: null;
} | {
    __kind__: "wrongPassword";
    wrongPassword: null;
} | {
    __kind__: "success";
    success: string;
};
export type OtpGenerationResult = {
    __kind__: "userNotFound";
    userNotFound: null;
} | {
    __kind__: "internalError";
    internalError: null;
} | {
    __kind__: "success";
    success: string;
};
export enum ScanType {
    ip = "ip",
    dns = "dns",
    url = "url"
}
export interface backendInterface {
    allUsers(): Promise<Array<User>>;
    analyzeWithAI(target: string, scanType: string): Promise<AiAnalysisResult>;
    authenticateRequest(): Promise<void>;
    authenticateUser(email: string, password: string): Promise<LoginResult>;
    createUser(email: string, username: string, password: string): Promise<RegistrationResult>;
    getHistoryEntryByTarget(target: string): Promise<ScanHistoryEntry>;
    getScanHistory(): Promise<Array<ScanHistoryEntry>>;
    getUsernameByEmail(email: string): Promise<string>;
    lookupDns(domain: string): Promise<string>;
    ping(): Promise<string>;
    requestPasswordReset(email: string): Promise<OtpGenerationResult>;
    scanIp(ip: string): Promise<string>;
    scanPhishing(url: string): Promise<string>;
    scanUrl(url: string): Promise<string>;
    setAbuseIpDbApiKey(newKey: string): Promise<void>;
    setAiApiKey(apiKey: string): Promise<boolean>;
    setSafeBrowsingApiKey(newKey: string): Promise<void>;
    setVirusTotalApiKey(newKey: string): Promise<void>;
    setWhoisApiKey(newKey: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    verifyOtpAndResetPassword(email: string, otp: string, newPassword: string): Promise<PasswordResetResult>;
}
