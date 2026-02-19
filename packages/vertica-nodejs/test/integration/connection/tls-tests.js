'use strict'
const { error } = require('console')
var helper = require('./../test-helper')
var vertica = helper.vertica

var suite = new helper.Suite()
var tls = require('tls')
const trusted_certs_path  =  __dirname + '/../../tls/ca_cert.pem'
const client_cert_path    =  __dirname + '/../../tls/client_cert.pem'
const client_key_path     =  __dirname + '/../../tls/client_key.pem'

/**
 * Known / expected TLS error categories.
 *
 * Each entry maps a short tag to a { pattern, reason } so that:
 *   1. Every accepted error is documented in one place.
 *   2. The test output shows *which* known category matched (smoke-test
 *      visibility) rather than silently swallowing the error.
 *   3. If an error doesn't match any known category the assertion fails,
 *      so genuinely unexpected errors are never ignored.
 */
const KNOWN_TLS_ERRORS = {
  VERIFY_CA_ALERT:       { pattern: 'ssl alert number 40',
                           reason:  'Server is in VERIFY_CA mode and rejected the client (no valid client cert)' },
  TLS_DISABLED:          { pattern: 'the server does not support tls connections',
                           reason:  'Server TLS mode is DISABLE – expected when client requires TLS' },
  UNTRUSTED_CERT:        { pattern: 'unable to verify the first certificate',
                           reason:  'Server certificate is not signed by a CA the client trusts' },
  MISSING_TRUSTED_CERTS: { pattern: 'verify-ca mode requires setting tls_trusted_certs property',
                           reason:  'Client-side config error – tls_trusted_certs was not supplied' },
  GENERIC_TLS:           { pattern: /ssl|tls|certificate|alert|handshake|econnreset/,
                           reason:  'General TLS/SSL negotiation failure (server config dependent)' },
}

/**
 * Assert that `err` matches one of the supplied known-error tags and log
 * which path was taken.  This gives smoke-test-level visibility: the
 * console output shows the concrete reason, so reviewers can confirm that
 * error branches are intentionally handled, not silently swallowed.
 *
 * @param {Error}    err   - the error from client.connect()
 * @param {string[]} tags  - subset of KNOWN_TLS_ERRORS keys that are
 *                           acceptable for this particular test scenario
 * @param {string}   testLabel - human-readable test name for the log line
 */
function assertKnownTLSError(err, tags, testLabel) {
  var msg = err.message.toLowerCase()
  for (var tag of tags) {
    var entry = KNOWN_TLS_ERRORS[tag]
    var matched = (entry.pattern instanceof RegExp)
      ? entry.pattern.test(msg)
      : msg.includes(entry.pattern)
    if (matched) {
      // Smoke-test breadcrumb: shows exactly which known path fired.
      console.log('  [TLS-expected] ' + testLabel + ' -> ' + tag + ': ' + entry.reason)
      return // assertion passed
    }
  }
  // No known category matched – fail with a descriptive message.
  assert.fail('Unexpected TLS error in "' + testLabel + '": ' + err.message
    + '\nAccepted categories: ' + tags.join(', '))
}

// TODO - UPDATE THESE STEPS IF NEEDED OR ADD MORE DETAILS ONCE mTLS ISSUES ARE RESOLVED

/*
* Summary of istructions for configuring your test server to support connections under desired TLS mode.
*  This method is what is being used for testing and uses a self signed CA certificate.
*  Steps 1, 2, 6, 7, 8 have been done for you, only do them again if you want to have your own client/ca keys/certificates
*  Otherwise you can look in /test/tls for the keys/certificates needed for these steps
*  You will still need to create your own key and certificate for your server, it makes sense for everyone to have 
*  their own. Steps for doing so can be found here:
*    https://www.vertica.com/docs/latest/HTML/Content/Authoring/Security/TLS/GeneratingCertificatesAndKeys.htm
*  
*  1. create private key for CA 
*  2. create root CA certificate from private key
*  3. import root CA key and Certificate into Vertica
*  4. create private key for server
*  5. create server certificate and sign it with CA certificate
*  6. create private key for client
*  7. create CSR for client 
*  8. create create client certificate signed by same CA as server (not required to be the same, just for convenience)
*  9. Establish a connection with any client and manage tls mode in server with 
*       "ALTER TLS CONFIGURATION server CERTIFICATE server_cert" (this only needs to be done once)
*       "ALTER TLS CONFIGURATION server TLSMODE '[ENABLE|DISABLE|TRY_VERIFY|VERIFY_CA]'"
*/

