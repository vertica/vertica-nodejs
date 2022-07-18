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

// Parser Combinators

// pair the result of two parsers
function pair(parser1, parser2) {
  return input => {
    var [nextInput, res1] = parser1(input)
    var [finalInput, res2] = parser2(nextInput)
    return [finalInput, [res1, res2]]
  }
}

// helper function for right function
function map(parser, fn) {
  return input => {
    var [nextInput, res] = parser(input)
    return [nextInput, fn(res)]
  }
}

// take result of right parser
function right(parser1, parser2) {
  return map(pair(parser1, parser2), t => t[1])
}

// try to parse input and if it fails, return null result
function zeroOrOne(parser) {
  return input => {
    try {
      return parser(input)
    } catch(err) {
      return [input, null]
    }
  }
}

// tries the first parser and if it fails, tries the second. If both fail, it throws an error.
function either(parser1, parser2) {
  return input => {
    try {
      return parser1(input)
    } catch(e1) {
      try {
        return parser2(input)
      } catch(e2) {
        throw new Error("Unable to parse input with either parser provided:\nparser 1 error: (" + e1 + ")\nparser 2 error: (" + e2 + ")")
      }
    }
  }
}


// Parsers

// Parse an IPv4 address by checking if the input contains a . in it
function ipv4Address(input) {
  var result = ""  
    
  for (let c of input) {
    if (c === ':') {
      break
    }
    result += c
  }
    
  if (result.includes('.')) {
    return [input.substring(result.length), result]
  } else {
    throw new Error("Unable to parse " + input + " as an IPv4 address")
  }
}

// Parse an IPv6 address by checking if it's wrapped by [] or contains multiple colons
function ipv6Address(input) {
  var result = ""
  if (input.startsWith('[')) {
    // use substring to cut off the bracket first
    for (let c of input.substring(1)) {
      if (c === ']') {
        break
      }
      result += c
    }
    // add one to cut off the end bracket from the next input
    return [input.substring(result.length + 2), result]
  }
  
  var colonCounter = 0
  for (let c of input) {
    if (c === ':') {
      colonCounter++
    }

    result += c
  }

  if (colonCounter > 1) {
    return [input.substring(result.length), result]
  }

  throw new Error("Unable to parse " + input + " as an IPv6 address")
}

// Parses a host name
function host(input) {
  var hostname = ""
    
  for (let c of input) {
    if (c === ':') {
      break
    }
    hostname += c
  }
   
  return [input.substring(hostname.length), hostname]
}

// Parses a port number
function port(input) {
  return [input.substring(input.length), input]
}

// Parser builder that returns a parser that matches a given string literal
function matchLiteral(expected) {
  return input => {
    var match = input.substring(0, expected.length)
    if (match === expected) {
      return [input.substring(match.length), null]
    } else {
      throw new Error("Failed to match " + expected + " with " + input)
    }
  }
}

// Parses a host-port pair
function entry(input) {
  return pair(either(either(ipv4Address, ipv6Address), host), zeroOrOne(right(matchLiteral(":"), port)))(input)
}

// Parses a full list of backup server nodes
function backupServerNodes(input) {
  return input.split(',').filter(s => s.length > 0).map(i => entry(i)[1])
}

module.exports = {
  ipv4Address,
  ipv6Address,
  host,
  port,
  matchLiteral,
  entry,
  backupServerNodes
}