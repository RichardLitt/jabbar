const { graphql } = require("@octokit/graphql")
const token = process.env.JABBAR_TOKEN

graphqlt = graphql.defaults({
  headers: {
    authorization: `token ${token}`
  }
})

// TODO There might be an easier way of doing variables
const query = function (org, lastCursor) {
  return `{
    organization(login: "${org}") {
      repositories(first:100${(lastCursor) ? ', after:"' + lastCursor + '"' : ''}) {
        totalCount
        edges {
          node {
            name
          }
          cursor
        }
        pageInfo {
          startCursor
          endCursor
          hasNextPage
        }
      }
    }
  }`
}

async function callGraphql (orgToQuery) {
  // If there are pages, recursively concatinate res to the resulting object
  async function paginateQuery (orgToQuery, orgObject, cursor) {
    let result = await graphqlt(query(orgToQuery, cursor))
    // Logic somewhat elongated by the shape of the object.
    // Note that this paginate function isn't easily transferable to other objects.
    // TODO Make this function more transferable
    orgObject.repositories.edges = orgObject.repositories.edges.concat(result.organization.repositories.edges)
    orgObject.repositories.pageInfo = result.organization.repositories.pageInfo

    if (orgObject.repositories.pageInfo.hasNextPage) {
      lastCursor = orgObject.repositories.pageInfo.endCursor
      // TODO There ought to be a throttler.
      orgObject = await paginateQuery(orgToQuery, orgObject, lastCursor)
    }

    return orgObject
  }


  try {
    let { organization } = await graphqlt(query(orgToQuery))
    if (organization.repositories.pageInfo.hasNextPage) {
      let lastCursor = organization.repositories.pageInfo.endCursor
      organization = await paginateQuery(orgToQuery, organization, lastCursor)
    }
    console.log(organization)
  } catch (error) {
    console.log("Request failed:", error.request); // { query, variables: {}, headers: { authorization: 'token secret123' } }
    console.log(error.message); // Field 'bioHtml' doesn't exist on type 'User'
  }
}

process.exports = callGraphql("orbitdb")