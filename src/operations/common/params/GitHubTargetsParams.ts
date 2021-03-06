import {
    MappedParameter,
    MappedParameters,
    Parameters,
    Secret,
    Secrets,
} from "../../../decorators";

import { GitHubRepoRef } from "../GitHubRepoRef";
import { ProjectOperationCredentials } from "../ProjectOperationCredentials";
import { TargetsParams } from "./TargetsParams";

/**
 * Base parameters for working with GitHub repo(s).
 * Allows use of regex.
 */
@Parameters()
export abstract class GitHubTargetsParams extends TargetsParams {

    @MappedParameter(MappedParameters.GitHubApiUrl, false)
    public apiUrl: string;

    get credentials(): ProjectOperationCredentials {
        return { token: this.githubToken };
    }

    /**
     * Return a single RepoRef or undefined if we're not identifying a single repo
     * @return {RepoRef}
     */
    get repoRef(): GitHubRepoRef {
        return (!!this.owner && !!this.repo && !this.usesRegex) ?
            new GitHubRepoRef(this.owner, this.repo, this.sha, this.apiUrl) :
            undefined;
    }

    @Secret(Secrets.userToken(["repo", "user:email", "read:user"]))
    private githubToken: string;

}
