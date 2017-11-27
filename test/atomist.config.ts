import { Configuration } from "../src/configuration";
import { RequestProcessor } from "../src/internal/transport/RequestProcessor";
import { initMemoryMonitoring } from "../src/internal/util/memory";
import { guid } from "../src/internal/util/string";
import { scanCommands, scanEvents } from "../src/scan";
import * as secured from "../src/secured";
import { AutomationEventListenerSupport } from "../src/server/AutomationEventListener";
import { HelloWorld } from "./command/HelloWorld";
import { CircleCIPayload } from "./event/circleIngester";
import { GitLabPushPayload } from "./event/gitLabIngester";
import { GitLabPush } from "./event/GitLabPush";
import { HelloCircle } from "./event/HelloCircle";

export const GitHubToken = process.env.GITHUB_TOKEN || "<please set GITHUB_TOKEN env variable>";

// const host = "https://automation.atomist.com";
const host = "https://automation-staging.atomist.services";

class StartUpListener extends AutomationEventListenerSupport {

    public registrationSuccessful(transport: RequestProcessor) {

        // TODO CD this way of declaring an incoming command isn't nice.
        // We'll fix it with the general polish of API messages.
        transport.processCommand({
            name: "SendStartupMessage",
            atomist_type: "command_handler_request",
            correlation_context: {team: {id: "T1L0VDKJP"}},
            corrid: guid(),
            parameters: [{
                name: "owner",
                value: "cd",
            }, {
                name: "name",
                value: "@atomist/automation-node-tests",
            }, {
                name: "version",
                value: "0.0.4",
            }],
            mapped_parameters: [],
            secrets: [],
            team: {id: "T1L0VDKJP"},
            rug: {},
        });
    }
}

export const configuration: Configuration = {
    name: "@atomist/automation-node-tests",
    version: "0.0.7",
    // policy: "durable",
    teamIds: ["T1L0VDKJP"],
    token: GitHubToken,
    keywords: ["test", "automation"],
    commands: [
        // ...scanCommands( ["**/metadata/addAtomistSpringAgent.js", "**/command/Search*.js"] ),
        HelloWorld,
    ],
    events: [
        HelloCircle,
        GitLabPush,
        // ...scanEvents("**/event/*.js"),
    ],
    ingesters: [
        CircleCIPayload,
        GitLabPushPayload,
    ],
    ws: {
        enabled: true,
    },
    http: {
        enabled: true,
        auth: {
            basic: {
                enabled: false,
                username: "test",
                password: "test",
            },
            bearer: {
                enabled: true,
                adminOrg: "atomisthq",
            },
        },
    },
    listeners: [
        // new StartUpListener(),
    ],
    endpoints: {
        graphql: `${host}/graphql/team`,
        api: `${host}/registration`,
    },
    applicationEvents: {
        enabled: true,
        teamId: "T1L0VDKJP",
    },
    cluster: {
        enabled: false,
        workers: 2,
    },
};

// initMemoryMonitoring();
