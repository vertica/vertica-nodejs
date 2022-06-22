// Copyright (c) 2022 Micro Focus or one of its affiliates.
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
const expect = require('expect.js')
const _ = require('lodash')

const describe = require('mocha').describe
const it = require('mocha').it

const Pool = require('../')

describe('pool', function () {
  describe('with callbacks', function () {
    it('works totally unconfigured', function (done) {
      const pool = new Pool()
      pool.connect(function (err, client, release) {
        if (err) return done(err)
        client.query('SELECT NOW()', function (err, res) {
          release()
          if (err) return done(err)
          expect(res.rows).to.have.length(1)
          pool.end(done)
        })
      })
    })

    it('passes props to clients', function (done) {
      const pool = new Pool({ binary: true })
      pool.connect(function (err, client, release) {
        release()
        if (err) return done(err)
        expect(client.binary).to.eql(true)
        pool.end(done)
      })
    })

    it('can run a query with a callback without parameters', function (done) {
      const pool = new Pool()
      pool.query('SELECT 1 as num', function (err, res) {
        expect(res.rows[0]).to.eql({ num: 1 })
        pool.end(function () {
          done(err)
        })
      })
    })

    it('can run a query with a callback', function (done) {
      const pool = new Pool()
      pool.query('SELECT ?::varchar as name', ['brianc'], function (err, res) {
        expect(res.rows[0]).to.eql({ name: 'brianc' })
        pool.end(function () {
          done(err)
        })
      })
    })

    it('passes connection errors to callback', function (done) {
      const pool = new Pool({ port: 53922 })
      pool.query('SELECT ?::varchar as name', ['brianc'], function (err, res) {
        expect(res).to.be(undefined)
        expect(err).to.be.an(Error)
        // a connection error should not polute the pool with a dead client
        expect(pool.totalCount).to.equal(0)
        pool.end(function (err) {
          done(err)
        })
      })
    })

    it('does not pass client to error callback', function (done) {
      const pool = new Pool({ port: 58242 })
      pool.connect(function (err, client, release) {
        expect(err).to.be.an(Error)
        expect(client).to.be(undefined)
        expect(release).to.be.a(Function)
        pool.end(done)
      })
    })

    it('removes client if it errors in background', function (done) {
      const pool = new Pool()
      pool.connect(function (err, client, release) {
        release()
        if (err) return done(err)
        client.testString = 'foo'
        setTimeout(function () {
          client.emit('error', new Error('on purpose'))
        }, 10)
      })
      pool.on('error', function (err) {
        expect(err.message).to.be('on purpose')
        expect(err.client).to.not.be(undefined)
        expect(err.client.testString).to.be('foo')
        err.client.connection.stream.on('end', function () {
          pool.end(done)
        })
      })
    })

    it('should not change given options', function (done) {
      const options = { max: 10 }
      const pool = new Pool(options)
      pool.connect(function (err, client, release) {
        release()
        if (err) return done(err)
        expect(options).to.eql({ max: 10 })
        pool.end(done)
      })
    })

    it('does not create promises when connecting', function (done) {
      const pool = new Pool()
      const returnValue = pool.connect(function (err, client, release) {
        release()
        if (err) return done(err)
        pool.end(done)
      })
      expect(returnValue).to.be(undefined)
    })

    it('does not create promises when querying', function (done) {
      const pool = new Pool()
      const returnValue = pool.query('SELECT 1 as num', function (err) {
        pool.end(function () {
          done(err)
        })
      })
      expect(returnValue).to.be(undefined)
    })

    it('does not create promises when ending', function (done) {
      const pool = new Pool()
      const returnValue = pool.end(done)
      expect(returnValue).to.be(undefined)
    })

    it('never calls callback syncronously', function (done) {
      const pool = new Pool()
      pool.connect((err, client) => {
        if (err) throw err
        client.release()
        setImmediate(() => {
          let called = false
          pool.connect((err, client) => {
            if (err) throw err
            called = true
            client.release()
            setImmediate(() => {
              pool.end(done)
            })
          })
          expect(called).to.equal(false)
        })
      })
    })
  })

  describe('with promises', function () {
    it('connects, queries, and disconnects', function () {
      const pool = new Pool()
      return pool.connect().then(function (client) {
        return client.query('select ?::varchar as name', ['hi']).then(function (res) {
          expect(res.rows).to.eql([{ name: 'hi' }])
          client.release()
          return pool.end()
        })
      })
    })

    it('executes a query directly', () => {
      const pool = new Pool()
      return pool.query('SELECT ?::varchar as name', ['hi']).then((res) => {
        expect(res.rows).to.have.length(1)
        expect(res.rows[0].name).to.equal('hi')
        return pool.end()
      })
    })

    it('properly pools clients', function () {
      const pool = new Pool({ poolSize: 9 })
      const promises = _.times(30, function () {
        return pool.connect().then(function (client) {
          return client.query('select ?::varchar as name', ['hi']).then(function (res) {
            client.release()
            return res
          })
        })
      })
      return Promise.all(promises).then(function (res) {
        expect(res).to.have.length(30)
        expect(pool.totalCount).to.be(9)
        return pool.end()
      })
    })

    it('supports just running queries', function () {
      const pool = new Pool({ poolSize: 9 })
      const text = 'select ?::varchar as name'
      const values = ['hi']
      const query = { text: text, values: values }
      const promises = _.times(30, () => pool.query(query))
      return Promise.all(promises).then(function (queries) {
        expect(queries).to.have.length(30)
        return pool.end()
      })
    })

    it('recovers from query errors', function () {
      const pool = new Pool()

      const errors = []
      const promises = _.times(30, () => {
        return pool.query('SELECT asldkfjasldkf').catch(function (e) {
          errors.push(e)
        })
      })
      return Promise.all(promises).then(() => {
        expect(errors).to.have.length(30)
        expect(pool.totalCount).to.equal(0)
        expect(pool.idleCount).to.equal(0)
        return pool.query('SELECT ?::varchar as name', ['hi']).then(function (res) {
          expect(res.rows).to.eql([{ name: 'hi' }])
          return pool.end()
        })
      })
    })
  })
})
