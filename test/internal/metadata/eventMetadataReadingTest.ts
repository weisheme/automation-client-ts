import "mocha";
import {
    Configuration,
    Parameters,
    Success,
    Value,
} from "../../../src";
import { subscription } from "../../../src/graph/graphQL";
import { metadataFromInstance } from "../../../src/internal/metadata/metadataReading";

import * as assert from "power-assert";
import { populateValues } from "../../../src/internal/parameterPopulation";
import { EventHandlerMetadata } from "../../../src/metadata/automationMetadata";
import { eventHandlerFrom } from "../../../src/onEvent";
import { HelloIssue } from "../../event/HelloIssue";

describe("class style event metadata reading", () => {

    it("should extract metadataFromInstance from event handler", () => {
        const h = new HelloIssue();
        const md = metadataFromInstance(h) as EventHandlerMetadata;
        assert(md.subscriptionName === "HelloIssue");

        const config: Configuration = {
            http: {
                port: 1111,
            },
        };

        populateValues(h, md, config);
        assert.equal(h.port, config.http.port);
    });

});

@Parameters()
class ParametersWithConfig {

    @Value("http.port")
    public port: number;
}

describe("event style event metadata reading", () => {

    it("should extract metadataFromInstance from event handler", () => {
        const h = eventHandlerFrom(
            async e => {
                return Success;
            },
            ParametersWithConfig,
            subscription("subscriptionWithFragmentInGraphql"),
            "TestHandler",
            "desc",
            "tag");

        const md = metadataFromInstance(h) as EventHandlerMetadata;
        assert(md.subscriptionName === "TestHandler");
        assert(md.description === "desc");
        assert(md.tags[0].name === "tag");
        assert(md.values[0].name === "port");

    });

});
