const { graphql } = require('@octokit/graphql')
const _ = require('lodash')
const token = process.env.GITHUB_TOKEN

const graphqlt = graphql.defaults({
  headers: {
    authorization: `token ${token}`
  }
})

// Small helper function
function timeout (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Remove nodes and make the gql object easier to parse
function clean (arr) {
  return arr.map(x => {
    let newObj = x.node
    if (x.starredAt) {
      newObj.starredAt = x.starredAt
    }
    newObj.organizationsTotalCount = newObj.organizations.totalCount
    newObj.organizations = newObj.organizations.edges.map(y => {
      return y.node
    })
    return newObj
  })
}

// Get all star gazer information from a repository
const stargazersQuery = function (owner, repo, endCursor) {
  return {
    query: `query stargazers($owner: String!, $repo: String!, $endCursor: String) {
    repository(name: $repo, owner: $owner) {
      stargazers(first: 100, after: $endCursor) {
        totalCount
        edges {
          starredAt
          node {
            name
            login
            company
            bio
            websiteUrl
            url
            organizations(first: 100) {
              totalCount
              edges {
                node {
                  name
                  login
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
  }`,
    repo: repo,
    owner: owner,
    endCursor: endCursor || null
  }
}

// Get all watchers information from a repository
const watchersQuery = function (owner, repo, endCursor) {
  return {
    query: `query watchers($owner: String!, $repo: String!, $endCursor: String) {
    repository(name: $repo, owner: $owner) {
      watchers(first: 100, after: $endCursor) {
        totalCount
        edges {
          node {
            name
            login
            company
            bio
            websiteUrl
            url
            organizations(first: 100) {
              totalCount
              edges {
                node {
                  name
                  login
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
  }`,
    repo: repo,
    owner: owner,
    endCursor: endCursor || null
  }
}

// Note: This only works if the object for a 3-deep list of type { obj: field: edge }
async function paginate3DepthEdge (q, owner, repo, endCursor, obj, objName, path) {
  // If there are pages, recursively concatinate res to the resulting object
  let result = await graphqlt(q(owner, repo, endCursor))
  obj[path].edges = obj[path].edges.concat(result[objName][path].edges)
  obj[path].pageInfo = result[objName][path].pageInfo

  if (obj[path].pageInfo.hasNextPage) {
    let endCursor = obj[path].pageInfo.endCursor
    await timeout(1000) // Let's be nice.
    obj = await paginate3DepthEdge(q, owner, repo, endCursor, obj, objName, path)
  }

  return obj
}

// Getting watchers and stargazers are basically the same, hence this wrapper.
const getRepoInteractorsWrapper = async function (q, owner, repo, interactors) {
  try {
    let { repository } = await graphqlt(q(owner, repo))
    if (repository[interactors].pageInfo.hasNextPage) {
      let endCursor = repository[interactors].pageInfo.endCursor
      repository = await paginate3DepthEdge(q, owner, repo, endCursor, repository, 'repository', interactors)
    }
    return repository[interactors].edges
  } catch (error) {
    console.log('Request failed:', error.request)
    console.log(error.message)
  }
}

const getWatchers = async function (owner, repo) {
  return clean(await getRepoInteractorsWrapper(watchersQuery, owner, repo, 'watchers'))
}

const getStargazers = async function (owner, repo) {
  return clean(await getRepoInteractorsWrapper(stargazersQuery, owner, repo, 'stargazers'))
}

const getAllUsers = async function (owner, repo) {
  let watchers = await getWatchers(owner, repo)
  let stargazers = await getStargazers(owner, repo)
  // TODO Add in allContributors or name-your-contributors output

  // Stargazers has more information due to the starredAt field
  watchers.forEach(x => {
    if (!_.find(stargazers, ['login', x.login])) {
      stargazers += x
    }
  })

  return stargazers
}

module.exports = {
  getStargazers,
  getWatchers,
  getAllUsers
}
