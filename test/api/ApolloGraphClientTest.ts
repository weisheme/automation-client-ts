import "mocha";
import * as assert from "power-assert";

import { ApolloGraphClient } from "../../src/graph/ApolloGraphClient";
import { logger } from "../../src/internal/util/logger";
import { GitHubRepoRef } from "../../src/operations/common/GitHubRepoRef";
import { GitCommandGitProject } from "../../src/project/git/GitCommandGitProject";
import { ReposQuery, ReposQueryVariables } from "../../src/schema/schema";
import { GitHubToken, SlackTeamId } from "./gitHubTest";

describe("ApolloGraphClient", () => {

    describe("deprecated api", () => {

        it("should run repos query", done => {

            const agc = new ApolloGraphClient(`https://automation.atomist.com/graphql/team/${SlackTeamId}`,
                { Authorization: `token ${GitHubToken}` });
            let start = Date.now();
            agc.executeQueryFromFile<ReposQuery, ReposQueryVariables>("../graphql/query/repos",
                { teamId: SlackTeamId, offset: 0 }, {}, __dirname)
                .then(result => {
                    logger.debug("query took " + (Date.now() - start));
                    const org = result.ChatTeam[0].orgs[0];
                    assert(org.repo.length > 0);
                    const repo1 = org.repo[0];
                    assert(repo1.name);
                    assert(repo1.owner);
                    start = Date.now();
                    agc.executeQueryFromFile<ReposQuery, ReposQueryVariables>("../graphql/query/repos",
                        { teamId: SlackTeamId, offset: 0 }, {}, __dirname)
                        .then(r1 => {
                            logger.debug("query took " + (Date.now() - start));
                        });
                })
                .then(() => done(), done);
        }).timeout(5000);

        it("should run repos query and clone repo", done => {
            const agc = new ApolloGraphClient(`https://automation.atomist.com/graphql/team/${SlackTeamId}`,
                { Authorization: `token ${GitHubToken}` });
            agc.executeQueryFromFile<ReposQuery, ReposQueryVariables>("../graphql/query/repos",
                { teamId: SlackTeamId, offset: 0 }, {}, __dirname)
                .then(result => {
                    const org = result.ChatTeam[0].orgs[0];
                    assert(org.repo.length > 0);
                    const repo1 = org.repo[0];
                    return GitCommandGitProject.cloned({ token: GitHubToken },
                        new GitHubRepoRef(repo1.owner, repo1.name))
                        .then(p => {
                            const gitHead = p.findFileSync(".git/HEAD");
                            assert(gitHead);
                            assert.equal(gitHead.path, ".git/HEAD");
                        });
                })
                .then(() => done(), done);
        }).timeout(10000);

        it("should mutate preferences", done => {
            const agc = new ApolloGraphClient(`https://automation.atomist.com/graphql/team/${SlackTeamId}`,
                { Authorization: `token ${GitHubToken}` });
            agc.executeMutationFromFile("../graphql/mutation/setChatUserPreference",
                {
                    teamId: SlackTeamId,
                    userId: "U095T3BPF",
                    name: "test",
                    value: `{"disable_for_test":true}`,
                }, {}, __dirname)
                .then(result => {
                    assert.equal((result as any).setChatUserPreference[0].name, "test");
                    assert.equal((result as any).setChatUserPreference[0].value, `{"disable_for_test":true}`);
                })
                .then(() => done(), done);
        }).timeout(5000);

    });

    describe("api", () => {

        it("should run repos query", done => {

            const agc = new ApolloGraphClient(`https://automation.atomist.com/graphql/team/${SlackTeamId}`,
                { Authorization: `token ${GitHubToken}` });
            let start = Date.now();
            agc.query<ReposQuery, ReposQueryVariables>({
                name: "repos",
                variables: { teamId: SlackTeamId, offset: 0 },
            })
                .then(result => {
                    logger.debug("query took " + (Date.now() - start));
                    const org = result.ChatTeam[0].orgs[0];
                    assert(org.repo.length > 0);
                    const repo1 = org.repo[0];
                    assert(repo1.name);
                    assert(repo1.owner);
                    start = Date.now();
                    agc.query<ReposQuery, ReposQueryVariables>({
                        name: "repos",
                        variables: { teamId: SlackTeamId, offset: 0 },
                    })
                        .then(r1 => {
                            logger.debug("query took " + (Date.now() - start));
                        });
                })
                .then(() => done(), done);
        }).timeout(5000);

        it("should run repos query and clone repo", done => {
            const agc = new ApolloGraphClient(`https://automation.atomist.com/graphql/team/${SlackTeamId}`,
                { Authorization: `token ${GitHubToken}` });
            agc.query<ReposQuery, ReposQueryVariables>({
                name: "repos",
                variables: { teamId: SlackTeamId, offset: 0 },
            })
                .then(result => {
                    const org = result.ChatTeam[0].orgs[0];
                    assert(org.repo.length > 0);
                    const repo1 = org.repo[0];
                    return GitCommandGitProject.cloned({ token: GitHubToken },
                        new GitHubRepoRef(repo1.owner, repo1.name))
                        .then(p => {
                            const gitHead = p.findFileSync(".git/HEAD");
                            assert(gitHead);
                            assert.equal(gitHead.path, ".git/HEAD");
                        });
                })
                .then(() => done(), done);
        }).timeout(10000);

        it("should mutate preferences", done => {
            const agc = new ApolloGraphClient(`https://automation.atomist.com/graphql/team/${SlackTeamId}`,
                { Authorization: `token ${GitHubToken}` });
            agc.mutate({
                name: "setChatUserPreference",
                variables: {
                    teamId: SlackTeamId,
                    userId: "U095T3BPF",
                    name: "test",
                    value: `{"disable_for_test":true}`,
                },
            })
                .then(result => {
                    assert.equal((result as any).setChatUserPreference[0].name, "test");
                    assert.equal((result as any).setChatUserPreference[0].value, `{"disable_for_test":true}`);
                })
                .then(() => done(), done);
        }).timeout(5000);

    });
});
