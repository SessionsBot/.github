// @ts-check

/**
 * @param {object} params
 * @param {import('@octokit/rest').Octokit} params.github
 * @param {typeof import('@actions/github')['context']} params.context
 * @param {typeof import('@actions/core')} params.core
 * @param {boolean} [deleteUnmatched]
 * @returns {Promise<void>}
 */
module.exports = async ({github, context, core}, deleteUnmatched = false) => {

    // Label Map:
    const labels = [
        { name: "Needs Review", color: "f2733d", description: "In need of review by a code admin" },
        { name: "Awaiting Changes", color: "f0b324", description: "In need of further changes before proceeding" },
        { name: "Accepted", color: "b9f23d", description: "These changes/code have been accepted" },
        { name: "Rejected", color: "e31919", description: "These changes/code have been rejected" },
        
        { name: "Bug", color: "d13f4d", description: "Something isn't working as expected" },
        { name: "Feature", color: "e36de3", description: "New functionality or request" },
        { name: "Task", color: "24a2f0", description: "A work item or general task" },

        { name: "URGENT", color: "ff1717", description: "Shall be reviewed/fixed with urgency" },
        { name: "Low Priority", color: "cc732f", description: "Non critical issues, low urgency" },

        { name: "Outside Contributor", color: "92c1f0", description: "Pull request/issue from a non-org member" },
        { name: "Organization Contributor", color: "8ceb34", description: "Pull request/issue from an org member" }
    ]
    const configLabelNames = labels.map(label => label.name);

    // Debug:
    core.info(`Job triggered by ${context.actor} from js file!`);

    // Delete labels if specified:
    if (deleteUnmatched) {

        const allLabels = await github.paginate(github.rest.issues.listLabelsForRepo, {
            owner: context.repo.owner,
            repo: context.repo.repo
        });

        for (const existingLabel of allLabels) {
        if (!configLabelNames.includes(existingLabel.name)) {
            await github.rest.issues.deleteLabel({
            owner: context.repo.owner,
            repo: context.repo.repo,
            name: existingLabel.name
            });
            core.info(`🗑️ Deleted label not in config: ${existingLabel.name}`);
        }
        }
    }


    // Add new labels from config:
    for (const label of labels) {
        try {
            // Check for label:
            await github.rest.issues.getLabel({
                owner: context.repo.owner,
                repo: context.repo.repo,
                name: label.name
            });
            // Update label:
            await github.rest.issues.updateLabel({
                owner: context.repo.owner,
                repo: context.repo.repo,
                name: label.name,
                color: label.color,
                description: label.description
            });
            core.info(`✅ Updated label: ${label.name}`);

        } catch (error) {
            if (error.status === 404) {
                // Label not found - Create new:
                await github.rest.issues.createLabel({
                owner: context.repo.owner,
                repo: context.repo.repo,
                name: label.name,
                color: label.color,
                description: label.description
                });
                core.info(`➕ Created label: ${label.name}`);
            } else {
                // Unknown error:
                throw error;
            }
        }
    }

}
