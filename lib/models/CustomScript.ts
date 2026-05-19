import type { ObjectId } from "mongodb";

/**
 * Custom script position enum
 */
export enum ScriptLocation {
    HEAD = 'head',           // Inside <head> tag
    BODY_START = 'body_start', // After <body> tag start
    BODY_END = 'body_end'     // Before </body> tag
}

/**
 * Custom script data model
 */
export interface CustomScript {
    _id?: ObjectId;
    name: string;            // Script name, for easy identification
    content: string;         // Script code content
    location: ScriptLocation; // Script position
    enabled: boolean;        // Whether enabled
    createdAt: Date;         // Created time
    updatedAt: Date;         // Update timestamp
}

/**
 * Custom script list response type
 */
export interface CustomScriptsResponse {
    items: CustomScript[];
    total: number;
}

/**
 * Request type for creating/updating custom scripts
 */
export interface CustomScriptRequest {
    _id?: string;            // Script ID, required when updating
    name: string;            // Script name
    content: string;         // Script content
    location: ScriptLocation; // Script position
    enabled: boolean;        // Whether enabled
} 