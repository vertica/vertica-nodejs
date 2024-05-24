'use strict'
const vertica = require('../../../lib')
const assert = require('assert')
const path = require('path')
const fs = require('fs')

describe('Running Copy From Local File Commands', function () {
  // global pool to use for queries
  const pool = new vertica.Pool()

  // global file names and paths
  const copyGoodName = "copy-good.dat"
  const copyBadName = "copy-bad.dat"
  const copyGoodPath = path.join(process.cwd(), copyGoodName);
  const copyBadPath = path.join(process.cwd(), copyBadName)
  const goodFileContents = "1|a\n2|b\n3|c\n4|d\n5|e\n" // 5 correctly formatted rows
  const badFileContents = "6|f\ng|7\n8|h\ni|9\n10|j\n"   // rows 2 and 4 malformed

  // generate temporary test files, create table before tests begin
  before((done) => { 
    fs.writeFile(copyGoodPath, goodFileContents, () => {
      fs.writeFile(copyBadPath, badFileContents, () => {
        pool.query("CREATE TABLE copyTable (num int, let char)", (done))
      })
    })
  })

  // delete temporary test files, drop table after tests are complete
  after((done) => {
    fs.unlink(copyGoodPath, () => {
      fs.unlink(copyBadPath, () => {
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
      assert.equal(err, undefined)
      assert.equal(res.rows[0]['Rows Loaded'], 5) // 5 good rows in goodFileContents
      assert.deepEqual(res.getRejectedRows(), [])
      done()
    })
  })

  it('returns rejected rows with RETURNREJECTED specified', function(done) {
    pool.query("COPY copyTable FROM LOCAL 'copy-bad.dat' RETURNREJECTED", (err, res) => {
      assert.equal(err, undefined)
      assert.equal(res.rows[0]['Rows Loaded'], 3) // 3 good rows in badFileContents
      assert.deepEqual(res.getRejectedRows(), [2, 4]) // rows 2 and 4 are malformed
    })
    done()
  })

  it('writes rejects to file with REJECTED DATA specified', function (done) {
    pool.query("COPY copyTable FROM LOCAL 'copy-bad.dat' REJECTED DATA 'rejects.txt'", (err, res) => {
      try {
        assert.equal(err, undefined)
        assert.equal(res.rows[0]['Rows Loaded'], 3) // 3 good rows in badFileContents
        fs.readFile('rejects.txt', 'utf8', (err, data) => {
          assert.equal(err, undefined)
          assert.equal(data, "g|7\ni|9\n") // rows 2 and 4 are malformed
        })
      } finally {
        fs.unlink('rejects.txt', done)
      }
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
      try {
        assert.equal(err, undefined)
        assert.equal(res.rows[0]['Rows Loaded'], requiredLines)
        assert.deepEqual(res.getRejectedRows(), [])
      } finally {
        fs.unlink(largeFilePath, done)
      }
    })
  })

  it('succeeds with binary copy local files', function(done) {
    const binaryFileContents = Buffer.from(goodFileContents, 'utf-8')
    const binaryFilePath = path.join(process.cwd(), 'binary-copy.bin')
    fs.writeFile(binaryFilePath, binaryFileContents, () => {
      pool.query("COPY copyTable FROM LOCAL 'binary-copy.bin' RETURNREJECTED", (err, res) => {
        try {
          assert.equal(err, undefined)
          assert.equal(res.rows[0]['Rows Loaded'], 5)
          assert.deepEqual(res.getRejectedRows(), [])
        } finally {
          fs.unlink(binaryFilePath, done)
        }
      })    
    })
  })

  it('behaves properly when input file does not exist', function(done) {
    pool.query("COPY copyTable FROM LOCAL 'nonexistant.dat' RETURNREJECTED", (err) => {
      assert.ok(err.message.includes("Unable to open input file for reading "))
      done()
    })
  })

  it ('behaves properly when rejects file cannot be written to', function(done) {
    const readOnlyFilePath = path.join(process.cwd(), 'readOnlyRejects.txt')
    fs.writeFile(readOnlyFilePath, '', () => {
      fs.chmod(readOnlyFilePath, 0o444, () => {
        pool.query("COPY copyTable FROM LOCAL 'copy-good.dat' REJECTED DATA 'readOnlyRejects.txt'", (err) => {
          try {
            assert.ok(err.message.includes("Reject file exists but could not be opened for writing"))
          } finally {
            fs.unlink(readOnlyFilePath, done)
          }
        })
      })
    })
  })

  it ('behaves properly when exceptions file cannot be written to', function(done) {
    const readOnlyFilePath = path.join(process.cwd(), 'readOnlyExceptions.txt')
    fs.writeFile(readOnlyFilePath, '', () => {
      fs.chmod(readOnlyFilePath, 0o444, () => {
        pool.query("COPY copyTable FROM LOCAL 'copy-good.dat' EXCEPTIONS 'readOnlyExceptions.txt'", (err) => {
          try {
            assert.ok(err.message.includes("Exception file exists but could not be opened for writing"))
          } finally {
            fs.unlink(readOnlyFilePath, done)
          }
        })
      })
    })
  })

  it ('succeeds with rejects file larger than buffer size', function(done) {
    // file logic copied from good large copy file test, but with the columns switched so they are all bad instead
    const largeFilePath = path.join(process.cwd(), "large-copy-bad.dat")
    const writableStream = fs.createWriteStream(largeFilePath, { encoding: 'utf8' });
    const bytesPerLine = 6 // single quote + letter + single quote + bar + integer + newline = 6 bytes
    const desiredFileSize = 66000 // 65536 is our max buffer size. This will force multiple copyData messages
    const requiredLines = desiredFileSize / bytesPerLine

    for (let i = 1; i <= requiredLines; i++) {
      const char = String.fromCharCode('a'.charCodeAt(0) + (i % 26)); // a - z
      const line = `'${char}'|${i}\n`
      writableStream.write(line)
    }
    writableStream.end()

    pool.query("COPY copyTable FROM LOCAL 'large-copy-bad.dat' REJECTED DATA 'rejects-large.txt'", (err, res) => {
      try {
        assert.equal(err, undefined);
        assert.equal(res.rows[0]['Rows Loaded'], 0);
        assert.deepEqual(res.getRejectedRows(), []);
    
        fs.stat('rejects-large.txt', (statErr, stats) => {
          assert.equal(statErr, null);
        });
        var inputBuf = fs.readFileSync('large-copy-bad.dat');
        var rejectBuf = fs.readFileSync('rejects-large.txt');
        assert(inputBuf.equals(rejectBuf), 'content in rejected data file is not the same as the input file')
      } finally {
        fs.unlink('large-copy-bad.dat', () => {
          fs.unlink('rejects-large.txt', done)
        });
      }
    });
    
  })

  it('succeeds with multiple input files', function(done) {
    pool.query("COPY copyTable FROM LOCAL 'copy-good.dat', 'copy-bad.dat' RETURNREJECTED", (err, res) => {
      assert.equal(err, undefined)
      assert.equal(res.rows[0]['Rows Loaded'], 8) // 5 good rows in goodFileContents
      assert.deepEqual(res.getRejectedRows(), [7, 9])
      done()
    })
  })

  it('succeeds using glob patterns', function(done) {
    pool.query("COPY copyTable FROM LOCAL 'copy-*.dat' RETURNREJECTED", (err, res) => {
      assert.equal(err, undefined)
      assert.equal(res.rows[0]['Rows Loaded'], 8) // 5 good rows in goodFileContents
      assert.equal(res.getRejectedRows().length, 2) // check the length instead of position in case the order of files loaded changes 
      pool.query({text: "SELECT num FROM copyTable ORDER BY num ASC", rowMode: 'array'}, (err, res) => {
        assert.deepEqual(res.rows, [[1],[2],[3],[4],[5],[6],[8],[10]]) // 7 and 9 malformed.
        done()
      })
    })
  })
})
