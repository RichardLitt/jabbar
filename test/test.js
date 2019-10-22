/* globals describe, it */
const j = require('../src/')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const { expect } = chai
chai.use(chaiAsPromised)

describe('When getWatchers is called it', function () {
  this.timeout(5000)

  it('should resolve', () => {
    return j.getWatchers('RichardLitt', 'jabbar')
  })

  it('should should return at least the minimal watcher', async () => { //
    const data = await j.getWatchers('RichardLitt', 'jabbar')
    expect(data[0].node.login).to.equal('RichardLitt')
  })

  it('should get at least first page of orgs for a watcher', async () => { //
    const data = await j.getWatchers('RichardLitt', 'jabbar')
    expect(data[0].node.organizations.totalCount).to.be.above(40)
  })

  it('should paginate', async () => { // no done
    const data = await j.getWatchers('orbitdb', 'orbit-db')
    // TODO There's some issue in pagination. This should be 127, but it returrns 126
    expect(data.length).to.be.above(100)
  })
})

describe('When getStargazers is called it', function () {
  this.timeout(5000)
  it('should resolve', () => {
    return j.getStargazers('RichardLitt', 'jabbar')
  })

  it('should should return at least the minimal stargazer', async () => { //
    const data = await j.getStargazers('RichardLitt', 'jabbar')
    expect(data[9].node.login).to.equal('RichardLitt')
  })

  it('should paginate', async () => { // no done
    const data = await j.getStargazers('RichardLitt', 'knowledge')
    // TODO There's some issue in pagination. This should be 127, but it returrns 126
    expect(data.length).to.be.above(100)
  })
})

describe('When orgStargazers is called it', () => {
  it('should resolve', () => {
    return j.getOrgStargazers('mntnr')
  })

  // TODO
  it('should should return at least one stargazer', async () => { //
    const data = await j.getOrgStargazers('mntnr')
    expect(data).to.equal('RichardLitt')
  })
})
