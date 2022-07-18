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

function host(input) {
  var hostname = ""
    
  for (let c of input) {
    if (c === ',' || c === ':') {
      break
    }
    hostname = hostname + c
  }
   
  return [input.substring(hostname.length), hostname]
}
  
function port(input) {
  var portEndIdx = input.indexOf(',')
  if (portEndIdx === -1) {
    return ["", input]
  }
  var portNum = input.substring(0, portEndIdx)
  if (portNum.length === 0) {
    portNum = null
  }
    
  return [input.substring(portEndIdx), portNum]
}
  
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
  
function pair(parser1, parser2) {
  return input => {
    var [nextInput, res1] = parser1(input)
    var [finalInput, res2] = parser2(nextInput)
    return [finalInput, [res1, res2]]
  }
}
  
function map(parser, fn) {
  return input => {
    var [nextInput, res] = parser(input)
    return [nextInput, fn(res)]
  }
}
  
function left(parser1, parser2) {
  return map(pair(parser1, parser2), t => t[0])
}
  
function right(parser1, parser2) {
  return map(pair(parser1, parser2), t => t[1])
}
  
function zeroOrOne(parser) {
  return input => {
    try {
      return parser(input)
    } catch(err) {
      return [input, null]
    }
  }
}
  
function zeroOrMore(parser) {
  return input => {
    var result = []
      
    var keepParsing = true
    var nextInput = input
    while (keepParsing) {
      try {
        var [nextInp, res] = parser(nextInput)
        if (nextInp.length === 0) {
          keepParsing = false
        }
        nextInput = nextInp
        result.push(res)
      } catch(err) {
        keepParsing = false
      }
    }
      
    return [nextInput, result]
  }
}
  
function entry(input) {
  return pair(host, zeroOrOne(right(matchLiteral(":"), port)))(input)
}
  
function backupServerNodes(input) {
  return zeroOrMore(left(entry, zeroOrOne(matchLiteral(","))))(input)
}

module.exports = {
  backupServerNodes
}