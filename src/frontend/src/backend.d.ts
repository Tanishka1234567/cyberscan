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
export interface ScanHistoryEntry {
    scanType: ScanType;
    summary: ResultSummary;
    target: string;
    timestamp: Time;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ResultSummary {
    threatsFound: Array<string>;
    recordType: string;
    verdict: string;
    resolverName: string;
    recordValue: string;
    riskScore: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum ScanType {
    dns = "dns",
    url = "url"
}
export interface backendInterface {
    getHistoryEntryByTarget(target: string): Promise<ScanHistoryEntry>;
    getScanHistory(): Promise<Array<ScanHistoryEntry>>;
    lookupDns(domain: string): Promise<string>;
    ping(): Promise<string>;
    scanUrl(url: string): Promise<string>;
    setSafeBrowsingApiKey(newKey: string): Promise<void>;
    setVirusTotalApiKey(newKey: string): Promise<void>;
    setWhoisApiKey(newKey: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
