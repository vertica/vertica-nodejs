import spec from 'stream-spec'
import helper from './helper'
import QueryStream from '../src'
import {generateSeriesStatement} from './helper'

helper('stream tester', function (client) {
  it('passes stream spec', function (done) {
    const stream = new QueryStream(generateSeriesStatement(200), [])
    const query = client.query(stream)
    spec(query).readable().pausable({ strict: true }).validateOnExit()
    stream.on('end', done)
  })
})