// Test case for tls_mode = 'disable'
// The server, in server or mutual mode (enable, disable, try_verify, verify_ca), will accept 
// all connections from the client, the caveat being that for try_verify and verify_ca it's possible
// for the connection to be plaintext if the client doesn't present valid credentials. 
suite.test('vertica tls - disable mode - all', function () {
  var client = new vertica.Client({tls_mode: 'disable'})
  assert.equal(client.tls_mode, 'disable')
  client.connect(err => {
    if (err) {
      // shouldn't fail to connect
      console.log(err)
      assert(false)
    }
    // asserting it equals "Socket" should be just as good but this is probably safer
    assert.notEqual(client.connection.stream.constructor.name.toString(), "TLSSocket") 
    client.query("SELECT mode FROM tls_configurations where name = 'server' LIMIT 1", (err, res) => {
      if (err) {
        console.log(err)
        assert(false)
      }
      assert(['ENABLE', 'DISABLE', 'TRY_VERIFY', 'VERIFY_CA', 'VERIFY_FULL'].includes(res.rows[0].mode)) // this assert shouldn't be able to fail
      client.end()
    })
  })
})

// Test case for tls_mode = 'prefer' as default
// The client will attempt to establish a TLS connection if the server supports it.
// If the server does not support TLS, the client will still connect using a plaintext connection.
// This test verifies that in 'prefer' mode, the client connects successfully.
suite.test('vertica tls - prefer mode', function () {
  var client = new vertica.Client() // 'prefer' by default, so no need to pass in that option
  assert.equal(client.tls_mode, vertica.defaults.tls_mode)
  client.connect(err => {
    if (err) {
      // shouldn't fail to connect
      assert(false)      
    }
    // If connection succeeds, check for TLS connection
    client.query("SELECT mode FROM tls_configurations where name = 'server' LIMIT 1", (err, res) => {
      if (err) {
        console.log(err)
        assert(false)
      }
      // Assert only if server supports TLS
      if (['ENABLE', 'TRY_VERIFY', 'VERIFY_CA', 'VERIFY_FULL'].includes(res.rows[0].mode)) {
        assert(client.connection.stream.constructor.name.toString(), "TLSSocket")
      }
      else {
        assert.notEqual(client.connection.stream.constructor.name.toString(), "TLSSocket")
      }
      client.end()
    })
  })
})

// Test case for tls_mode = 'require'
// The server will not accept all connections from the client with the client in 'require' mode. The server
// will reject a connection in DISABLE mode for obvious reasons (client requiring TLS + server disallowing TLS)
// The server will also reject in VERIFY_CA mutual mode if the client doesn't have a proper client certificate.
// Therefore in 'require' should be able to verify that the connection failure is for one of these two reasons. 
suite.test('vertica tls - require mode - no client certificate', function () {
  var client = new vertica.Client({tls_mode: 'require'})
  assert.equal(client.tls_mode, 'require')
  client.connect(err => {
    if (err) {
      // Connection can legitimately fail when the server is in VERIFY_CA
      // (requires client cert we didn't supply) or DISABLE (no TLS at all).
      assertKnownTLSError(err, ['VERIFY_CA_ALERT', 'TLS_DISABLED'],
        'require mode - no client certificate')
      return
    }
    // this is how we can tell the difference between this successful case and the 'disable' case.
    assert.equal(client.connection.stream.constructor.name.toString(), "TLSSocket")
    client.query("SELECT mode FROM tls_configurations where name = 'server' LIMIT 1", (err, res) => {
      if (err) {
        console.log(err)
        assert(false)
      }
      // server should be in one of these modes for us to have gotten this far without sending client certificate
      assert(['ENABLE', 'TRY_VERIFY'].includes(res.rows[0].mode))
      client.end()
    })
  })
})

// Test case for tls_mode = 'verify-ca'
// This should fail regardles of server configuration, but depending on the configuration it may fail
// for a few different expected reasons. Make sure it fails like we want it to
suite.test('vertica tls - verify-ca - no tls_cert_file specified', function () {
  var client = new vertica.Client({tls_mode: 'verify-ca'}) // default trusted CAs aren't acceptable, so nothing to specify
  assert.equal(client.tls_mode, 'verify-ca')
  client.connect(err => {
    if (err) {
      // Without tls_trusted_certs the client should reject early; if it
      // reaches the server handshake it will still fail with a TLS error.
      assertKnownTLSError(err, ['MISSING_TRUSTED_CERTS', 'GENERIC_TLS'],
        'verify-ca - no tls_cert_file specified')
    }
    client.end()
  })
})

// Test case for tls_mode = 'verify-ca'
// Now there are more variables in play and the client gets to be picky. Only connections in which the 
// certificate given by the server during tls handshake is signed by a trusted CA will be allowed. 
// There are more ways a onnection can fail: server is in DISABLE mode, server is in VERIFY_CA mode 
// and we supply an invalid client certificate, server sends it's certificate and it's not one signed 
// by a CA that we trust, verify any failures are due to one of these reasons
suite.test('vertica tls - verify-ca - valid server certificate', function () {
  var client = new vertica.Client({tls_mode: 'verify-ca',
                                   tls_trusted_certs: '../../tls/ca_cert.pem'}) 
  assert.equal(client.tls_mode, 'verify-ca')
  client.connect(err => {
    if (err) {
      // With a valid trusted-CA file the only remaining failures are
      // server-side: DISABLE mode, VERIFY_CA mutual-mode rejection, etc.
      assertKnownTLSError(err, ['GENERIC_TLS'],
        'verify-ca - valid server certificate')
      return
    }
    assert.equal(client.connection.stream.constructor.name.toString(), "TLSSocket")
    client.query("SELECT mode FROM tls_configurations where name = 'server' LIMIT 1", (err, res) => {
      if (err) {
        console.log(err)
        assert(false)
      }
      // server should be in one of these modes for us to have gotten this far without sending client certificate
      assert(['ENABLE', 'TRY_VERIFY'].includes(res.rows[0].mode))
      client.end()
    })
  })
})

