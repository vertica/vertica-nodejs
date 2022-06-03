import helper from './helper'
import concat from 'concat-stream'
import tester from 'stream-tester'
import JSONStream from 'JSONStream'
import QueryStream from '../src'
import {generateSeriesStatement} from './helper'

helper('pauses', function (client) {
  it('pauses', function (done) {
    this.timeout(5000)
    const stream = new QueryStream(generateSeriesStatement(200), [], {
      batchSize: 2,
      highWaterMark: 2,
    })
    const query = client.query(stream)
    const pauser = tester.createPauseStream(0.1, 100)
    query
      .pipe(JSONStream.stringify())
      .pipe(pauser)
      .pipe(
        concat(function (json) {
          JSON.parse(json)
          done()
        })
      )
  })
})
