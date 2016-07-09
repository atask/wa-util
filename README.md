wa-snap
=======

A basic CLI util for dumping daily data from a WhatsApp database.
Requires access to the _msgstore.db_ and _wa.db_ files.
For media listing only _msgstore.db_ is necessary.

## Install

```
$ npm install --global wa-snap
```

## Usage

```
$ wa-snap --help

  Usage
    wa-snap <options>

  Options
    -h	--help		this help
    -d	--day		target date
    -w	--wa		wa.db path
    -m	--msgstore	msgstore.db path
    -e	--media		get media paths only

  Example
    wa-snap -d 2016-01-20 -w wa.db -m msgstore.db
    wa-snap --media -d 2016-01-20 -m msgstore.db
```

## Licence

ISC © ᴉuᴉɥɔsɐʇ uɐllɐ
