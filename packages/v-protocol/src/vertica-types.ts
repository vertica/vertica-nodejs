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

export enum VerticaType {
  Boolean = 5,
  Integer = 6,
  Float = 7,
  Char = 8,
  Varchar = 9,
  Varbinary = 17,
  LongVarchar = 115,
  LongVarbinary = 116,
  Binary = 117,
  Numeric = 16,
  IntervalYear = 114,
  IntervalYearToMonth = 114,
  IntervalMonth = 114,
  IntervalDay = 14,
  IntervalDayToHour = 14,
  IntervalDayToMinute = 14,
  IntervalDayToSecond = 14,
  IntervalHour = 14,
  IntervalHourToMinute = 14,
  IntervalHourToSecond = 14,
  IntervalMinute = 14,
  IntervalMinuteToSecond = 14,
  IntervalSecond = 14,
  Date = 10,
  Time = 11,
  TimeTz = 15,
  Timestamp = 12,
  TimestampTz = 13,
  Uuid = 20,
  Row = 300,
  Array = 301,
  Map = 302
}
