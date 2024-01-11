'use strict'
const vertica = require('../../../lib')
const assert = require('assert')
const path = require('path')
const fs = require('fs')

describe('Running Copy Commands', function () {
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

  it('succeeds with basic copy from file command', function(done) {
    pool.query("COPY copyTable FROM LOCAL 'copy-good.dat' RETURNREJECTED", (err, res) => {
      assert.equal(res.rows[0]['Rows Loaded'], 5) // 5 good rows in goodFileContents
      assert.equal(err, undefined)
      assert.deepEqual(res.getRejectedRows(), [])
      done()
    })
  })

  it('returns rejected rows with RETURNREJECTED specified', function(done) {
    pool.query("COPY copyTable FROM LOCAL 'copy-bad.dat' RETURNREJECTED", (err, res) => {
      assert.equal(res.rows[0]['Rows Loaded'], 3) // 3 good rows in badFileContents
      assert.equal(err, undefined)
      assert.deepEqual(res.getRejectedRows(), [2, 4]) // rows 2 and 4 are malformed
    })
    done()
  })

  it('writes rejects to file with REJECTED DATA specified', function (done) {
    pool.query("COPY copyTable FROM LOCAL 'copy-bad.dat' REJECTED DATA 'rejects.txt'", (err, res) => {
      assert.equal(res.rows[0]['Rows Loaded'], 3) // 3 good rows in badFileContents
      assert.equal(err, undefined)
      fs.readFile('rejects.txt', 'utf8', (err, data) => {
        assert.equal(err, undefined)
        assert.equal(data, "'b'|2\n'd'|4\n") // rows 2 and 4 are malformed
        fs.unlink('rejects.txt', done)
      })
    })
  })

  it('succeeds when data file is larger than buffer size requiring multiple copyData messages', function(done) {
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
    writableStream.end()

    pool.query("COPY copyTable FROM LOCAL 'large-copy.dat' RETURNREJECTED", (err, res) => {
      assert.equal(res.rows[0]['Rows Loaded'], requiredLines)
      assert.equal(err, undefined)
      assert.deepEqual(res.getRejectedRows(), [])
      fs.unlink(largeFilePath, done)
    })
  })

  it('succeeds with binary copy local files', function(done) {
    const binaryFileContents = Buffer.from(goodFileContents, 'utf-8')
    const binaryFilePath = path.join(process.cwd(), 'binary-copy.bin')
    fs.writeFile(binaryFilePath, binaryFileContents, () => {
      pool.query("COPY copyTable FROM LOCAL 'binary-copy.bin' RETURNREJECTED", (err, res) => {
        assert.equal(res.rows[0]['Rows Loaded'], 5)
        assert.equal(err, undefined)
        assert.deepEqual(res.getRejectedRows(), [])
        fs.unlink(binaryFilePath, done)
      })    
    })
  })

  it('succeeds with multiple copy local files', function(done) {
    done()
  })

  it('behaves properly when input files do not exist', function(done) {
    done()
  })

  it('succeeds with basic copy from stdin command', function(done) {
    done()
  })
})