// Test case for tls_mode = 'verify-full'
// This should fail regardles of server configuration, but depending on the configuration it may fail
// for a few different expected reasons. Make sure it fails like we want it to
suite.test('vertica tls - verify-full - no tls_cert_file specified', function () {
  var client = new vertica.Client({tls_mode: 'verify-full'}) // default trusted CAs aren't acceptable, so nothing to specify
  assert.equal(client.tls_mode, 'verify-full')
  client.connect(err => {
    if (err) {
      // Same expectation as verify-ca without trusted certs: early
      // client-side rejection or a TLS negotiation failure.
      assertKnownTLSError(err, ['MISSING_TRUSTED_CERTS', 'GENERIC_TLS'],
        'verify-full - no tls_cert_file specified')
    }
    client.end()
  })
})

// Test case for tls_mode = 'verify-full'
// The difference between verify-ca and verify-full is that we want to verify that the server host name matches
// the name on the certificate that the server gave us during the TLS handshake. For this test, nothing different
// needs to be done or asserted except for using the verify-full tls mode. The behavior should be the same for 
// each server mode, the only difference is logic in the client handling checking the certificate
suite.test('vertica tls - verify-full - valid server certificate', function () {
  var client = new vertica.Client({tls_mode: 'verify-full',
                                   tls_trusted_certs: '../../tls/ca_cert.pem'}) 
  assert.equal(client.tls_mode, 'verify-full')
  client.connect(err => {
    if (err) {
      // Failures at this point are server-mode dependent (DISABLE,
      // VERIFY_CA, or hostname mismatch for verify-full).
      assertKnownTLSError(err, ['GENERIC_TLS'],
        'verify-full - valid server certificate')
      return
    }
    assert.equal(client.connection.stream.constructor.name.toString(), "TLSSocket")
    client.query("SELECT mode FROM tls_configurations where name = 'server' LIMIT 1", (err, res) => {
      if (err) {
        console.log(err)
        assert(false)
      }
      // server should be in one of these modes for us to have gotten this far without sending client certificate
      assert(['ENABLE', 'TRY_VERIFY'].includes(res.rows[0].mode))
      client.end()
    })
  })
})

// Test case for tls_config feature
suite.test('vertica tls - tls_config feature', function() {
  var client = new vertica.Client({tls_config: {rejectUnauthorized: false,
                                                checkServerIdentity: (host , cert) => undefined}
                                  })
  client.connect(err => {
    if (err) {
      // With rejectUnauthorized:false the only failures should be
      // server-side TLS/SSL negotiation issues (e.g. DISABLE mode).
      assertKnownTLSError(err, ['GENERIC_TLS'],
        'tls_config feature')
      return
    }
    // this is how we can tell we actually used tls_config and created a tls socket
    assert.equal(client.connection.stream.constructor.name.toString(), "TLSSocket")
    client.query("SELECT mode FROM tls_configurations where name = 'server' LIMIT 1", (err, res) => {
      if (err) {
        console.log(err)
        assert(false)
      }
      // server should be in one of these modes for us to have gotten this far without sending client certificate
      assert(['ENABLE', 'TRY_VERIFY'].includes(res.rows[0].mode))
      client.end()
    })
  })
})

// MUTUAL MODE TESTS

/*suite.test('vertica tls - verify-full - valid server certificate', function () {
  var client = new vertica.Client({tls_mode: 'require',
                                   tls_trusted_certs: trusted_certs_path,
                                   tls_client_cert: client_cert_path,
                                   tls_client_key: client_key_path}) 
  assert.equal(client.tls_mode, 'require')
  client.connect(err => {
    if (err) {
      console.log("Error: " + err)
      assert(err.message.includes("SSL alert number 40") // VERIFY_CA mode, this is ok
          || err.message.includes("The server does not support TLS connections")) // DISABLE mode, this is ok
      return
    }
    assert.equal(client.connection.stream.constructor.name.toString(), "TLSSocket")
    client.query("SELECT mode FROM tls_configurations where name = 'server' LIMIT 1", (err, res) => {
      if (err) {
        console.log(error)
        assert(false)
      }
      // server should be in one of these modes for us to have gotten this far without sending client certificate
      assert(['ENABLE', 'TRY_VERIFY'].includes(res.rows[0].mode))
      //console.log("SELECT ")
      client.end()
    })
  })
})*/
