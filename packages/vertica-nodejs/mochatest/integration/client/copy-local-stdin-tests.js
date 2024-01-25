'use strict'
const vertica = require('../../../lib')
const assert = require('assert')
const path = require('path')
const fs = require('fs')

describe('Running Copy From Local Stdin Commands', function () {
  // global pool to use for queries
  const pool = new vertica.Pool()

  // global file names and paths
  const goodFileName = "copy-good.dat"
  const badFileName = "copy-bad.dat"
  const goodFilePath = path.join(process.cwd(), goodFileName);
  const badFilePath = path.join(process.cwd(), badFileName)
  const goodFileContents = "1|'a'\n2|'b'\n3|'c'\n4|'d'\n5|'e'" // 5 correctly formatted rows
  const badFileContents = "1|'a'\n'b'|2\n3|'c'\n'd'|4\n5|'e'"   // rows 2 and 4 malformed

  // generate temporary test files, create table before tests begin
  before((done) => { 
    fs.writeFile(goodFilePath, goodFileContents, () => {
      fs.writeFile(badFilePath, badFileContents, () => {
        pool.query("CREATE TABLE copyTable (num int, let char)", (done))
      })
    })
  })

  // delete temporary test files, drop table after tests are complete
  after((done) => {
    fs.unlink(goodFilePath, () => {
      fs.unlink(badFilePath, () => {
        pool.query("DROP TABLE IF EXISTS copyTable", () => {
          pool.end(done)
        })
      })
    })
  })

  // remove data from table between tests
  afterEach((done) => {
    pool.query("DELETE FROM copyTable", (done))
  })

  it ('succeeds with basic copy from stdin command', function(done) {
    const readableStream = fs.createReadStream(goodFilePath, { encoding: 'utf8' })
    readableStream.on('open', () => {
      pool.query("COPY copyTable FROM LOCAL STDIN REJECTED DATA 'rejects.txt' EXCEPTIONS 'exceptions.txt'", {copyStream: readableStream}, (err, res) => {
        assert.equal(err, undefined)
        assert.equal(res.rows[0]['Rows Loaded'], 5) 
        done()
      })
    })
  })

  it ('succeeds with a binary input stream', function(done) {
    const readableStream = fs.createReadStream(goodFilePath)
    readableStream.on('open', () => {
      pool.query("COPY copyTable FROM LOCAL STDIN REJECTED DATA 'rejects.txt' EXCEPTIONS 'exceptions.txt'", {copyStream: readableStream}, (err, res) => {
        assert.equal(err, undefined)
        assert.equal(res.rows[0]['Rows Loaded'], 5) 
        done()
      })
    })
  })

  it('succeeds when streamed data is larger than buffer size requiring multiple copyData messages', function(done) {
    const largeFilePath = path.join(process.cwd(), "large-copy.dat")
    const writableStream = fs.createWriteStream(largeFilePath, { encoding: 'utf8' });
    const bytesPerLine = 6 // single quote + letter + single quote + bar + integer + newline = 6 bytes
    const desiredFileSize = 66000 // 65536 is our max buffer size. This will force multiple copyData messages
    const requiredLines = desiredFileSize / bytesPerLine

    for (let i = 1; i <= requiredLines; i++) {
      const char = String.fromCharCode('a'.charCodeAt(0) + (i % 26)); // a - z
      const line = `${i}|'${char}'\n`
      writableStream.write(line)
    }
    writableStream.end(() => {
      const readableStream = fs.createReadStream(largeFilePath, { encoding: 'utf8' })
      readableStream.on('open', () => {
        pool.query("COPY copyTable FROM LOCAL STDIN RETURNREJECTED", {copyStream: readableStream}, (err, res) => {
          try {
            assert.equal(err, undefined)
            assert.equal(res.rows[0]['Rows Loaded'], requiredLines)
            assert.deepEqual(res.getRejectedRows(), [])
          } finally {
            fs.unlink(largeFilePath, done)
          }
        })
      })
    })
  })

  it('returns rejected rows with RETURNREJECTED specified', function(done) {
    const readableStream = fs.createReadStream(badFilePath, { encoding: 'utf8' })
    readableStream.on('open', () => {
      pool.query("COPY copyTable FROM LOCAL STDIN RETURNREJECTED", {copyStream: readableStream}, (err, res) => {
        assert.equal(err, undefined)
        assert.equal(res.rows[0]['Rows Loaded'], 3) // 3 good rows in badFileContents
        assert.deepEqual(res.getRejectedRows(), [2, 4]) // rows 2 and 4 are malformed
      })
      done()
    })
  })

  it('behaves properly when input stream does not exist/is invalid', function(done) {
    const badStream = null
    pool.query("COPY copyTable FROM LOCAL STDIN RETURNREJECTED", {copyStream: badStream}, (err) => {
      assert.ok(err.message.includes("Cannot perform copy operation. Stream must be an instance of stream.Readable"))
      done()
    })
  })
})
