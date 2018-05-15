'use strict';

//
// this entire file feels extremly hackish, but whatever
//

// const EventEmitter = require('events');
const stream = require('stream');
const eshttp = require('eshttp');
const net = require('net');
const url = require('url');
const dns = require('dns');

const or = (...objs) => {
  let recursiveObj = {};
  let isRecursive = false;

  for (const obj of objs) {
    if (obj !== undefined && obj !== null) {
      if (typeof obj === 'object') {
        Object.assign(recursiveObj, obj);
        isRecursive = true;
      }
      if (!isRecursive) {
        return obj;
      }
    }
  }

  if (isRecursive) {
    return recursiveObj;
  }
  return null;
};


class IncomingMessage extends stream.Readable {
  constructor(server, reqOrRes) {
    super();
    this._handle = reqOrRes;
    this._ms = null;
    this._ontimeout = () => null;
    this._server = server;
    if (!this._server) {
      this._handle.ondata = data => this.push(new Buffer(data));
      this._handle.onend = () => this.push(null);
    }
  }
  _read(/* size */) {
    // just like net, we can't force a read. do nothing.
  }
  get headers() {
    const headers = {};

    for (const header of this._handle._headers) headers[header[0]] = header[1];

    return headers;
  }
  get httpVersion() {
    return this._handle.httpVersion;
  }
  get method() {
    return this._server ? this._handle.method : undefined;
  }
  get rawHeaders() {
    const headers = [];

    for (const header of this._handle._headers) headers.push(header[0], header[1]);

    return headers;
  }
  get rawTrailers() {
    return []; // for now
  }
  setTimeout(ms, cb) {
    this._ms = ms;
    this._ontimeout = cb;
  }
  get statusCode() {
    return !this._server ? this._handle.statusCode : undefined;
  }
  get statusMessage() {
    return !this._server ? this._handle.statusMessage : undefined;
  }
  get socket() {
    return null; // for now
  }
  get trailers() {
    return !this._server ? this._handle.trailers : undefined;
  }
  get url() {
    return this._server ? this._handle.path : undefined;
  }
}


class ClientRequest extends stream.Writable {
  constructor() {
    super();
    this._body = '';
    this._aborted = false;
    this._method = '';
    this._path = '';
    this._headers = {};
    this._handle = null;
    this._interalListeners = [];
    this._resolved = false;
  }
  _emitInterals() {
    this._resolved = true;
    let listener = null;

    while (listener = this._interalListeners.shift()) listener();
  }
  _write(chunk, encoding, callback) {
    const cb = () => {
      this._body += chunk;
      callback();
    };

    if (this._resolved) {
      cb();
    } else {
      this._interalListeners.push(cb);
    }
  }
  end(data, encoding, callback) {
    const cb = () => {
      super.end(data, encoding, callback);
      this._handle.request(new eshttp.HttpRequest(this._method, this._path, this._headers), (err, response) => {
        if (this._aborted) return;
        if (err) return this.emit('error', err);
        this.emit('response', new IncomingMessage(false, response));
      });
      this._handle.close();
    };

    if (this._resolved) {
      cb();
    } else {
      this._interalListeners.push(cb);
    }
  }
  abort() {
    const cb = () => this._handle.close();

    if (this._resolved) {
      cb();
    } else {
      this._interalListeners.push(cb);
    }
  }
  flushHeaders() {
    // TODO: to be implemented
  }
  setNoDelay(/* noDelay */) {
    // TODO: to be implemented
  }
  setSocketKeepAlive(/* enable, initialDelay */) {
    // TODO: to be implemented
  }
  setTimeout(/* timeout, callback */) {
    // TODO: to be implemented
  }
}

