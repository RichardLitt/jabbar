const { graphql } = require('@octokit/graphql')
const _ = require('lodash')
const token = process.env.GITHUB_TOKEN
const isGitHubUserOrOrg = require('is-github-user-or-org')

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

// Note: This only works if the object for a 3-deep list of type { obj: field: edge }
async function paginate3DepthEdge (query, obj, path) {
  // If there are pages, recursively concatinate res to the resulting object
  let result = await graphqlt(query)
  obj[path].edges = obj[path].edges.concat(result['repository'][path].edges)
  obj[path].pageInfo = result['repository'][path].pageInfo

  if (obj[path].pageInfo.hasNextPage) {
    query.endCursor = obj[path].pageInfo.endCursor
    await timeout(1000) // Let's be nice.
    obj = await paginate3DepthEdge(query, obj, path)
  }

  return obj
}

// Getting watchers and stargazers are basically the same, hence this wrapper.
const getRepoInteractorsWrapper = async function (query, interactors) {
  try {
    let { repository } = await graphqlt(query)
    if (repository[interactors].pageInfo.hasNextPage) {
      query.endCursor = repository[interactors].pageInfo.endCursor
      repository = await paginate3DepthEdge(query, repository, interactors)
    }
    return repository[interactors].edges
  } catch (error) {
    console.log('Request failed:', error.request)
    console.log(error.message)
  }
}

const getUser = async function (user) {
  let query = {
    query: `query user($login:String!) {
      user(login: $login) {
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
    }`,
    login: user
  }
  try {
    return await graphqlt(query)
  } catch (error) {
    console.log('Request failed:', error.request)
    console.log(error.message)
  }
}

const getOrganization = async function (org) {
  let query = {
    query: `query organization($login:String!) {
      organization(login: $login) {
        name
        login
        websiteUrl
        url
      }
    }`,
    login: org
  }
  try {
    return await graphqlt(query)
  } catch (error) {
    console.log('Request failed:', error.request)
    console.log(error.message)
  }
}

const getForkInformation = async function (owner, repo) {
  let endCursor = null
  let query = {
    query: `query forks($owner: String!, $repo: String!, $endCursor: String) {
    repository(name: $repo, owner: $owner) {
      forks(first: 100, after: $endCursor) {
        totalCount
        edges {
          node {
            createdAt
            forkCount
            stargazers {
              totalCount
            }
            watchers {
              totalCount
            }
            owner {
              login
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
  let res = await getRepoInteractorsWrapper(query, 'forks')
  res = res.map(async x => {
    let newObj = x.node
    let typeOfUser = await isGitHubUserOrOrg(newObj.owner.login)
    if (typeOfUser === 'User') {
      newObj.owner = await getUser(newObj.owner.login)
    } else {
      newObj.owner = await getOrganization(newObj.owner.login)
    }
    await timeout(1000) // Let's be nice.
    return newObj
  })
  return Promise.all(res)
}

const getForkers = async function (owner, repo) {
  const forks = await getForkInformation(owner, repo)
  return forks.map(x => {
    let newObj = (x.owner.user) ? x.owner.user : x.owner.organization
    newObj.forkedAt = x.createdAt
    if (x.owner.organization) {
      newObj.organizationsTotalCount = 1
      newObj.organizations = [x.owner.organization] // TODO Not elegant
      newObj.organization = true
    } else {
      newObj.organizationsTotalCount = newObj.organizations.totalCount
      newObj.organizations = newObj.organizations.edges.map(y => {
        return y.node
      })
    }
    return newObj
  })
}

const getWatchers = async function (owner, repo) {
  let endCursor = null
  let query = {
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
  return clean(await getRepoInteractorsWrapper(query, 'watchers'))
}

const getStargazers = async function (owner, repo) {
  let endCursor = null
  let query = {
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
  return clean(await getRepoInteractorsWrapper(query, 'stargazers'))
}

const getAllUsers = async function (owner, repo) {
  let watchers = await getWatchers(owner, repo)
  let stargazers = await getStargazers(owner, repo)
  let forkers = await getForkers(owner, repo)
  // TODO Add in allContributors or name-your-contributors output

  // Stargazers has more information due to the starredAt field
  watchers.forEach(x => {
    if (!_.find(stargazers, ['login', x.login])) {
      stargazers.push(x)
    }
  })

  // Much less likely to have forked without starring or watching
  forkers.forEach(x => {
    if (!_.find(stargazers, ['login', x.login])) {
      stargazers.push(x)
    }
    // TODO Forking information is lost if it does exist.
    // Add this information to the stargazers object.
  })

  return stargazers
}

const mostPopularOrgs = async function (arr, ignore) {
  let allOrgs = {}
  arr.forEach(x => {
    // TODO x.company.stripOut('strings@`) and add them
    x.organizations.forEach(o => {
      if (!o.organization) {
        if (!allOrgs[o.login]) {
          allOrgs[o.login] = o
          allOrgs[o.login].users = ['@' + x.login]
        } else {
          allOrgs[o.login].users.push('@' + x.login)
        }
      }
    })
  })

  // Sort the list and remove orgs that only have one person
  let sortedList = _.sortBy(allOrgs, [(o) => o.users.length])
    .filter(o => o.users.length !== 1)

  if (ignore) {
    sortedList = sortedList.filter(o => o.login !== ignore.toLowerCase())
  }
  return _.reverse(sortedList)
}

module.exports = {
  getStargazers,
  getWatchers,
  getAllUsers,
  getForkInformation,
  getForkers,
  mostPopularOrgs
}
