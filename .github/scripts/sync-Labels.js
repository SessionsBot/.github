const fs = require('fs');

module.exports = async ({github, context, core}, deleteUnmatched = false) => {

    const labelConfig = 'config-repo/.github/utils/label-config.json';
    const labels = JSON.parse(fs.readFileSync(labelConfig, 'utf8'));
    const configLabelNames = labels.map(label => label.name);
    const shouldDeleteUnmatched = github.event.inputs.deleteUnmatched === true;

    // Debug:
    core.info(`Job triggered by ${context.actor} from js file!`);

    // Delete labels if specified:
    if (shouldDeleteUnmatched) {

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