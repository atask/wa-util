wa-util
=======

Some basic CLI utilities for dumping/viewing daily data from a
WhatsApp database.
For a correct usage, it requires access to these WhatsApp resources:

* _msgstore.db_
* _wa.db_
* _Media_ folder
* _Profile Pictures_ folder
* _Avatars_ folder

## Install

```
$ npm install --global wa-util
```

## Usage

```console
$ wa-snap --help

  A basic CLI utility for snapshotting daily data from a WhatsApp database.

  Version
    0.4.1

  Usage
    wa-snap <options>

  Options
    -h	--help		this help
    -d	--day		target date
    -w	--wa		directory path containing WhatsApp related files
    -o	--out		output directory path

  Example
    wa-snap -d 2016-01-20 -w in -o out
```

```console
$ wa-dump --help

  A basic CLI utility for dumping daily data from a WhatsApp database.

  Version
    0.4.1

  Usage
    wa-dump <options>

  Options
    -h	--help		this help
    -d	--day		target date
    -w	--wa		directory path containing msgstore.db and wa.db files

  Example
    wa-dump -d 2016-01-20 -w in
```

```console
$ wa-media --help

  List paths of media exchanged in a specific day of a WhatsApp database.

  Version
    0.4.1

  Usage
    wa-media <options>

  Options
    -h	--help		this help
    -d	--day		target date
    -w	--wa		directory path containing WhatsApp related files

  Example
    wa-media -d 2016-01-20 -w in
```

## Licence

ISC © ᴉuᴉɥɔsɐʇ uɐllɐ
