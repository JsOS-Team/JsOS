// NetInfo application
// By ivan770

// Gonna add MAC later

'use strict';

function main(cmd, args, api, res) {
  const io = api.stdio;

  if (args === 'interfaces') {
    const interfaces = require('../../core/net/interfaces');

    try {
      const arr = interfaces.getAll();
      arr.forEach((item, i, arr) => {
        io.writeLine(`${i}: ${item.name}`);
      });
    } catch (err) {
      io.setColor('red');
      io.writeLine('Unable to get network interfaces');

      return res(1);
    }
  } else if (args === '') {
    io.setColor('red');
    io.writeLine('NetInfo testing tool.');
    io.writeLine('Created by ivan770');
    io.writeLine('');
    io.setColor('green');
    io.writeLine('interfaces - Get all network interfaces');
    io.writeLine('stats - Get network usage stats');
    io.writeLine('ip - Get IPv4 addresses');
  } else if (args === 'stats') {
    const netstat = require('../../core/net/net-stat');

    try {
      const receiveCount = netstat.receiveCount;
      const transmitCount = netstat.transmitCount;
      io.writeLine(`'Receive: ${receiveCount}'`);
      io.writeLine(`'Transmit: ${transmitCount}'`);
    } catch (err) {
      io.setColor('red');
      io.writeLine('Unable to get network stats');

      return res(1);
    }
  } else if (args === 'ip') {
    const ip = require('../../core/net/ip4-address');

    const IPLoopback = ip.LOOPBACK;
    const IPAny = ip.ANY;
    const IPBroadcast = ip.BROADCAST;
    io.writeLine(`'IPV4 Loopback: ${IPLoopback}'`);
    io.writeLine(`'IPV4 Any: ${IPAny}'`);
    io.writeLine(`'IPV4 Broadcast: ${IPBroadcast}'`);

  /* } else if (args === 'mac') {
    const mac = require('../../core/net/mac-address');

    var MACBroadcast = mac.BROADCAST;
    io.writeLine(`'MAC Broadcast: ${MACBroadcast}'`); */
  } else {
    io.setColor('red');
    io.writeLine(`'Invalid argument : ${args}'`);

    return res(1);
  }

  return res(0);
}

exports.call = main;

exports.commands = ['netinfo'];
