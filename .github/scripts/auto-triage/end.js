// @ts-check

/**
 * @param {object} params
 * @param {import('@octokit/rest').Octokit} params.github
 * @param {typeof import('@actions/github')['context']} params.context
 * @param {typeof import('@actions/core')} params.core
 */
module.exports = async ({github, context, core}) => {
    const org = 'SessionsBot';
    let username = context.actor
    let issue_number;
    let isOrgMember = false;
    let labelsToKeep = [];

    // Get PR/Issue Number:
    if (context.payload['pull_request']) { 
        username = context.payload.pull_request.user.login;
        issue_number = context.payload.pull_request.number;
        console.log('[i] Triage was triggered by a Pull Request...');
    } else if (context.payload['issue']) {
        username = context.payload.issue.user.login;
        issue_number = context.payload.issue.number;
        console.log('[i] Triage was triggered by a Issue...');
    } else {
        console.log('An unknown trigger/event type occured!',);
        throw new Error("This workflow only supports issues or pull requests.");
    }

    // Get Updated Labels:
    const exisitingLabels = await github.rest.issues.listLabelsOnIssue({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number,
        per_page: 100
    })
    const existingLabelNames = exisitingLabels.data.map((label) => label.name)

    // DEBUG:
    console.log('Exisiting Labels:')
    console.log(exisitingLabels)

    console.log('Exisiting Label Names:')
    console.log(existingLabelNames)

    // Check for organization memebership:
    try {
        await github.rest.orgs.checkMembershipForUser({
            org,
            username
        });
        // No Error -- Org Member:
        isOrgMember = true;
        console.log(`[i] ${username} is a member of ${org}!`);
    } catch (error) {
        if (error.status === 404) {
            // 404 Error -- Non Org Member:
            console.log(`[i] ${username} is NOT a member of ${org}...`);
        } else {
            // Unknown Error:
            throw error;
        }
    }

    // Completed:
    console.log('-- Success!')
    return true
}