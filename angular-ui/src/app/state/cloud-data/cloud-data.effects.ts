import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {CloudDataActions} from './cloud-data.actions';
import {AuthService} from '../../services/auth.service';
import {LocalAliasesActions} from '../local-aliases/local-aliases.actions';
import {localAliasesFeature} from '../local-aliases/local-aliases.reducer';
import {Store} from '@ngrx/store';
import {AliasService} from '../../services/alias.service';
import {CloudSyncService} from '../cloud-sync.service';
import {FirebaseService} from '../../services/firebase.service';
import {
    catchError,
    combineLatest,
    exhaustMap,
    filter,
    map,
    of,
    switchMap, take,
    withLatestFrom
} from 'rxjs';
import {cloudDataFeature} from './cloud-data.reducer';
import {localSettingsFeature, selectLocalSettings} from '../local-settings/local-settings.reducer';
import {LocalSettingsActions} from '../local-settings/local-settings.actions';
import {Alias} from '../../electron';
import dayjs from 'dayjs';

function getLatestTimestamp(aliases: Alias[]): number {
    return aliases.reduce((max, alias) => {
        const ts = dayjs(alias.lastUpdated);
        return ts.isValid() ? Math.max(max, ts.valueOf()) : max;
    }, 0);
}


@Injectable()
export class CloudDataEffects {
    authService = inject(AuthService);
    private store = inject(Store);
    private aliasService = inject(AliasService);
    private actions$ = inject(Actions);
    private cloudSyncService = inject(CloudSyncService);
    firebaseService = inject(FirebaseService);

