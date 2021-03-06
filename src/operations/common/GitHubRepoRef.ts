import axios from "axios";
import {
    ActionResult,
    successOn,
} from "../../action/ActionResult";
import { logger } from "../../internal/util/logger";
import { Configurable } from "../../project/git/Configurable";
import { createRepo } from "../../util/gitHub";
import { AbstractRemoteRepoRef } from "./AbstractRemoteRepoRef";
import { GitShaRegExp } from "./params/gitHubPatterns";
import {
    isTokenCredentials,
    ProjectOperationCredentials,
} from "./ProjectOperationCredentials";
import {
    ProviderType,
    RepoRef,
} from "./RepoId";

export const GitHubDotComBase = "https://api.github.com";

/**
 * GitHub repo ref
 */
export class GitHubRepoRef extends AbstractRemoteRepoRef {

    public static from(params: { owner: string, repo: string, sha?: string, rawApiBase?: string, path?: string, branch?: string }): GitHubRepoRef {
        if (params.sha && !params.sha.match(GitShaRegExp.pattern)) {
            throw new Error("You provided an invalid SHA: " + params.sha);
        }
        /*
         * Replicate legacy behavior of: if we have only a branch and not a sha, put it in the sha.
         */
        const result = new GitHubRepoRef(params.owner, params.repo, params.sha || params.branch, params.rawApiBase, params.path);
        result.branch = params.branch;
        return result;
    }

    public readonly kind = "github";

    public readonly apiBase: string;

    constructor(owner: string,
                repo: string,
                sha: string = "master",
                rawApiBase = GitHubDotComBase,
                path?: string) {
        super(
            rawApiBase === GitHubDotComBase ? ProviderType.github_com : ProviderType.ghe,
            apiBaseToRemoteBase(rawApiBase), rawApiBase, owner, repo, sha, path);
    }

    public createRemote(creds: ProjectOperationCredentials, description: string, visibility: string): Promise<ActionResult<this>> {
        if (!isTokenCredentials(creds)) {
            throw new Error("Only token auth supported");
        }
        return createRepo(creds.token, this, description, visibility === "private")
            .then(() => successOn(this));
    }

    public setUserConfig(credentials: ProjectOperationCredentials, project: Configurable): Promise<ActionResult<any>> {
        const config = headers(credentials);
        return Promise.all([axios.get(`${this.scheme}${this.apiBase}/user`, config),
        axios.get(`${this.scheme}${this.apiBase}/user/emails`, config)])
            .then(results => {
                const name = results[0].data.name || results[0].data.login;
                let email = results[0].data.email;

                if (!email) {
                    email = results[1].data.find(e => e.primary === true).email;
                }

                if (name && email) {
                    return project.setUserConfig(name, email);
                } else {
                    return project.setUserConfig("Atomist Bot", "bot@atomist.com");
                }
            })
            .catch(() => project.setUserConfig("Atomist Bot", "bot@atomist.com"));
    }

    public raisePullRequest(credentials: ProjectOperationCredentials,
                            title: string, body: string, head: string, base: string): Promise<ActionResult<this>> {
        const url = `${this.scheme}${this.apiBase}/repos/${this.owner}/${this.repo}/pulls`;
        const config = headers(credentials);
        logger.debug(`Making request to '${url}' to raise PR`);
        return axios.post(url, {
            title,
            body,
            head,
            base,
        }, config)
            .then(axiosResponse => {
                return {
                    target: this,
                    success: true,
                    axiosResponse,
                };
            })
            .catch(err => {
                logger.error(`Error attempting to raise PR. ${url}  ${err}`);
                return Promise.reject(err);
            });
    }

    public deleteRemote(creds: ProjectOperationCredentials): Promise<ActionResult<this>> {
        const url = `${this.scheme}${this.apiBase}/repos/${this.owner}/${this.repo}`;
        return axios.delete(url, headers(creds))
            .then(r => successOn(this));
    }

}

export function isGitHubRepoRef(rr: RepoRef): rr is GitHubRepoRef {
    const maybe = rr as GitHubRepoRef;
    return maybe && !!maybe.apiBase && maybe.kind === "github";
}

function headers(credentials: ProjectOperationCredentials): { headers: any } {
    if (!isTokenCredentials(credentials)) {
        throw new Error("Only token auth supported");
    }
    return {
        headers: {
            Authorization: `token ${credentials.token}`,
        },
    };
}

function apiBaseToRemoteBase(rawApiBase: string) {
    if (rawApiBase.includes("api.github.com")) {
        return "https://github.com";
    }
    if (rawApiBase.includes("api/v3")) {
        return rawApiBase.substring(0, rawApiBase.indexOf("api/v3"));
    }
    return rawApiBase;
}
