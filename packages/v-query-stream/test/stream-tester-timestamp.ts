import helper from './helper'
import QueryStream from '../src'
import spec from 'stream-spec'
import assert from 'assert'

helper('stream tester timestamp', function (client) {
  it('should not warn about max listeners', function (done) {
    const sql = "SELECT TO_DATE('200001131','YYYYMMDD')" + 
                " UNION SELECT TO_DATE('200101132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('200201132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('200301132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('200401132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('2005101132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('200601132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('2007101132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('200801132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('200901132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('201001132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('201101132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('201201132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('201301132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('201401132','YYYYMMDD')" +
                " UNION SELECT TO_DATE('201501132','YYYYMMDD')"
    const stream = new QueryStream(sql, [])
    let ended = false
    const query = client.query(stream)
    query.on('end', function () {
      ended = true
    })
    spec(query).readable().pausable({ strict: true }).validateOnExit()
    const checkListeners = function () {
      assert(stream.listeners('end').length < 10)
      if (!ended) {
        setImmediate(checkListeners)
      } else {
        done()
      }
    }
    checkListeners()
  })
})
