/**
 * @license
 * Copyright (c) 2022 Micro Focus or one of its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

// file for microbenchmarking

import { Writer } from './buffer-writer'
import { serialize } from './index'
import { BufferReader } from './buffer-reader'

const LOOPS = 1000
let count = 0
let start = Date.now()
const writer = new Writer()

const reader = new BufferReader()
const buffer = Buffer.from([33, 33, 33, 33, 33, 33, 33, 0])

const run = () => {
  if (count > LOOPS) {
    console.log(Date.now() - start)
    return
  }
  count++
  for (let i = 0; i < LOOPS; i++) {
    reader.setBuffer(0, buffer)
    reader.cstring()
  }
  setImmediate(run)
}

run()
