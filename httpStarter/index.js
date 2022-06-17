const df = require("durable-functions");

module.exports = async function(context, req) {
    const client = df.getClient(context);

    const instanceId = '1';
    const functionName = 'orchestrator';

    // Check if an instance with the specified ID already exists or an existing one stopped running(completed/failed/terminated).
    const existingInstance = await client.getStatus(instanceId);
    if (!existingInstance 
        || existingInstance.runtimeStatus == "Completed" 
        || existingInstance.runtimeStatus == "Failed" 
        || existingInstance.runtimeStatus == "Terminated") {
        // An instance with the specified ID doesn't exist or an existing one stopped running, create one.
        const eventData = req.body;
        await client.startNew(functionName, instanceId, eventData);
        context.log(`Started orchestration with ID = '${instanceId}'.`);
        return client.createCheckStatusResponse(req, instanceId);
    } else {
        // An instance with the specified ID exists or an existing one still running, don't create one.
        return {
            status: 409,
            body: `An instance with ID '${instanceId}' already exists.`,
        };
    }
};