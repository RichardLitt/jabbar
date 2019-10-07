/* globals describe, it */
const j = require('../src/')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const { expect } = chai
chai.use(chaiAsPromised)

describe('When called with correct args', function () {
  it('should resolve', () => {
    return j('RichardLitt', 'jabbar')
  })

  it('Should should return at least the minimal watcher', async () => { // no done
    const login = 'RichardLitt'
    const data = await j(login, 'jabbar')
    expect(data[0].node.login).to.equal(login)
  })
})
