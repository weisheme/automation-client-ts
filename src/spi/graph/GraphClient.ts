/**
 * Client for GraphQL operations. Provided to all handlers.
 */
export interface GraphClient {

    /**
     * GraphQL endpoint
     */
    endpoint: string;

    /**
     * Run query either provided as a string or as loaded from a file
     * @param {QueryOptions<Q> | string} optionsOrName
     * @returns {Promise<T>}
     */
    query<T, Q>(optionsOrName: QueryOptions<Q> | string): Promise<T>;

    /**
     * Run mutation either provided as a string or as loaded from a file
     * @param {MutationOptions<Q> | string} optionsOrName
     * @returns {Promise<T>}
     */
    mutate<T, Q>(optionsOrName: MutationOptions<Q> | string): Promise<T>;

    /**
     * Run GraphQL query based on the provided file name and variables
     * @param {string} path the relative path from module root to the graphql file
     * @param {Q} variables the variables to be used
     * @param {any} options to be passed onto the underlying implementation
     * @param {string} current the path to the calling script
     * @returns {Promise<T>}
     *
     * DEPRECATED: use query() instead
     */
    executeQueryFromFile<T, Q>(path: string, variables?: Q, options?: any, current?: string): Promise<T>;

    /**
     * Run GraphQL query based on the provide query and variables
     * @param {string} query the graphql mutation as string
     * @param {Q} variables the variables to be used
     * @param {any} options to be passed onto the underlying implementation
     * @returns {Promise<T>}
     *
     * DEPRECATED: use query() instead
     */
    executeQuery<T, Q>(query: string, variables?: Q, options?: any): Promise<T>;

    /**
     * Run GraphQL mutation based on the provided file name and variables
     * @param {string} path the relative path from module root to the graphql file
     * @param {Q} variables the variables to be used
     * @param {any} options to be passed onto the underlying implementation
     * @param {string} current the path to the calling script
     * @returns {Promise<T>}
     *
     * DEPRECATED: use mutate() instead
     */
    executeMutationFromFile<T, Q>(path: string, variables?: Q, options?: any, current?: string): Promise<T>;

    /**
     * Run GraphQL mutation based on the provided mutation name and variables
     * @param {string} mutation the graphql mutation as string
     * @param {Q} variables the variables to be used
     * @param {any} options to be passed onto the underlying implementation
     * @returns {Promise<T>}
     *
     * DEPRECATED: use mutate() instead
     */
    executeMutation<T, Q>(mutation: string, variables?: Q, options?: any): Promise<any>;
}

export interface QueryOptions<Q> {
    query?: string;
    path?: string;
    name?: string;
    fragmentDir?: string;
    variables?: Q;
    options?: any;
}

export interface MutationOptions<Q> {
    mutation?: string;
    path?: string;
    name?: string;
    variables?: Q;
    options?: any;
}

export const QueryNoCacheOptions = { fetchPolicy: "network-only" };
export const MutationNoCacheOptions = { fetchPolicy: "no-cache" };
