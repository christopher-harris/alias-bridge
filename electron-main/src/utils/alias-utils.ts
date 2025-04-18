import dayjs from 'dayjs';
import {Alias} from "../types";

/**
 * Returns the latest timestamp from an array of aliases.
 */
export function getLatestTimestamp(aliases: Alias[]): number {
    return aliases.reduce((max, alias) => {
        const ts = alias.lastUpdated
            ? dayjs(alias.lastUpdated).valueOf()
            : 0;
        return Math.max(max, ts);
    }, 0);
}

/**
 * Determines if the local alias data is newer than the cloud data.
 */
export function isLocalNewer(localAliases: Alias[], cloudAliases: Alias[]): boolean {
    const localTs = getLatestTimestamp(localAliases);
    const cloudTs = getLatestTimestamp(cloudAliases);
    return localTs > cloudTs;
}
