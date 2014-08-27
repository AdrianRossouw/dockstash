'use strict';

var _         = require('lodash');
var util      = require('util');
var Transform = require('stream').Transform;

function LogstashTransform(tags) {
  this.tags = tags;
  this.currentMessage = [];
  this.currentItem = {};
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

  lines.forEach(this.processLine.bind(this));

  done();
};

LogstashTransform.prototype._flush = function(done) {
  if (this.lastLine) {
    this.processLine(this.lastLine);
  }

  this.pushLast();

  this.lastLine = null;
  done();
};

LogstashTransform.prototype.pushLast = function() {
  if (_.isEmpty(this.currentMessage)) {
    return;
  }

  this.currentItem['@message'] = this.currentMessage.join('\n');
  this.push(JSON.stringify(this.currentItem) + '\n');
  this.currentMessage = [];
};

LogstashTransform.prototype.processLine = function(line) {
  var message = this.parseMessage(line);
  if (!message.match(/^\s/)) {
    this.pushLast();

    this.currentItem = {
      'datetime': this.parseDatetime(line),
      'type': 'log',
    };
    this.currentItem = _.extend(this.currentItem, this.tags);
  }

  this.currentMessage.push(message);
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

module.exports = LogstashTransform;
