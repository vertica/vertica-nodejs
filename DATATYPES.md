# Data Types

The result set metadata currently just displays the Type ID for each column as an integer, which is not very understandable without context from Vertica's TYPES table. The following table shows how each integer ID maps to its corresponding Vertica data type. A convenience enum, VerticaType, is also provided under v-protocol/vertica-types.ts, which is documented here. Rather than checking the integer ID for a given type, it should be possible to check against the VerticaType enum member instead.

|      Type ID      |            Type Name             |         VerticaType Enum Member         |
|-------------------|----------------------------------|-----------------------------------------|
|                 5 | Boolean                          | Boolean                                 |
|                 6 | Integer                          | Integer                                 |
|                 7 | Float                            | Float                                   |
|                 8 | Char                             | Char                                    |
|                 9 | Varchar                          | Varchar                                 |
|                17 | Varbinary                        | Varbinary                               |
|               115 | Long Varchar                     | LongVarchar                             |
|               116 | Long Varbinary                   | LongVarbinary                           |
|               117 | Binary                           | Binary                                  |
|                16 | Numeric                          | Numeric                                 |
|               114 | Interval Year                    | IntervalYear                            |
|               114 | Interval Year to Month           | IntervalYearToMonth                     |
|               114 | Interval Month                   | IntervalMonth                           |
|                14 | Interval Day                     | IntervalDay                             |
|                14 | Interval Day to Hour             | IntervalDayToHour                       |
|                14 | Interval Day to Minute           | IntervalDayToMinute                     |
|                14 | Interval Day to Second           | IntervalDayToSecond                     |
|                14 | Interval Hour                    | IntervalHour                            |
|                14 | Interval Hour to Minute          | IntervalHourToMinute                    |
|                14 | Interval Hour to Second          | IntervalHourToSecond                    |
|                14 | Interval Minute                  | IntervalMinute                          |
|                14 | Interval Minute to Second        | IntervalMinuteToSecond                  |
|                14 | Interval Second                  | IntervalSecond                          |
|                10 | Date                             | Date                                    |
|                11 | Time                             | Time                                    |
|                15 | TimeTz                           | TimeTz                                  |
|                12 | Timestamp                        | Timestamp                               |
|                13 | TimestampTz                      | TimestampTz                             |
|               300 | Row                              | Row                                     |
|               301 | Array                            | Array                                   |
|               302 | Map                              | Map                                     |

## Data Type Parsing

Currently the client only supports type parsing for booleans, integers, and floats where integers and floats are both parsed as javascript numbers. Everything else is treated as a string in the result rows. 