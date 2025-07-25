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
    let labelsToAdd = [];

    // Get PR/Issue Number:
    if (context.payload['pull_request']) { 
        username = context.payload.pull_request.user.login;
        issue_number = context.payload.pull_request.number;
    } else if (context.payload['issue']) {
        username = context.payload.issue.user.login;
        issue_number = context.payload.issue.number;
    } else {
        console.log('An unknown trigger/event type occured!',);
        throw new Error("This workflow only supports issues or pull requests.");
    }

    // Check for organization memebership:
    try {
        await github.rest.orgs.checkMembershipForUser({
            org,
            username
        });
        // No Error -- Org Member:
        isOrgMember = true;
        console.log(`${username} is a member of ${org}`);
        labelsToAdd.push('Organization Contributor');
    } catch (error) {
        if (error.status === 404) {
            // 404 Error -- Non Org Member:
            console.log(`${username} is NOT a member of ${org}`);
            labelsToAdd.push('Outside Contributor', 'Needs Review');
        } else {
            // Unknown Error:
            throw error;
        }
    }

    // Add triage labels:
    await github.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number,
        labels: labelsToAdd
    });

    // Post thank you comment for outside contributors:
    if(!isOrgMember){
        github.rest.issues.createComment({
            issue_number: issue_number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: `👋 Thanks @${username} for your Contribution! One of our code reviewers will check this out as soon as possible.`
        })
    }
}