    loginWithGithub$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(CloudDataActions.loginUser),
            exhaustMap(() => this.authService.signInWithGitHub())
        );
    }, {dispatch: false});

    updateCloudDataOnAliasChange$ = createEffect(() =>
        this.actions$.pipe(
            ofType(LocalAliasesActions.addLocalAlias, LocalAliasesActions.localAliasDeleted, LocalAliasesActions.updateLocalAlias),
            withLatestFrom(this.store.select(cloudDataFeature.selectAppUser)),
            filter(([_, user]) => !!user?.uid),
            switchMap(() => this.store.select(localAliasesFeature.selectAll).pipe(take(1))),
            map((aliases) => CloudDataActions.updateAliases({data: aliases}))
        )
    );

    updateCloudDataOnSettingsChange$ = createEffect(() =>
        this.actions$.pipe(
            ofType(LocalSettingsActions.updateAppearance, LocalSettingsActions.updateTheme),
            withLatestFrom(this.store.select(cloudDataFeature.selectAppUser)),
            filter(([_, user]) => !!user?.uid),
            switchMap(() =>
                combineLatest([
                    this.store.select(localSettingsFeature.selectCurrentAppearance).pipe(take(1)),
                    this.store.select(localSettingsFeature.selectCurrentTheme).pipe(take(1)),
                ])
            ),
            map(([appearance, theme]) =>
                CloudDataActions.updateSettings({data: {appearance, theme}})
            )
        )
    );

    loadAndSyncCloudData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(CloudDataActions.userLoggedInSuccess),
            switchMap(({data: user}) =>
                this.cloudSyncService.getUserCloudData(user.uid).pipe(
                    withLatestFrom(
                        this.store.select(localAliasesFeature.selectAll),
                        this.store.select(selectLocalSettings)
                    ),
                    filter(([cloudData]) => !!cloudData),
                    switchMap(([cloudData, localAliases, localSettings]) => {
                        console.log('cloudData: ', cloudData);
                        console.log('localAliases: ', localAliases);
                        console.log('localSettings: ', localSettings);

                        const cloudEmpty = cloudData!.aliases.length === 0;
                        const localEmpty = localAliases.length === 0;

                        // Case 1: Both are empty → new user
                        if (cloudEmpty && localEmpty) {
                            console.log('Case 1: Both local and cloud are empty');
                            // return [
                            //   CloudDataActions.userCloudDataLoaded({ data: cloudData! })
                            // ];
                        }

                        // Case 2: Cloud has data, local is empty → sync from cloud
                        if (!cloudEmpty && localEmpty) {
                            console.log('Case 2: Cloud has data, local is empty → sync from cloud');
                            // return [
                            //   LocalAliasesActions.addLocalAliases({ aliases: cloudData!.aliases }),
                            //   LocalSettingsActions.updateAppearance({ appearance: cloudData!.settings.appearance }),
                            //   LocalSettingsActions.updateTheme({ theme: cloudData!.settings.theme }),
                            //   CloudDataActions.userCloudDataLoaded({ data: cloudData! })
                            // ];
                        }

                        // Case 3: Local has data, cloud is empty → push local to cloud
                        if (cloudEmpty && !localEmpty) {
                            console.log('Case 3: Local has data, cloud is empty → push local to cloud');
                            // const mergedCloudData = {
                            //   uid: user.uid,
                            //   aliases: localAliases,
                            //   settings: localSettings
                            // };
                            // return [
                            //   CloudDataActions.userCloudDataLoaded({ data: mergedCloudData }),
                            //   CloudDataActions.updateAliases({ data: localAliases }),
                            //   CloudDataActions.updateSettings({ data: localSettings })
                            // ];
                        }

                        // Case 4: Both have data → compare timestamps
                        console.log('Case 4: Both have data → compare timestamps');
                        const latestCloud = getLatestTimestamp(cloudData!.aliases);
                        const latestLocal = getLatestTimestamp(localAliases);
                        console.log(latestCloud);
                        console.log(latestLocal);

                        if (latestCloud >= latestLocal) {
                            console.log('latestCloud >= latestLocal');
                            return [
                                LocalAliasesActions.addLocalAliases({aliases: cloudData!.aliases}),
                                LocalSettingsActions.updateAppearance({appearance: cloudData!.settings.appearance}),
                                LocalSettingsActions.updateTheme({theme: cloudData!.settings.theme}),
                                CloudDataActions.userCloudDataLoaded({data: cloudData!})
                            ];
                        } else {
                            console.log('latestCloud <= latestLocal');
                            const mergedCloudData = {
                                uid: user.uid,
                                aliases: localAliases,
                                settings: localSettings
                            };
                            return [
                                CloudDataActions.userCloudDataLoaded({data: mergedCloudData}),
                                CloudDataActions.updateAliases({data: localAliases}),
                                CloudDataActions.updateSettings({data: localSettings})
                            ];
                        }
                    }),
                    catchError(error =>
                        of(CloudDataActions.userCloudDataFetchFailed({error}))
                    )
                )
            )
        )
    );


    // loadAndSyncCloudData$ = createEffect(() =>
    //   this.actions$.pipe(
    //     ofType(CloudDataActions.userLoggedInSuccess),
    //     switchMap(({ data: user }) =>
    //       this.cloudSyncService.getUserCloudData(user.uid).pipe(
    //         withLatestFrom(
    //           this.store.select(localAliasesFeature.selectAll),
    //           this.store.select(selectLocalSettings)
    //         ),
    //         filter(([cloudData]) => !!cloudData),
    //         switchMap(([cloudData, localAliases, localSettings]) => {
    //           const latestCloud = getLatestTimestamp(cloudData!.aliases);
    //           const latestLocal = getLatestTimestamp(localAliases);
    //
    //           if (latestCloud >= latestLocal) {
    //             // Cloud wins → hydrate local store
    //             return [
    //               LocalAliasesActions.addLocalAliases({ aliases: cloudData!.aliases }),
    //               LocalSettingsActions.updateAppearance({ appearance: cloudData!.settings.appearance }),
    //               LocalSettingsActions.updateTheme({ theme: cloudData!.settings.theme }),
    //               CloudDataActions.userCloudDataLoaded({ data: cloudData! })
    //             ];
    //           } else {
    //             // Local wins → push to Firestore
    //             return [
    //               CloudDataActions.userCloudDataLoaded({ data: {
    //                 uid: user.uid,
    //                   aliases: localAliases,
    //                   settings: localSettings
    //                 }}),
    //               CloudDataActions.updateAliases({ data: localAliases }),
    //               CloudDataActions.updateSettings({ data: localSettings })
    //             ];
    //           }
    //         }),
    //         catchError(error =>
    //           of(CloudDataActions.userCloudDataFetchFailed({ error }))
    //         )
    //       )
    //     )
    //   )
    // );


    // loadCloudData$ = createEffect(() =>
    //   this.actions$.pipe(
    //     ofType(CloudDataActions.userLoggedInSuccess),
    //     switchMap(({ data }) =>
    //       this.cloudSyncService.getUserCloudData(data.uid).pipe(
    //         map((cloudData) => {
    //           if (cloudData) {
    //             return CloudDataActions.userCloudDataLoaded({ data: cloudData });
    //           } else {
    //             return CloudDataActions.userCloudDataFetchFailed({ error: 'No cloud data found.' });
    //           }
    //         }),
    //         catchError((error) =>
    //           of(CloudDataActions.userCloudDataFetchFailed({ error }))
    //         )
    //       )
    //     )
    //   )
    // );


    // loadCloudDataOnStartup$ = createEffect(() =>
    //   this.actions$.pipe(
    //     ofType(CloudDataActions.userLoggedInSuccess),
    //     switchMap(() =>
    //       combineLatest([
    //         this.store.select(localAliasesFeature.selectAll).pipe(take(1)),
    //         this.store.select(localSettingsFeature.selectCurrentAppearance).pipe(take(1)),
    //         this.store.select(localSettingsFeature.selectCurrentTheme).pipe(take(1)),
    //       ])
    //     ),
    //     switchMap(([aliases, appearance, theme]) => [
    //       CloudDataActions.updateAliases({ data: aliases }),
    //       CloudDataActions.updateSettings({ data: { appearance, theme } })
    //     ])
    //   )
    // );

    syncCloudDataToFirestore$ = createEffect(() =>
        this.actions$.pipe(
            ofType(
                CloudDataActions.updateAliases,
                CloudDataActions.updateSettings
            ),
            switchMap(action =>
                combineLatest([
                    this.store.select(cloudDataFeature.selectAppUser),
                    this.store.select(cloudDataFeature.selectAll),
                    this.store.select(cloudDataFeature.selectSettings)
                ]).pipe(
                    take(1), // only get one emission then complete
                    filter(([user]) => !!user?.uid),
                    switchMap(([user, aliases, settings]) =>
                        this.cloudSyncService.saveUserCloudData(user!.uid, {
                            aliases,
                            settings
                        }).pipe(
                            map(() => CloudDataActions.saveCloudAliasesSuccess({data: aliases})),
                            catchError(error =>
                                of(CloudDataActions.saveCloudAliasesFailure({error}))
                            )
                        )
                    )
                )
            )
        )
    );


    // syncCloudDataToFirestore$ = createEffect(() =>
    //   this.actions$.pipe(
    //     ofType(
    //       CloudDataActions.updateAliases,
    //       CloudDataActions.updateSettings
    //     ),
    //     withLatestFrom(
    //       this.store.select(cloudDataFeature.selectAppUser),
    //       this.store.select(cloudDataFeature.selectAll),
    //       this.store.select(cloudDataFeature.selectSettings)
    //     ),
    //     filter(([_, user]) => !!user?.uid),
    //     switchMap(([_, user, aliases, settings]) =>
    //       this.cloudSyncService.saveUserCloudData(user!.uid, {
    //         aliases,
    //         settings
    //       }).pipe(
    //         map(() => CloudDataActions.saveCloudAliasesSuccess({ data: aliases })),
    //         catchError(error =>
    //           of(CloudDataActions.saveCloudAliasesFailure({ error }))
    //         )
    //       )
    //     )
    //   )
    // );


}
