const { graphql } = require("@octokit/graphql")
const token = process.env.JABBAR_TOKEN

graphqlt = graphql.defaults({
  headers: {
    authorization: `token ${token}`
  }
})


// Small helper function
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Small helper function
function endCursorStr (c) {
  return `${(c) ? ', after:"' + c + '"' : ''}`
}

// TODO There might be an easier way of doing variables
// Get all watchers information from a repository
const repoQuery = function (owner, repo, endCursor) {
  return `{
    repository(name: "${repo}", owner: "${owner}") {
      watchers(first: 100${endCursorStr(endCursor)}) {
        totalCount
        edges {
          node {
            name
            company
            companyHTML
            email
            bio
            websiteUrl
            url
            # TODO Going to have to enable pagination for this, too.
            organizations(first: 20) {
              edges {
                node {
                  name
                  description
                  email
                  websiteUrl
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }`
}

async function callGraphql (owner, repo) {
  // If there are pages, recursively concatinate res to the resulting object
  async function paginateQuery (owner, repo, pagObject, cursor) {
    let result = await graphqlt(repoQuery(owner, repo, cursor))
    // Logic somewhat elongated by the shape of the object.
    // Note that this paginate function isn't easily transferable to other objects.
    // TODO Make this function more transferable
    // The problem is that you're paginating on a child object, and the pageInfo is in a sibling of that child.
    // Also, the variables going in may change, as will the path to the child objects.
    pagObject.watchers.edges = pagObject.watchers.edges.concat(result.repository.watchers.edges)
    pagObject.watchers.pageInfo = result.repository.watchers.pageInfo

    if (pagObject.watchers.pageInfo.hasNextPage) {
      endCursor = pagObject.watchers.pageInfo.endCursor
      // TODO There ought to be a better throttler.
      await timeout(1000)
      pagObject = await paginateQuery(owner, repo, pagObject, endCursor)
    }

    return pagObject
  }


  try {
    let { repository } = await graphqlt(repoQuery(owner, repo))
    if (repository.watchers.pageInfo.hasNextPage) {
      let endCursor = repository.watchers.pageInfo.endCursor
      repository = await paginateQuery(owner, repo, repository, endCursor)
    }
    // TODO Print this in a nice way.
    console.log(repository.watchers.edges)
  } catch (error) {
    console.log("Request failed:", error.request); // { query, variables: {}, headers: { authorization: 'token secret123' } }
    console.log(error.message); // Field 'bioHtml' doesn't exist on type 'User'
  }
}

process.exports = callGraphql("orbitdb", "orbit-db")