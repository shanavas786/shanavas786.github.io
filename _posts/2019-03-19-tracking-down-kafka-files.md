---
layout: post
title:  "Kafka Streams: Tracking down Too many open files"
date:   2019-03-19
description: "Kafka Streams: Tracking down Too many open files"
categories: kafka
excerpt:
  Tracking down the root cause of Kafka process being stalled after opening too many
  files that exceeds configured ulimit

tags:
  - kafka
  - kafka-streams
---

### [](#intro) Apache Kafka and Kafka Streams
[Apache Kafka](https://kafka.apache.org/) is a distributed event streaming
platform capable of handling huge volume of data. Kafka Streams is a client
library for building applications and microservices for processing data stored
in kafka. Its offers APIs to perform variety of operations such as aggregations
and joins on the event stream.

### [](#data-storage) Data Storage in kafka
Kafka relies heavily on the filesystem for storing and caching messages.
Kafka stores data in ordered, append only sequence of messages called partitions.
partitions are again split to smaller files called segments. Retention policy
configurations determines how much or how long data should be retained in Kafka.
On disk, a partition is a directory and each segment is an index file and a log file.


### [](#too-many-files) Too many files
Kafka opens many files at the same time. Quite often the number of files kept
open by kafka process exceeds the default setting of 1024 for the maximum number
of open files on most Unix-like systems. This causes kafka process and inturn
stream processes to get stalled.

### [](#tracking) Tracking openfiles
We run a few kafka-stream processes in a server. We experienced
`java.io.IOException: Too many open files` exception even after reducing the
retention period of kafka topics to 30 minutes and increasing `ulimit` to 4096.

The first step was to install a cronjob to capture the files opened by kafka.

```bash
*/5 * * * * ls -l /proc/<pid of kafka>/fd > <outdir>/$(date +\%s)
```
This job captures the files opened by kafka every and writes to file. The output
file is named after system's timestamp which indicates the moment it was
captured at.

Here is a part of captured file.
```
lrwx------ 1 kafka kafka 64 Mar 15 01:43 132 -> anon_inode:[eventpoll]
lrwx------ 1 kafka kafka 64 Mar 15 01:43 133 -> socket:[21350]
lrwx------ 1 kafka kafka 64 Mar 15 01:43 134 -> /tmp/kafka-logs/topic1-0/00000000000000083570.log
lrwx------ 1 kafka kafka 64 Mar 15 01:43 135 -> /tmp/kafka-logs/topic2-0/00000000000001006936.log
lrwx------ 1 kafka kafka 64 Mar 15 01:43 136 -> /tmp/kafka-logs/topic3-0/00000000000000399536.log
lrwx------ 1 kafka kafka 64 Mar 15 01:43 137 -> /tmp/kafka-logs/topic2-0/00000000000000794994.log
lr-x------ 1 kafka kafka 64 Mar 15 01:43 138 -> pipe:[21355]
l-wx------ 1 kafka kafka 64 Mar 15 01:43 139 -> pipe:[21355]
lr-x------ 1 kafka kafka 64 Mar 15 01:43 14 -> /usr/lib/jvm/java-8-openjdk-amd64/jre/lib/ext/cldrdata.jar
lrwx------ 1 kafka kafka 64 Mar 15 01:43 140 -> anon_inode:[eventpoll]
```

#### [](#summarize-visualize) Summarizing and Visualizing the trend
Next step was to summarize each file to track the number of open files per topic.
A couple of lines of bash did it.

```bash
for topic in "topic-1" "topic-2" "topic-3"; do
    count=$(sed 's/.*\-> //g' ${infile} | grep \\.log | grep -c ${topic})
    printf "%-5s ${topic}\n" ${count} >> ${infile}.summary
done
```

This gave the following result.

```
249   topic1
180   topic2
50    topic3
```

Checking random summary files captured for a whole day didn't give much insight.
We scribbled a python program to collect the number of open files for each topic
from the summary files and plot it against the timestamp.

{% include figure.html
    src="graph.png"
    title="Plot of topic vs no. of open files"
    caption="Plot of topic vs no. of open files"
%}

The result was interesting. Despite of configured retention period, the number of
files opened for an internal topic was ever increasing.

### [](#back-to-kafka) Back to Kafka
Kafka creates internal changelog topics to store data related to aggegation
operations. It was one such topic that opens too many files.

Kafka provides a bash script namely `kafka-configs.sh` to handle configurations.
Checking configurations of that changelog topic revealed that the retention
period for that topic is different from the configured value.

```bash
$: bin/kafka-configs.sh --entity-type topics --entity-name \
    result-store-changelog --zookeeper localhost:2181 --describe
Configs for topic 'result-store-changelog' are retention.ms=172800000,cleanup.policy=compact,delete
```

Inspecting the kafka logs also gave the same result.
```
INFO Created log for partition result-store-changelog-0 in /tmp/kafka-logs with
properties {compression.type -> producer, message.format.version -> 1.1-IV0,
retention.bytes -> -1, delete.retention.ms -> 86400000,
segment.ms -> 604800000, segment.bytes -> 1073741824, retention.ms -> 172800000,
message.timestamp.difference.max.ms -> 9223372036854775807,
flush.messages -> 9223372036854775807}. (kafka.log.LogManager)
```

Kafka documentation explains this behavior
[here](https://kafka.apache.org/21/documentation/streams/developer-guide/manage-topics.html)

### [](#solutions) Solutions
As mentioned in the above kafka documentation, configurations for internals
topics can be overridden by passing configs to `KafkaStreams` constructor.

```java
Properties config = new Properties();
config.put(StreamsConfig.APPLICATION_ID_CONFIG, "myapp");
config.put(StreamsConfig.topicPrefix(TopicConfig.SEGMENT_MS_CONFIG), 100);
KafkaStreams streams = new KafkaStreams(topology, config);
```
Or setting retention and grace periods of `TimeWindows` when creating
aggregation windows.
```java
  stream.windowedBy(
    TimeWindows.of(Duration.ofSeconds(windowSizeSec))
      .grace(Duration.ofSeconds(windowGraceSec))
  ).aggregate(...)
```

### [](#refer) References
  - [https://thehoard.blog/how-kafkas-storage-internals-work-3a29b02e026](https://thehoard.blog/how-kafkas-storage-internals-work-3a29b02e026)
  - [https://www.cloudera.com/documentation/kafka/2-2-x/topics/kafka_performance.html](https://www.cloudera.com/documentation/kafka/2-2-x/topics/kafka_performance.html)