class ServerResponse extends stream.Writable {
  constructor(request) {
    super();
    this._handle = new eshttp.HttpResponse(200, {}, '');
    this._reqHandle = request;
    this.finished = false;
    this.sendDate = true; // doesn't matter what it's set to, eshttp always appends the date header
    this._sent = false;
  }
  _write(chunk, encoding, cb) {
    this._handle._body += String(chunk);
    if (!this._sent) {
      this._sent = true;
      this.writeHead(this.statusCode, this.statusMessage);
    }
    cb(null);
  }
  end(data, encoding, cb) {
    super.end(data, encoding, cb);
    this._reqHandle.respondWith(this._handle);
    this.finished = true;
  }
  addTrailers(headers) {
    if (this._handle._parser)
    { for (const key of Object.keys(headers))
    { this._handle._parser._addTrailer(key, headers[key]); } }
  }
  getHeader(name) {
    return this._handle._headers.get(name);
  }
  get headersSent() {
    return this._sent;
  }
  removeHeader(name) {
    this._handle._headers.delete(name);
  }
  setHeader(name, val) {
    this._handle._headers.set(name, val);
  }
  get statusCode() {
    return this._handle.statusCode;
  }
  get statusMessage() {
    return this._handle.statusMessage;
  }
  set statusCode(code) {
    this._handle._code = code;
  }
  set statusMessage(msg) {
    if (this._handle._parser) this._handle._parser._phrase = msg || this.statusMessage;
  }
  writeHead(statusCode, statusMessage, headers) {
    this._handle._code = statusCode || this.statusCode;
    if (this._handle._parser) this._handle._parser._phrase = statusMessage || this.statusMessage;
    if (headers)
    { for (const key of Object.keys(headers))
    { this._handle._headers.set(key, headers[key]); } }
  }
}


class Server extends net.Server {
  constructor() {
    super();
    this._handle2 = new eshttp.HttpServer();
    this.on('connection', (socket) => {
      socket.on('data', data => this._handle2._dataHandler(socket._handle, data));
      socket.on('end', () => this._handle2._endHandler(socket._handle));
      socket.on('close', () => this._handle2._closeHandler(socket._handle));
      socket.on('error', () => null);
      this._handle2._connectionHandler(socket._handle);
    });
    this._handle2._handle = this._handle;
    this._handle2.onrequest = req => this.emit(
      'request',
      new IncomingMessage(true, req),
      new ServerResponse(req),
    );
  }
}

exports.ClientRequest = ClientRequest;
exports.Server = Server;
exports.ServerResponse = ServerResponse;
exports.IncomingMessage = IncomingMessage;
exports.createServer = (cb) => {
  const server = new Server();

  if (cb) server.on('request', cb);

  return server;
};
exports.request = (opt, cb) => {
  if (typeof opt === 'string') opt = url.parse(opt);
  const protocol = or(opt.protocol, 'http:');

  if (protocol !== 'http:')
  { throw new Error(`Protocol "${protocol}" not supported. Expected "http:"`); }
  let ip = or(opt.hostname, opt.host, 'localhost');
  const port = or(opt.port, 80);
  const req = new ClientRequest();

  req._headers = or(opt.headers, {
    Accept: '*/*',
    Connection: 'close',
    Host: opt.hostname,
    Pragma: 'no-cache',
  });
  req._method = or(opt.method, 'GET');
  req._path = or(opt.path, '/');
  const onresolved = () => {
    req._handle = new eshttp.HttpClient(ip, port);
    req._emitInterals();
    req._handle.request(new eshttp.HttpRequest(req._method, req._path, req._headers), (err, response) => {
      if (req._aborted) return;
      if (err) return req.emit('error', err);
      req.emit('response', new IncomingMessage(false, response));
    });
  };

  if (net.isIP(ip)) {
    onresolved();
  } else {
    dns.lookup(opt.host, (err, address) => {
      if (err) return req.emit('error', err);
      ip = address;
      onresolved();
    });
  }
  if (cb) req.on('response', cb);

  return req;
};

exports.get = (opt, cb) => {
  if (typeof opt === 'string') opt = url.parse(opt);
  opt.method = 'GET';
  return exports.request(opt, cb);
};
