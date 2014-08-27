'use strict';

var _         = require('lodash');
var util      = require('util');
var Transform = require('stream').Transform;

function LogstashTransform(tags) {
  this.tags = tags;
  Transform.apply(this);
}

util.inherits(LogstashTransform, Transform);

LogstashTransform.prototype._transform = function(data, encoding, done) {
  data = data.toString();

  if (this.lastLine) {
    data = this.lastLine + data;
  }

  data = this.stripColors(data);

  var lines = data.split('\n');
  this.lastLine = lines.pop();
  this.processEntries(lines, done);
};

LogstashTransform.prototype._flush = function(done) {
  var self = this;

  function finish() {
    self.lastLine = null;
    done();
  }

  if (this.lastLine) {
    this.processEntries([this.lastLine], function() { finish(); });
  }

  finish();
};

LogstashTransform.prototype.stripColors = function(data) {
  data = data.replace(/\u001b\[[0-9;]*[mK]/g, '');
  data = data.replace(/\r/g, '');
  return data;
};

LogstashTransform.prototype.parseDatetime = function(line) {
  var parts = line.split(']', 2);
  var index = parts[0].indexOf('[');
  return parts[0].substring(index + 1).replace(/\s+/, ' ');
};

LogstashTransform.prototype.parseMessage = function(line) {
  var index = line.indexOf(']');
  return line.substring(index + 2);
};

LogstashTransform.prototype.processEntries = function(lines, done) {
  var self = this;

  lines.forEach(function(line) {
    var item = {
      '@message': self.parseMessage(line),
      'datetime': self.parseDatetime(line),
      'type': 'log',
    };
    item = _.extend(item, self.tags);
    self.push(JSON.stringify(item) + '\n');
  });

  done();
};

module.exports = LogstashTransform;
