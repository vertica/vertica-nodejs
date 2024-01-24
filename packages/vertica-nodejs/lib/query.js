// Copyright (c) 2022-2023 Open Text.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

const { EventEmitter } = require('events')

const Result = require('./result')
const utils = require('./utils')
const fs = require('fs')
const fsPromises = require('fs').promises

class Query extends EventEmitter {
  constructor(config, values, callback) {
    super()

    config = utils.normalizeQueryConfig(config, values, callback)

    this.text = config.text
    this.values = config.values
    this.rows = config.rows
    this.types = config.types
    this.name = config.name
    this.binary = config.binary || false
    // use unique portal name each time
    this.portal = config.portal || ''
    this.callback = config.callback
    this._rowMode = config.rowMode
    if (process.domain && config.callback) {
      this.callback = process.domain.bind(config.callback)
    }
    this._result = new Result(this._rowMode, this.types)

    // potential for multiple results
    this._results = this._result
    this.isPreparedStatement = false
    this._canceledDueToError = false
    this._activeError = false
    this._promise = null
    if (this.values) {
      this.copyStream = this.values.copyStream || null
    }
  }

  requiresPreparation() {
    // named queries must always be prepared
    if (this.name) {
      return true
    }
    // always prepare if there are max number of rows expected per
    // portal execution
    if (this.rows) {
      return true
    }
    // don't prepare empty text queries
    if (!this.text) {
      return false
    }
    // prepare if there are values
    if (!this.values || !Array.isArray(this.values)) {
      return false
    }
    return this.values.length > 0
  }

  _checkForMultirow() {
    // if we already have a result with a command property
    // then we've already executed one query in a multi-statement simple query
    // turn our results into an array of results
    if (this._result.command) {
      if (!Array.isArray(this._results)) {
        this._results = [this._result]
      }
      this._result = new Result(this._rowMode, this.types)
      this._results.push(this._result)
    }
  }

  // associates row metadata from the supplied
  // message with this query object
  // metadata used when parsing row results
  handleRowDescription(msg) {
    this._checkForMultirow()
    this._result.addFields(msg.fields)
    this._accumulateRows = this.callback || !this.listeners('row').length
  }

  handleBindComplete(connection) {
    connection.execute({portal: this.portal,
                        rows: this.rows})
    connection.sync()
  }

  handleDataRow(msg) {
    let row

    if (this._canceledDueToError) {
      return
    }

    try {
      row = this._result.parseRow(msg.fields)
    } catch (err) {
      this._canceledDueToError = err
      return
    }

    this.emit('row', row, this._result)
    if (this._accumulateRows) {
      this._result.addRow(row)
    }
  }

  handleCommandComplete(msg, connection) {
    this._checkForMultirow()
    this._result.addCommandComplete(msg)
    // need to sync after each command complete of a prepared statement
    // if we were using a row count which results in multiple calls to _getRows
    if (this.rows) {
      connection.sync()
    }
  }

  // if a named prepared statement is created with empty query text
  // the backend will send an emptyQuery message but *not* a command complete message
  // since we pipeline sync immediately after execute we don't need to do anything here
  // unless we have rows specified, in which case we did not pipeline the intial sync call
  handleEmptyQuery(connection) {
    if (this.rows) {
      connection.sync()
    }
  }

  handleError(err, connection, internalError = false) {
    // need to sync after error during a prepared statement
    if (this._canceledDueToError) {
      err = this._canceledDueToError
      this._canceledDueToError = false
    }
    // if callback supplied do not emit error event as uncaught error
    // events will bubble up to node process
    this._activeError = true
    if (this.requiresPreparation() && !internalError) {
      connection.sync()
    }
    if (this.callback) {
      return this.callback(err)
    }
    this.emit('error', err)
  }

  handleReadyForQuery(con) {
    if (this._canceledDueToError) {
      return this.handleError(this._canceledDueToError, con)
    }
    if (this.callback && !this._activeError) {
      this.callback(null, this._results)
    }
    this._activeError = false;
    this.emit('end', this._results)
  }

