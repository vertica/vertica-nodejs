import helper from './helper'
import QueryStream from '../src'
import concat from 'concat-stream'
import {generateSeriesStatement} from './helper'

import { Transform } from 'stream'

const mapper = new Transform({ objectMode: true })

mapper._transform = function (obj, enc, cb) {
  this.push(obj)
  setTimeout(cb, 5)
}

helper('slow reader', function (client) {
  it('works', function (done) {
    this.timeout(50000)
    const stream = new QueryStream(generateSeriesStatement(201), [], {
      highWaterMark: 100,
      batchSize: 50,
    })
    stream.on('end', function () {
      // console.log('stream end')
    })
    client.query(stream)
    stream.pipe(mapper).pipe(
      concat(function (res) {
        done()
      })
    )
  })
})
