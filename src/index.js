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
            login
            company
            bio
            websiteUrl
            url
            # TODO Going to have to enable pagination for this, too.
            organizations(first: 20) {
              edges {
                node {
                  name
                  description
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

// Note: This only works if the object for a 3-deep list of type { obj: field: edge }
async function paginate3DepthEdge (query, obj, objName, path) {
  // If there are pages, recursively concatinate res to the resulting object
  let result = await graphqlt(query)
  obj[path].edges = obj[path].edges.concat(result[objName][path].edges)
  obj[path].pageInfo = result[objName][path].pageInfo

  if (obj[path].pageInfo.hasNextPage) {
    endCursor = obj[path].pageInfo.endCursor
    await timeout(1000)
    obj = await paginate3DepthEdge(query, obj, objName, path)
  }

  return obj
}

const callGraphql = async function (owner, repo) {
  try {
    let { repository } = await graphqlt(repoQuery(owner, repo))
    if (repository.watchers.pageInfo.hasNextPage) {
      let endCursor = repository.watchers.pageInfo.endCursor
      repository = await paginate3DepthEdge(repoQuery(owner, repo, endCursor), repository, 'repository', 'watchers')
    }
    // TODO Print this in a nice way.
    // console.log(repository.watchers.edges)
    return repository.watchers.edges
  } catch (error) {
    console.log("Request failed:", error.request); // { query, variables: {}, headers: { authorization: 'token secret123' } }
    console.log(error.message); // Field 'bioHtml' doesn't exist on type 'User'
  }
}

module.exports = callGraphql
