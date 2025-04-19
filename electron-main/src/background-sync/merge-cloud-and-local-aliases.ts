import {Alias, AliasData, DeletedAlias} from "../types";
import {saveAliasData} from "../data-store";
import {regenerateAliasShellFile} from "../shell-generator";


export async function mergeCloudAndLocalAliases(
    cloudData: AliasData,
    localData: AliasData
): Promise<AliasData> {
    const allAliasIds = new Set([
        ...Object.keys(cloudData.aliases),
        ...Object.keys(localData.aliases),
        ...Object.keys(cloudData.deleted),
        ...Object.keys(localData.deleted),
    ]);

    const mergedAliases: Record<string, Alias> = {};
    const mergedDeleted: Record<string, DeletedAlias> = {};

    for (const id of allAliasIds) {
        const cloudAlias = cloudData.aliases[id];
        const localAlias = localData.aliases[id];

        const deletedAtCloud = cloudData.deleted[id]?.deletedAt;
        const deletedAtLocal = localData.deleted[id]?.deletedAt;

        const deletedAt = [deletedAtCloud, deletedAtLocal]
            .filter(Boolean)
            .sort()
            .reverse()[0]; // most recent deletion timestamp

        const latestAlias = [cloudAlias, localAlias]
            .filter(Boolean)
            .sort((a, b) => {
                const aDate = a?.lastUpdated ?? '';
                const bDate = b?.lastUpdated ?? '';
                return bDate.localeCompare(aDate);
            })[0];

        // If deletedAt is after the latest alias update, treat it as deleted
        if (deletedAt && latestAlias && deletedAt > latestAlias?.lastUpdated!) {
            mergedDeleted[id] = { id, deletedAt };
            continue;
        }

        // Otherwise, preserve the latest alias
        if (latestAlias) {
            mergedAliases[id] = latestAlias;
        }
    }

    const mergedData: AliasData = {
        aliases: mergedAliases,
        deleted: mergedDeleted,
        updatedAt: Date.now(),
        updatedBy: localData.updatedBy ?? cloudData.updatedBy ?? 'unknown',
    };

    await saveAliasData(mergedData);
    await regenerateAliasShellFile(mergedData);

    return mergedData;
}




// import {Alias, DeletedAlias} from "../types";
// import {saveAliasData} from "../data-store";
// import {regenerateAliasShellFile} from "../shell-generator";
//
// export async function mergeCloudAndLocalAliases(
//     cloudAliases: Alias[],
//     cloudDeleted: Record<string, DeletedAlias>,
//     localAliases: Alias[],
//     localDeleted: Record<string, DeletedAlias>
// ): Promise<Alias[]> {
//     const allAliasIds = new Set([
//         ...cloudAliases.map(a => a.id),
//         ...localAliases.map(a => a.id),
//         ...Object.keys(cloudDeleted),
//         ...Object.keys(localDeleted)
//     ]);
//
//     const result: Alias[] = [];
//
//     for (const id of allAliasIds) {
//         const cloudAlias = cloudAliases.find(a => a.id === id);
//         const localAlias = localAliases.find(a => a.id === id);
//         const deletedAtCloud = cloudDeleted[id]?.deletedAt;
//         const deletedAtLocal = localDeleted[id]?.deletedAt;
//
//         const deletedAt = [deletedAtCloud, deletedAtLocal]
//             .filter(Boolean)
//             .sort()
//             .reverse()[0]; // Most recent deletion
//
//         const latestAlias = [cloudAlias, localAlias]
//             .filter(Boolean)
//             .sort((a, b) => {
//                 const aDate = a?.lastUpdated ?? '';
//                 const bDate = b?.lastUpdated ?? '';
//                 return bDate.localeCompare(aDate);
//             })[0];
//
//         // If alias was deleted AFTER the latest update, skip it
//         if (deletedAt && latestAlias && deletedAt > latestAlias?.lastUpdated!) {
//             continue;
//         }
//
//         // Otherwise, add the latest version of alias
//         if (latestAlias) {
//             result.push(latestAlias);
//         }
//     }
//
//     // Save merged results locally
//     await saveAliasData(result);
//     await regenerateAliasShellFile(result);
//
//     return result;
// }
