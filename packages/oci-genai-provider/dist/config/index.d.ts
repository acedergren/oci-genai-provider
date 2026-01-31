interface OCIProfile {
    name: string;
    region: string;
    user: string;
    tenancy: string;
    fingerprint: string;
    keyFile: string;
    keyFileValid: boolean;
}
interface OCIConfigResult {
    found: boolean;
    path: string;
    profiles: OCIProfile[];
    error?: string;
}
interface OCICompartment {
    id: string;
    name: string;
    description?: string;
    lifecycleState: string;
}
interface ValidationResult {
    valid: boolean;
    userName?: string;
    userEmail?: string;
    error?: string;
}

declare function expandPath(filePath: string): string;
declare function getConfigPath(): string;
declare function hasOCIConfig(): boolean;
declare function parseOCIConfig(configPath?: string): OCIConfigResult;
declare function getProfile(profileName?: string): OCIProfile | undefined;

declare function validateCredentials(profileName?: string, timeoutMs?: number): Promise<ValidationResult>;

declare function discoverCompartments(profileName?: string, includeRoot?: boolean): Promise<OCICompartment[]>;

declare const OCI_REGIONS: readonly [{
    readonly id: "eu-frankfurt-1";
    readonly name: "Germany Central (Frankfurt)";
}, {
    readonly id: "eu-stockholm-1";
    readonly name: "Sweden Central (Stockholm)";
}, {
    readonly id: "us-ashburn-1";
    readonly name: "US East (Ashburn)";
}, {
    readonly id: "us-chicago-1";
    readonly name: "US Midwest (Chicago)";
}, {
    readonly id: "us-phoenix-1";
    readonly name: "US West (Phoenix)";
}, {
    readonly id: "uk-london-1";
    readonly name: "UK South (London)";
}, {
    readonly id: "ap-tokyo-1";
    readonly name: "Japan East (Tokyo)";
}, {
    readonly id: "ap-osaka-1";
    readonly name: "Japan Central (Osaka)";
}, {
    readonly id: "ap-mumbai-1";
    readonly name: "India West (Mumbai)";
}, {
    readonly id: "ap-sydney-1";
    readonly name: "Australia East (Sydney)";
}, {
    readonly id: "ap-melbourne-1";
    readonly name: "Australia Southeast (Melbourne)";
}, {
    readonly id: "ca-toronto-1";
    readonly name: "Canada Southeast (Toronto)";
}, {
    readonly id: "ca-montreal-1";
    readonly name: "Canada Northeast (Montreal)";
}, {
    readonly id: "sa-saopaulo-1";
    readonly name: "Brazil East (São Paulo)";
}, {
    readonly id: "me-dubai-1";
    readonly name: "UAE East (Dubai)";
}, {
    readonly id: "me-jeddah-1";
    readonly name: "Saudi Arabia West (Jeddah)";
}];
type OCIRegionId = (typeof OCI_REGIONS)[number]['id'];
interface ManualSetupInfo {
    user: string;
    fingerprint: string;
    keyFilePath: string;
    tenancy: string;
    region: OCIRegionId | string;
    profileName: string;
}
declare function ensureOCIDirectory(): string;
declare function generateConfigContent(info: ManualSetupInfo): string;
declare function writeOCIConfig(info: ManualSetupInfo, append?: boolean): void;
declare function profileFromEnvironment(): OCIProfile | undefined;
declare function getSetupInstructions(): string;
declare const OCID_TYPES: readonly ["user", "compartment", "tenancy", "instance", "group", "policy", "vcn", "subnet"];
type OCIDType = (typeof OCID_TYPES)[number];
declare function isValidOCID(ocid: string, type?: OCIDType): boolean;
declare function getRegionName(regionId: string): string;

export { type ManualSetupInfo, type OCICompartment, type OCIConfigResult, type OCIProfile, type OCIRegionId, OCI_REGIONS, type ValidationResult, discoverCompartments, ensureOCIDirectory, expandPath, generateConfigContent, getConfigPath, getProfile, getRegionName, getSetupInstructions, hasOCIConfig, isValidOCID, parseOCIConfig, profileFromEnvironment, validateCredentials, writeOCIConfig };
