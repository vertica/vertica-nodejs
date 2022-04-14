'use strict'

const assert = require('assert')
const helper = require('../test-helper')

test('pool with copied settings includes password', () => {
  const original = new helper.vertica.Pool({
    password: 'original',
  })

  const copy = new helper.vertica.Pool(original.options)

  assert.equal(copy.options.password, 'original')
})
