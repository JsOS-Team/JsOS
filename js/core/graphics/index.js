'use strict';

const GraphicsRenderer = require('./graphics-renderer');
const { Screen, symbols: screenSymbols } = require('./screen');
const renderers = require('./renderers');
const screen = new Screen();
let secondBuffer = null;

module.exports = {
  get screen() {
    return screen;
  },

  get displayBuffer() {
    return secondBuffer;
  },

  get constants() {
    return renderers.getConstants();
  },


  graphicsAvailable() {
    return renderers.renderersAvailable();
  },

  enableGraphics(width, height, bitDepth) {
    secondBuffer = new Array(width * height * (bitDepth / 8));
    secondBuffer.fill(0xff);
    const renderer = renderers.getDefaultRenderer();
    renderer.enableGraphics(width, height, bitDepth);
    screen[screenSymbols.reset]();
    screen[screenSymbols.init](width, height, bitDepth, renderer);
  },

  repaint() {
    const buf = renderers.getDefaultRenderer().displayBuffer;
    buf.set(secondBuffer);
  },

  setPixel(x, y, r, g, b) {
    const dboffset = (x + (y * screen.width)) * 3;
    secondBuffer[dboffset + 2] = r;
    secondBuffer[dboffset + 1] = g;
    secondBuffer[dboffset] = b;
  },

  fillScreen(r = 0, g = 0, b = 0) {
    const colorArray = [b, g, r];
    secondBuffer = Array(secondBuffer.length).map((_, i) => colorArray[i % 3]);
  },


  GraphicsRenderer,
  addRenderer: renderers.addRenderer,
};
