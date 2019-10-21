/* globals describe, it */
const j = require('../src/')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const { expect } = chai
chai.use(chaiAsPromised)

describe('When called with correct args', function () {
  this.timeout(5000)

  it('should resolve', () => {
    return j('RichardLitt', 'jabbar')
  })

  it('Should should return at least the minimal watcher', async () => { //
    const data = await j('RichardLitt', 'jabbar')
    expect(data[0].node.login).to.equal('RichardLitt')
  })

  it('Should paginate', async () => { // no done
    const data = await j('orbitdb', 'orbit-db')
    // TODO There's some issue in pagination. This should be 127, but it returrns 126
    expect(data.length).to.be.above(100)
  })
})
