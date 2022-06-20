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
|                20 | Uuid                             | Uuid                                    |
|              1505 | Array[Boolean]                   | ArrayBoolean                            |
|              1506 | Array[Int8]                      | ArrayInt8                               |
|              1507 | Array[Float8]                    | ArrayFloat8                             |
|              1508 | Array[Char]                      | ArrayChar                               |
|              1509 | Array[Varchar]                   | ArrayVarchar                            |
|              1517 | Array[Varbinary]                 | ArrayVarbinary                          |
|              1522 | Array[Binary]                    | ArrayBinary                             |
|              1516 | Array[Numeric]                   | ArrayNumeric                            |
|              1521 | Array[Interval Year]             | ArrayIntervalYear                       |
|              1521 | Array[Interval Year to Month]    | ArrayIntervalYearToMonth                |
|              1521 | Array[Interval Month]            | ArrayIntervalMonth                      |
|              1514 | Array[Interval Day]              | ArrayIntervalDay                        |
|              1514 | Array[Interval Day to Hour]      | ArrayIntervalDayToHour                  |
|              1514 | Array[Interval Day to Minute]    | ArrayIntervalDayToMinute                |
|              1514 | Array[Interval Day to Second]    | ArrayIntervalDayToSecond                |
|              1514 | Array[Interval Hour]             | ArrayIntervalHour                       |
|              1514 | Array[Interval Hour to Minute]   | ArrayIntervalHourToMinute               |
|              1514 | Array[Interval Hour to Second]   | ArrayIntervalHourToSecond               |
|              1514 | Array[Interval Minute]           | ArrayIntervalMinute                     |
|              1514 | Array[Interval Minute to Second] | ArrayIntervalMinuteToSecond             |
|              1514 | Array[Interval Second]           | ArrayIntervalSecond                     |
|              1510 | Array[Date]                      | ArrayDate                               |
|              1511 | Array[Time]                      | ArrayTime                               |
|              1515 | Array[TimeTz]                    | ArrayTimeTz                             |
|              1512 | Array[Timestamp]                 | ArrayTimestamp                          |
|              1513 | Array[TimestampTz]               | ArrayTimestampTz                        |
|              1520 | Array[Uuid]                      | ArrayUuid                               |
|              2705 | Set[Boolean]                     | SetBoolean                              |
|              2706 | Set[Int8]                        | SetInt8                                 |
|              2707 | Set[Float8]                      | SetFloat8                               |
|              2708 | Set[Char]                        | SetChar                                 |
|              2709 | Set[Varchar]                     | SetVarchar                              |
|              2717 | Set[Varbinary]                   | SetVarbinary                            |
|              2722 | Set[Binary]                      | SetBinary                               |
|              2716 | Set[Numeric]                     | SetNumeric                              |
|              2721 | Set[Interval Year]               | SetIntervalYear                         |
|              2721 | Set[Interval Year to Month]      | SetIntervalYearToMonth                  |
|              2721 | Set[Interval Month]              | SetIntervalMonth                        |
|              2714 | Set[Interval Day]                | SetIntervalDay                          |
|              2714 | Set[Interval Day to Hour]        | SetIntervalDayToHour                    |
|              2714 | Set[Interval Day to Minute]      | SetIntervalDayToMinute                  |
|              2714 | Set[Interval Day to Second]      | SetIntervalDayToSecond                  |
|              2714 | Set[Interval Hour]               | SetIntervalHour                         |
|              2714 | Set[Interval Hour to Minute]     | SetIntervalHourToMinute                 |
|              2714 | Set[Interval Hour to Second]     | SetIntervalHourToSecond                 |
|              2714 | Set[Interval Minute]             | SetIntervalMinute                       |
|              2714 | Set[Interval Minute to Second]   | SetIntervalMinuteToSecond               |
|              2714 | Set[Interval Second]             | SetIntervalSecond                       |
|              2710 | Set[Date]                        | SetDate                                 |
|              2711 | Set[Time]                        | SetTime                                 |
|              2715 | Set[TimeTz]                      | SetTimeTz                               |
|              2712 | Set[Timestamp]                   | SetTimestamp                            |
|              2713 | Set[TimestampTz]                 | SetTimestampTz                          |
|              2720 | Set[Uuid]                        | SetUuid                                 |
| 45035996273705276 | geometry                         | Geometry                                |
| 45035996273705278 | geography                        | Geography                               |
|               300 | Row                              | Row                                     |
|               301 | Array                            | Array                                   |
|               302 | Map                              | Map                                     |

