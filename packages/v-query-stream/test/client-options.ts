import vertica from 'vertica-nodejs'
import assert from 'assert'
import QueryStream from '../src'
import {generateSeriesStatement} from './helper'

describe('client options', function () {
  it('uses custom types from client config', function (done) {
    const types = {
      getTypeParser: () => (string) => string,
    }
    
    const client = new vertica.Client({ types })
    client.connect()
    const stream = new QueryStream(generateSeriesStatement(11))
    const query = client.query(stream)
    const result = []
    query.on('data', (datum) => {
      result.push(datum)
    })
    query.on('end', () => {
      const expected = new Array(11).fill(0).map((_, i) => ({
        num: i.toString(),
      }))
      assert.deepEqual(result, expected)
      client.end()
      done()
    })
  })
})
