export type Environment = 'dev' | 'prod';

export const getEnvPrefix = (env: Environment = 'dev') => env === 'prod' ? 'prod' : 'dev';

export const getUserAliasesPath = (userId: string, env: Environment = 'dev') => {
    return `${getEnvPrefix(env)}_users/${userId}/aliases`;
};

// Example: settings doc
export const getUserSettingsDocPath = (userId: string, env: Environment = 'dev') => {
    return `${getEnvPrefix(env)}_users/${userId}/settings`;
};