  submit(connection) {
    if (typeof this.text !== 'string' && typeof this.name !== 'string') {
      return new Error('A query must have either text or a name. Supplying neither is unsupported.')
    }
    const previous = connection.parsedStatements[this.name]
    if (this.text && previous && this.text !== previous) {
      return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`)
    }
    if (this.requiresPreparation()) {
      if (this.values && !Array.isArray(this.values)) {
        return new Error('Query values must be an array')
      }
      this.prepare(connection)
    } else {
      connection.query(this.text)
    }
    return null
  }

  hasBeenParsed(connection) {
    return this.name && connection.parsedStatements[this.name]
  }

  handlePortalSuspended(connection) {
    //do nothing, vertica doesn't support result-row count limit
  }

  handleEndOfBatchResponse(connection) {
    if (this.values && this.values.copyStream) { //copy from stdin
      connection.sendCopyDone()
    }
    // else noop, backend will send CopyDoneResponse for copy from local file to continue the process
  }

  prepare(connection) {
    // prepared statements need sync to be called after each command
    // complete or when an error is encountered
    this.isPreparedStatement = true

    this.name = this.name || connection.makeStatementName()

    // TODO refactor this poor encapsulation
    if (!this.hasBeenParsed(connection)) {
      connection.parse({
        text: this.text,
        name: this.name,
        types: this.types,
      })
    }

    // [VERTICA specific] The statement needs to be sent, not a portal
    connection.describe({
      type: 'S',
      name: this.name,
    })
    
    connection.flush()
  }

  // [VERTICA specific] Bind and Execute are not sent until ParameterDescription is received because the dataTypeIDs
  // are not available for the Bind message otherwise
  handleParameterDescription(msg, connection) {
    // because we're mapping user supplied values to
    // postgres wire protocol compatible values it could
    // throw an exception, so try/catch this section

    // parse out the oid from the ParameterDescription message parameters, since that's what we need to bind with
    var oids = []
    for (var i = 0; i < msg.parameters.length; i++) {
      oids.push(msg.parameters[i].oid)
    }
    try {
      connection.bind({
        portal: this.portal,
        statement: this.name,
        values: this.values,
        binary: this.binary,
        valueMapper: utils.prepareValue,
        dataTypeIDs: oids,
      })
    } catch (err) {
      this.handleError(err, connection)
      return
    }
    connection.flush() // flush to force the bind complete in order to continue the sequence
  }

  handleCopyInResponse(connection) {
    connection.sendCopyDataStream(this.copyStream)
  }

  async handleVerifyFiles(msg, connection) {
    if (msg.numFiles !== 0) { // we are copying from file, not stdin
      try { // Check if the data file can be read
        await fsPromises.access(msg.files[0], fs.constants.R_OK);
      } catch (readInputFileErr) { // Can't open input file for reading, send CopyError
        console.log(readInputFileErr.code)
        connection.sendCopyError(msg.files[0], 0, '', "Unable to open input file for reading")
        return;
      }
    }
    if (msg.rejectFile) {
      try { // Check if the rejections file can be written to, if specified
        await fsPromises.access(msg.rejectFile, fs.constants.W_OK);
      } catch (writeRejectsFileErr) {
        if (writeRejectsFileErr.code === 'ENOENT') { // file doesn't exist, see if we can create it
          try {
            const rejectHandle = await fsPromises.open(msg.rejectFile, 'w');
            await rejectHandle.close()
          } catch (createErr) { // can't open or create output file for writing, send CopyError 
            connection.sendCopyError(msg.rejectFile, 0, '', "Unable to open or create rejects file for writing")
            return
          }
        } else { // file exists but we can't open, likely permissions issue
          connection.sendCopyError(msg.rejectFile, 0, '', "Reject file exists but could not be opened for writing")
          return
        }
      }
    }
    if (msg.exceptionFile) {
      try { // Check if the exceptions file can be written to, if specified
        await fsPromises.access(msg.exceptionFile, fs.constants.W_OK);
      } catch (writeExceptionsFileErr) { // Can't open exceptions output file for writing, send CopyError
        if (writeExceptionsFileErr.code === 'ENOENT') { // file doesn't exist, see if we can create it
          try {
            const exceptionHandle = await fsPromises.open(msg.exceptionFile, 'w');
            await exceptionHandle.close()
          } catch (createErr) { // can't open or create output file for writing, send CopyError 
            connection.sendCopyError(msg.exceptionFile, 0, '', "Unable to open or create exception file for writing")
            return
          }
        } else { // file exists but we can't open, likely permissions issue
          connection.sendCopyError(msg.rejectFile, 0, '', "Exception file exists but could not be opened for writing")
          return
        }
      }
    }
    connection.sendVerifiedFiles(msg); // All files are verified
  }
     
  handleLoadFile(msg, connection) {
    connection.sendCopyDataFile(msg)
  }

  handleWriteFile(msg, connection) {
    if (msg.fileName.length === 0) { //using returnrejected, fileContents is an array of row numbers, not a string
      this._result._setRejectedRows(msg.fileContents)
    } else { // future enhancement, move file IO to util
      fs.appendFile(msg.fileName, msg.fileContents, (err) => {
        if (err) {
          console.error('Error writing to file:', err);
        }
      });
    }
  }

  // eslint-disable-next-line no-unused-vars
  handleCopyDoneResponse(msg, connection) {
    // noop
  }
}

module.exports = Query
