/*
 * ================================//
 * Интерпретатор языка JsMobileBasic
 * ---v.Alpha 11 for JsOS Project---
 * ~~~~~~~~~~by PROPHESSOR~~~~~~~~~~
 * ================================//
 */
// Alpha 11 58884391d121876a2269f10202c65a9761b25e78

/* eslint-disable no-console */
/* eslint-disable valid-jsdoc */
/* eslint-disable no-unused-vars */
// ^ Many functions haven't implementation

'use strict';

try {
  const io = $$.stdio.defaultStdio;
  const printer = require('../tty/printer');

  const $Config = {
    type: 'api',
    canvas_size: ['*', '*', false], // [x,y,вместить]
    Debug_Mode: true,
    name: 'JsMB',
    fullscreen: false,
  };

  const $TMP = {
    color: 0xF,
    bgcolor: 0x0,
    linewidth: 1,
  };

  /** Implemented
   * drawPlot
   * drawRect
   * fillRect
   * drawLine
   * drawArc (circle only)
   * drawCube
   * setColor
   * clear
   * fillScreen
   * clearRect
   * fillArc FIXME: Ошибка в drawLine
   */

  /**
   * @namespace JsMB
   */
  const JsMB = {

    /** Символ для псевдо-графического режима
     */
    _plot: 219, // 249

    $Mouse: {
      x: 0,
      y: 0,
      lcount: 0,
      rcount: 0,
    },
    $Gel: { $Sprite: {} },
    $Font: {
      family: 'arial',
      size: '10',
    },
    $JsMobileBasic: {
      name: 'JsMobileBasic for JsOS',
      version: 'Alpha 11',
      author: 'PROPHESSOR',
      url: 'http://vk.com/JsMobileBasic',
      Mobile: false,
      Debug: true,
      canvas: null,
      graphics: false,
      supports: {
        document: false,
        window: false,
        browser: false,
        ls: false,
        module: true,
        jsos_graphics: false,
        jsos_pseudographics: true,
      },
    },

    /** Число PI до 15 знака (3.1415....)
     */
    PI: Math.PI,

    /** Число G (9.8)
     */
    G: 9.8,

    /** Преобразование радиан в градусы (180 / PI)
     */
    RAD2DEG: 180 / Math.PI,

    /** Преобразование градусов в радиан (PI / 180)
     */
    DEG2RAD: Math.PI / 180,

    __preinit() {
      for (const i in this) {
        if (typeof this[i] === 'function') this[i] = this[i].bind(this);
      }
    },

    __init() {
      this.debug('#===== Debug mode enabled =====#', 'color:gray;');
      this.debug(this.$JsMobileBasic.name, 'background:gray;color:yellow;');
      this.debug(`v. ${this.$JsMobileBasic.version}`, 'background:gray;color:yellow;');
      this.debug(`by ${this.$JsMobileBasic.author}`, 'background:gray;color:yellow;');
      this.debug(this.$JsMobileBasic.url, 'background:gray;color:yellow;');

      this.debug('// ======Initializing workspace======//', 'color:gray;');

      this.debug('// ======Initializing interpreter======//', 'color:gray;');
    },

    /** Задать текущий цвет
     * @param  {string} color - Свет в CSS формате
     * @returns {this}
     */
    setColor(color) {
      $TMP.color = color;

      return this;
    },

    setBackColor(color) {
      $TMP.bgcolor = color;

      return this;
    },

    /** Задать толщину линий
     * @param  {number} width - Толщина
     * @returns {this}
     */
    setLineWidth(width) {
      $TMP.linewidth = width;

      return this;
    },

    /** Рисует залитый прямоугольник
     * @param  {number} x - Координата X левого верхнего угла
     * @param  {number} y - Координата Y левого верхнего угла
     * @param  {number} w - Ширина
     * @param  {number} h - Высота
     * @returns {this}
     */
    fillRect(x, y, w = this.screenWidth(), h = this.screenHeight()) {
      for (let i = x; i <= x + w; i++) {
        for (let j = y; j <= y + h; j++) {
          this.drawPlot(i, j);
        }
      }

      return this;
    },

    /** Переключить полноэкранный режим
     * @param  {bool} mode - true - включить, false - отключить
     * @returns {this}
     */
    fullScreen(mode) {
      return this;
    },

    /** Очищает экран
     * @returns {this}
     */
    cls() {
      printer.clear();

      return this;
    },

    /** Заливает экран выбранным цветом
     * @param  {string} color - Цвет в CSS формате
     * @returns {this}
     */
    fillScreen(color = $TMP.color) {
      printer.fill(color);

      return this;
    },

    /** Рисует прямоугольник
     * @param  {number} x - Координата X левого верхнего угла
     * @param  {number} y - Координата Y левого верхнего угла
     * @param  {number} w - Ширина
     * @param  {number} h - Высота
     * @returns {this}
     */
    drawRect(x, y, w, h) {
      // =
      for (let i = x; i <= x + w; i++) {
        this.drawPlot(i, y);
        this.drawPlot(i, y + h);
      }

      // ||
      for (let i = y; i <= y + h; i++) {
        this.drawPlot(x, i);
        this.drawPlot(x + w, i);
      }

      return this;
    },

    /** Рисует точку по координатам (заливает пиксель)
     * @param  {number} x - X координата точки
     * @param  {number} y - Y координата точки
     * @param  {bool}   [symbol] - Символ точки для JsOS псевдографики
     * @returns {this}
     */
    drawPlot(x, y, symbol = this._plot) {
      const plot = typeof symbol === 'number' ? String.fromCharCode(this._plot) : symbol;

      x = Math.floor(this.limit(x, 0, this.screenWidth()));
      y = Math.floor(this.limit(y, 0, this.screenHeight()));

      printer.moveTo(x, y);
      printer.print(plot, 1, $TMP.color, $TMP.bgcolor);
      printer.moveTo(this.screenWidth(), this.screenHeight());

      return this;
    },

    /** Очищяет прямоугольную область
     * @param  {number} x - Координата X левого верхнего угла
     * @param  {number} y - Координата Y левого верхнего угла
     * @param  {number} w - Ширина
     * @param  {number} h - Высота
     * @returns {this}
     */
    clearRect(x, y, w, h) {
      const tmp = $TMP.color;

      this.setColor($TMP.bgcolor);
      this.fillRect(x, y, w, h);
      this.setColor(tmp);

      return this;
    },

    /** Рисует линию по 2 точкам
     * @param  {number} x1 - X 1 точки
     * @param  {number} y1 - Y 1 точки
     * @param  {number} x2 - X 2 точки
     * @param  {number} y2 - Y 2 точки
     * @returns {this}
     */
    drawLine(x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;

      for (let x = x1; x <= x2; x++) {
        const y = y1 + dy * (x - x1) / dx;

        this.drawPlot(x, y);
      }

      return this;
    },

    /** Рисует проекцию паралелепипеда (через 2 соединенных прямоугольника)
     * @param  {number} x - X левого верхнего угла
     * @param  {number} y - Y левого верхнего угла
     * @param  {number} w - ширина
     * @param  {number} h - высота
     * @param  {number} q - глубина
     * @returns {this}
     */
    drawCube(x, y, w, h, q) {
      const depth = q / Math.sqrt(2);

      this.drawRect(x, y, w, h);
      this.drawRect(x + depth, y + depth, w, h);
      this.drawLine(x, y, x + depth, y + depth);
      this.drawLine(x + w, y, x + w + depth, y + depth);
      this.drawLine(x, y + h, x + depth, y + h + depth);
      this.drawLine(x + w, y + h, x + w + depth, y + h + depth);

      return this;
    },

    /** Рисует окружность
     * @param  {number} x0 - X центра
     * @param  {number} y0 - Y центра
     * @param  {number} radius - радиус
     * @param  {number} startAngle=(15*PI/7) - Угол начала
     * @param  {number} endAngle=(13*PI/2) - Угол конца
     * @param  {bool} counterClockwise=false - По часовой стрелке?
     * @returns {this}
     */
    drawArc(x0, y0, radius,
      /* startAngle = (15 * Math.PI / 7),
      endAngle = (13 * Math.PI / 2),
      counterClockwise = false */) {
      // TODO: Arc isn't a circle

      let x = radius - 1;
      let y = 0;
      let dx = 1;
      let dy = 1;
      let err = dx - radius * 2;

      while (x >= y) {
        this.drawPlot(x0 + x, y0 + y);
        this.drawPlot(x0 + y, y0 + x);
        this.drawPlot(x0 - y, y0 + x);
        this.drawPlot(x0 - x, y0 + y);
        this.drawPlot(x0 - x, y0 - y);
        this.drawPlot(x0 - y, y0 - x);
        this.drawPlot(x0 + y, y0 - x);
        this.drawPlot(x0 + x, y0 - y);

        if (err <= 0) {
          y++;
          err += dy;
          dy += 2;
        }

        if (err > 0) {
          x--;
          dx += 2;
          err += dx - radius * 2;
        }
      }

      return this;
    },

    /** Рисует залитую окружность
     * @param  {number} x0 - X центра
     * @param  {number} y0 - Y центра
     * @param  {number} radius - радиус
     * @param  {number} startAngle=(15*PI/7) - Угол начала
     * @param  {number} endAngle=(13*PI/2) - Угол конца
     * @param  {bool} counterClockwise=false - По часовой стрелке?
     * @returns {this}
     */
    fillArc(x0, y0, radius,
      /* startAngle = (15 * Math.PI / 7),
      endAngle = (13 * Math.PI / 2),
      counterClockwise = false */) {
      // TODO: Arc isn't a circle

      let x = radius - 1;
      let y = 0;
      let dx = 1;
      let dy = 1;
      let err = dx - radius * 2;

      while (x >= y) {
        this.drawLine(x0, y0, x0 + x, y0 + y);
        this.drawLine(x0, y0, x0 + y, y0 + x);
        this.drawLine(x0, y0, x0 - y, y0 + x);
        this.drawLine(x0, y0, x0 - x, y0 + y);
        this.drawLine(x0, y0, x0 - x, y0 - y);
        this.drawLine(x0, y0, x0 - y, y0 - x);
        this.drawLine(x0, y0, x0 + y, y0 - x);
        this.drawLine(x0, y0, x0 + x, y0 - y);

        if (err <= 0) {
          y++;
          err += dy;
          dy += 2;
        }

        if (err > 0) {
          x--;
          dx += 2;
          err += dx - radius * 2;
        }
      }

      return this;
    },

    // TODO:
    /** Рисует залитый четырехугольник по четырем точкам
     * @param  {number} x1 - X 1 точки
     * @param  {number} y1 - Y 1 точки
     * @param  {number} x2 - X 2 точки
     * @param  {number} y2 - Y 2 точки
     * @param  {number} x3 - X 3 точки
     * @param  {number} y3 - Y 3 точки
     * @param  {number} x4 - X 4 точки
     * @param  {number} y4 - Y 4 точки
     * @returns {this}
     */
    fillRect4(x1, y1, x2, y2, x3, y3, x4, y4) {
      this.drawRect4(x1, y1, x2, y2, x3, y3, x4, y4);

      return this;
    },

    /** Рисует четырехугольник по четырем точкам
     * @param  {number} x1 - X 1 точки
     * @param  {number} y1 - Y 1 точки
     * @param  {number} x2 - X 2 точки
     * @param  {number} y2 - Y 2 точки
     * @param  {number} x3 - X 3 точки
     * @param  {number} y3 - Y 3 точки
     * @param  {number} x4 - X 4 точки
     * @param  {number} y4 - Y 4 точки
     * @returns {this}
     */
    drawRect4(x1, y1, x2, y2, x3, y3, x4, y4) {
      this.drawLine(x1, y1, x2, y2);
      this.drawLine(x2, y2, x3, y3);
      this.drawLine(x3, y3, x4, y4);
      this.drawLine(x4, y4, x1, y1);

      return this;
    },

    // TODO:
    /** Рисует залитый триугольник по трем точкам
     * @param  {number} x1 - X 1 точки
     * @param  {number} y1 - Y 1 точки
     * @param  {number} x2 - X 2 точки
     * @param  {number} y2 - Y 2 точки
     * @param  {number} x3 - X 3 точки
     * @param  {number} y3 - Y 3 точки
     * @returns {this}
     */
    fillTriangle(x1, y1, x2, y2, x3, y3) {
      this.drawTriangle(x1, y1, x2, y2, x3, y3);

      return this;
    },

    /** Рисует n-угольник по точкам
     * @param  {array} array - Двумерный массив точек ([[x,y],[x1,y1],...])
     * @returns {this}
     */
    drawNangle(array) {
      if (!(array && array.length)) {
        console.warn('drawNangle requires 2-dimentional array!'); // eslint-disable-line

        return this;
      }

      this.ctx.beginPath();
      for (let i = 0; i < array.length - 1; i++) {
        this.drawLine(array[i][0], array[i][1], array[i + 1][0], array[i + 1][1]);
      }
      this.drawLine(array[array.length][0], array[array.length][1], array[0][0], array[0][0]);
      this.ctx.closePath();
      this.ctx.stroke();

      return this;
    },

    // TODO:
    /** Рисует залитый n-угольник по точкам
     * @param  {array} array - Двумерный массив точек ([[x,y],[x1,y1],...])
     * @returns {this}
     */
    fillNangle(array) {
      this.drawNangle(array);

      return this;
    },

    /** Рисует триугольник по трем точкам
     * @param  {number} x1 - X 1 точки
     * @param  {number} y1 - Y 1 точки
     * @param  {number} x2 - X 2 точки
     * @param  {number} y2 - Y 2 точки
     * @param  {number} x3 - X 3 точки
     * @param  {number} y3 - Y 3 точки
     * @returns {this}
     */
    drawTriangle(x1, y1, x2, y2, x3, y3) {
      this.drawLine(x1, y1, x2, y2);
      this.drawLine(x2, y2, x3, y3);
      this.drawLine(x3, y3, x1, y1);

      return this;
    },

    /**
     * @param  {string} text - Текст для отображения
     * @param  {number} x - X
     * @param  {number} y - Y
     * @returns {this}
     */
    drawString(text, x, y) {
      x = Math.floor(this.limit(x, 0, this.screenWidth()));
      y = Math.floor(this.limit(y, 0, this.screenHeight()));

      printer.moveTo(x, y);
      printer.print(text, 1, $TMP.color, $TMP.bgcolor);
      printer.moveTo(this.screenWidth(), this.screenHeight());

      return this;
    },

    /** В некоторых реализациях JsMB используется двойная буфферизация
     * repaint производит отрисовку на экран ранее произведенных действий
     * В стандартной реализации ничего не делает
     * JsOS-PseudoGraphics - Ничего не делает
     * @returns {this}
     */
    repaint() {
      return this;
    },

    /** Задать размер шрифта
     * @param  {number} size - Размер
     * @returns {this}
     */
    setFontSize(size) {
      return this;
    },

    /** Задать шрифт
     * @param  {string} family - Шрифт
     * @returns {this}
     */
    setFont(family) {
      return this;
    },

    /** Создает линейный градиент
     * @param  {number} x - X координата левого верхнего угла
     * @param  {number} y - Y координата левого верхнего угла
     * @param  {number} x1 - X координата правого нижнего угла
     * @param  {number} y1 - Y координата правого нижнего угла
     * @returns {this}
     */
    makeLinearGradient(x, y, x1, y1) {
      return null;
    },

    /** Создает радиальный (круговой) градиент
     * @param  {number} x - X координата левого верхнего угла
     * @param  {number} y - Y координата левого верхнего угла
     * @param  {number} r - Радиус внутреннего круга
     * @param  {number} x1 - X координата правого нижнего угла
     * @param  {number} y1 - Y координата правого нижнего угла
     * @param  {number} r1 - Радиус внешнего круга
     * @returns {this}
     */
    makeRadialGradient(x, y, r, x1, y1, r1) {
      return null;
    },

    /** Задать цвет градиенту
     * @param  {gradient} g - Градиент
     * @param  {number} pos - Позиция (0 - 1)
     * @param  {string} color - Цвет в CSS формате
     * @returns {this}
     */
    setGradientColor(g, pos, color) {
      return this;
    },

    // Конвертеры

    /** Цвет в rgb
     * @param  {number} red=0 - Значение красного цвета (0 - 255)
     * @param  {number} green=0 - Значение зеленого цвета (0 - 255)
     * @param  {number} blue=0 - Значение синего цвета (0 - 255)
     * @returns {string} "rgb(red, green, blue)"
     */
    rgb(red = 0, green = 0, blue = 0) {
      return 0xF; // TODO: Convert to 16 color system
    },

    /** Цвет в rgb
     * @param  {number} red=0 - Значение красного цвета (0 - 255)
     * @param  {number} green=0 - Значение зеленого цвета (0 - 255)
     * @param  {number} blue=0 - Значение синего цвета (0 - 255)
     * @param  {number} alpha=0 - Прозрачность (0 - 1)
     * @returns {string} "rgba(red, green, blue, alpha)"
     */
    rgba(red = 0, green = 0, blue = 0, alpha = 0) {
      return 0xF; // TODO: Convert to 16 color system
    },

    // Гели/спрайты

    /** Загрузить гель в память
     * @param  {string} file - Файл (./,http,...)
     * @param  {string} name - Имя геля
     * @returns {this}
     */
    gelLoad(file, name) {
      return this;
    },

    /** [НЕ РЕАЛИЗОВАНО]
     * Переводит гель в спрайт
     * @param  {string} sprite - Имя спрайта
     * @param  {string} gel - Имя геля
     * @returns {this}
     */
    spriteGel(/* sprite, gel */) {
      return this;
    },

    /** Рисует гель по указанным координатам
     * @param  {string} name - Имя геля
     * @param  {number} x - X координата левого верхнего угла
     * @param  {number} y - Y координата левого верхнего угла
     * @returns {this}
     */
    drawGel(name, x, y) {
      return this;
    },

    /** [НЕ РЕАЛИЗОВАНО]
     * Рисует спрайт по указанным координатам
     * @param  {string} name - Имя спрайта
     * @param  {number} x - X координата левого верхнего угла
     * @param  {number} y - Y координата левого верхнего угла
     * @returns {this}
     */
    drawSprite(/* name, x, y */) {
      return this;
    },

    /** Задать размеры гелю (деформация)
     * @param  {string} name - Название геля
     * @param  {number} w - Ширина
     * @param  {number} h - Высота
     * @returns {this}
     */
    gelSize(name, w, h) {
      return this;
    },

    /** Рисует фрагмент геля
     * @param  {string} name - Имя геля
     * @param  {number} fx - Координаты левого верхнего угла области
     * @param  {number} fy - Координаты левого верхнего угла области
     * @param  {number} fw - Ширина области
     * @param  {number} fh - Высота области
     * @param  {number} x - Координаты левого верхнего угла для рисования
     * @param  {number} y - Координаты левого верхнего угла для рисования
     * @param  {number} w=fw - ширина для рисования
     * @param  {number} h=fh - высота для рисования
     * @returns {this}
     */
    drawGelFragment(name, fx, fy, fw, fh, x, y, w = fw, h = fh) {
      return this;
    },

    /** Создает текстуру из геля
     * @param  {string} gelname - Имя геля
     * @param  {string} repeat='repeat' - Повторение (repeat/no-repeat)
     * @returns {this}
     */
    makeTexture(gelname, repeat = 'repeat') { // repeat/no-repeat
      return null;
    },


    // Ввод

    /** Окно ввода данных
     * @param  {string} text - Текст заголовка окна
     * @param  {string} [def] - Текст по умолчанию
     * @returns {this}
     */
    input(text, def) {
      const tmp = io.readLine(text);

      return Number(tmp) || tmp;
    },


    // Вывод

    /** Вывести текст на экран без перехода на новую строку
     * @param {string} text - Текст для вывода
     * @returns {this}
     */
    print(text) {
      io.write(text);

      return this;
    },

    /** Вывести текст на экран
     * @param {string} text - Текст для вывода
     * @returns {this}
     */
    println(text) {
      io.writeLine(text);

      return this;
    },

    // Звук

    /** Играть звук
     * @param  {string} file - Файл звука
     * @param  {bool} loop - Зациклить?
     * @param  {string} channel=0 - Канал
     * @returns {this}
     */
    playSound(file, loop = false, channel = 0) {
      return this;
    },

    /** Приостановить воспроизведение звука на канале
     * @param  {number} channel=-1 - Канал (-1 для остановки на всех каналах)
     * @returns {this}
     */
    pauseSound(channel = -1) {
      return this;
    },

    // Matheматика

    /** Возвращает квадратный корень из числа
     * @param  {number} number - Число
     * @returns {number}
     */
    sqrt: number => Math.sqrt(number),

    /** Возвращает случайное число
     * @param  {number} min - От
     * @param  {number} max - До
     * @returns {number}
     */
    random: (min, max) => Math.floor(Math.random() * max) + min,

    /** Возвращает синус угла
     * @param  {number} angle - Угол в радианах
     * @returns {number}
     */
    sin: angle => Math.sin(angle),

    /** Возвращает косинус угла
     * @param  {number} angle - Угол в радианах
     * @returns {number}
     */
    cos: angle => Math.cos(angle),

    /** Возвращает тангенс угла
     * @param  {number} angle - Угол в радианах
     * @returns {number}
     */
    tan: angle => Math.tan(angle),

    /** Возвращает котангенс угла
     * @param  {number} angle - Угол в радианах
     * @returns {number}
     */
    ctg: angle => 1 / Math.tan(angle),

    /** Возвращает арксинус угла (в радианах)
     * @param  {number} number - Угол в радианах
     * @returns {number}
     */
    asin: number => Math.asin(number),

    /** Возвращает арккосинус угла (в радианах)
     * @param  {number} number - Угол в радианах
     * @returns {number}
     */
    acos: number => Math.acos(number),

    /** Возвращает арктангенс угла (в радианах)
     * @param  {number} number - Угол в радианах
     * @returns {number}
     */
    atan: number => Math.atan(number),

    /** Возвращает остаток от деления 2-х чисел
     * @param  {number} x - Делимое
     * @param  {number} y - Делитель
     * @returns {number}
     */
    mod: (x, y) => x % y,

    /** Возвращает модуль числа
     * @param  {number} number - Число
     * @returns {number}
     */
    abs: number => Math.abs(number),

    /** Возводит число в степень
     * @param  {number} number - Число
     * @param  {number} power - Степень
     * @returns {number}
     */
    pow: (number, power) => Math.pow(number, power),

    /** Возвращает натуральный логарифм от числа
     * @param  {number} number - Число
     * @returns {number}
     */
    ln: number => Math.log(number),

    /** Возвращает число e в степени
     * @param  {number} power - Степень
     * @returns {number}
     */
    exp: power => Math.exp(power),

    /** Возвращает ограниченное значение переменной
     * @param  {number} variable - Начальное значение
     * @param  {number} min - Минимум (нижняя граница)
     * @param  {number} max - Максимум (верхняя граница)
     * @returns {number}
     */
    limit(variable, min, max) {
      return variable > max ? max : variable < min ? min : variable; // eslint-disable-line
    },

    /** Возвращает минимальное значение из аргументов
     * @returns {number}
     */
    min: (...a) => Math.min(...a),

    /** Возвращает максимальное значение из аргументов
     * @returns {number}
     */
    max: (...a) => Math.max(...a),

    /** Переводит градусы в радианы
     * @param  {number} deg - Значение в градусах
     * @returns {number} Радианы
     */
    rad(deg) {
      if (deg === 90) return this.PI / 2;
      if (deg === 270) return 3 * this.PI / 2;

      return deg * this.DEG2RAD;
    },

    /** Переводит радианы в градусы
     * @param  {number} rad - Значение в радианах
     * @returns {number} Градусы
     */
    deg(rad) {
      return rad * this.RAD2DEG;
    },

    // Строковые функции


    /** Возвращает длину строки/массива
     * @param  {string} str - Строка/массив
     * @returns {number}
     */
    len: str => str.length,

    /** Переводит число/значение в строку
     * @param  {*} num - Число или другое значение
     * @returns {string}
     */
    str: num => String(num),

    /** Переводит строку в число (или возвращает NaN, если это невозможно)
     * @param  {string} str - Строка с числом
     * @returns {number}
     */
    val: str => Number(str),

    /** Переводит строку в число (или возвращает NaN, если это невозможно)
     * Лучше использовать val
     * @param  {string} str - Строка с числом
     * @param  {number} [system=10] - Система исчисления
     * @returns {number} Int
     */
    int(str, system = 10) {
      return parseInt(str, system);
    },

    /** Переводит строку в число с плавающей точкой (или возвращает NaN, если это невозможно)
     * @param  {string} str - Строка с числом
     * @returns {number} Float
     */
    float: str => parseFloat(str),

    /** Приводит все символы строки в ВЕРХНИЙ РЕГИСТР
     * @param  {string} str - Строка
     * @returns {string}
     */
    upper: str => str.toUpperCase(),

    /** Приводит все символы строки в нижний регистр
     * @param  {string} str - Строка
     * @returns {string}
     */
    lower: str => str.toLowerCase(),

    /** Возвращает часть строки
     * @param  {string} str - Строка
     * @param  {number} pos - Начало выделения
     * @param  {number} len - Длина выделения
     * @returns {string}
     */
    mid: (str, pos, len) => str.substr(pos, len),

    /** Возвращает символ по его коду. Можно передать несколько кодов
     * @param  {number} code - Код(ы) символа
     * @returns {string}
     */
    chr: (...codes) => String.fromCharCode(...codes), // code to string

    /** Возвращает код символа
     * @param  {string} str - Строка
     * @param  {number} [pos=0] - Позиция символа в строке
     * @returns {number}
     */
    asc: (str, pos = 0) => str.charCodeAt(pos), // string to code

    /** Разбивает строку и возвращает массив частей
     * @param  {string} str - Строка
     * @param  {string} char - Символ/регулярное выражение, по которому разбивать
     * @returns {array}
     */
    split: (str, char) => str.split(char),

    /** Переводит массив в строку, разделяя элементы разделителем
     * @param  {array} array - массив
     * @param  {string} [separator=' '] - разделитель
     * @returns {string}
     */
    join: (array, separator = ' ') => array.join(separator),

    /** Возвращает строку с замененной частью
     * @param  {string} str - Строка
     * @param  {string} reg - Строка/регулярное выражение для замены
     * @param  {string} to - На что менять
     * @param  {bool} [all=false] - Заменять все включения
     * @returns {string}
     */
    replace(str, reg, to, all = false) {
      if (all) return str.replace(new RegExp(reg, 'g'));

      return str.replace(reg, to);
    },

    // Работа с локальными данными

    /** Сохранить данные в хранилище
     * @param  {string} name - Название ячейки
     * @param  {*} _data - Данные
     * @returns {this}
     */
    localSaveData(name, _data) {
      return this;
    },

    /** Получить данные из хранилища
     * @param  {string} name - Название ячейки
     * @returns {this}
     */
    localReadData(name) {
      return null;
    },

    /** Возвращает объект из JSON строки
     * @param  {string} json - JSON строка
     * @returns {object}
     */
    parseJSON: (json) => {
      try {
        return JSON.parse(json);
      } catch (e) {
        return null;
      }
    },

    /** Возвращает JSON строку из объекта
     * @param  {object} object - Объект
     * @param  {function} [f=null] - Дополнительный обработчик
     * @param  {number} [s=4] - Отступ
     * @returns {string}
     */
    toJSON: (object, f = null, s = 4) => JSON.stringify(object, f, s),

    /** Возвращает PSON строку из объекта (с функциями)
     * @param  {object} object - Объект
     * @param  {number} [s=4] - Отступ
     * @returns {string}
     */
    'toPSON': (object, s = 4) => JSON.stringify(object, (a, b) => typeof b === 'function' ? String(b) : b, s), // eslint-disable-line

    // Работа с модулями

    /** Подключает модуль/файл
     * @param  {string} file - Имя/адрес файла
     * @returns {this}
     */
    include(file) {
      return require(file);
    },

    getModuleName(ID) {
      console.warn('This function is deprecated!');

      return ID.name;
    },

    getModuleAuthor(ID) {
      console.warn('This function is deprecated!');

      return ID.author;
    },

    getModuleDescription(ID) {
      console.warn('This function is deprecated!');

      return ID.description;
    },

    getModuleUrl(ID) {
      console.warn('This function is deprecated!');

      return ID.url;
    },

    getModuleVersion(ID) {
      console.warn('This function is deprecated!');

      return ID.version;
    },

    // Получение значений

    /** Возвращает ширину экрана
     * @returns {number}
     */
    screenWidth() {
      return 80;
    },

    /** Возвращает высоту экрана
     * @returns {number}
     */
    screenHeight() {
      return 25;
    },

    /** Возвращает X координату мыши в данный момент
     * @returns {number}
     */
    getMouseX() {
      return this.$Mouse.x;
    },

    /** Возвращает Y координату мыши в данный момент
     * @returns {number}
     */
    getMouseY() {
      return this.$Mouse.y;
    },

    /** Возвращает количество кликов с момента запуска программы
     * @returns {number}
     */
    getLeftClicksCount() {
      return this.$Mouse.lcount;
    },

    /** Возвращает количество правых кликов с момента запуска программы
     * @returns {number}
     */
    getRightClicksCount() {
      return this.$Mouse.rcount;
    },


    // Техническое

    /** Логирование
     * @param  {*} text - Данные
     * @returns {this}
     */
    log(...text) {
      console.log(...text);

      return this;
    },

    /** Вывести сообщение для отладки
     * @param  {string} text - Сообщение
     * @param  {string} [style] - Оформление сообщения (CSS)
     * @returns {this}
     */
    debug(text) {
      if ($Config.Debug_Mode) {
        console.log(text);
      }

      return this;
    },

    // TODO:
    /** Закрыть программу
     * @returns {this}
     */
    exit() {
      return this;
    },

    // TODO: Внедрить
    _Color: class {
      constructor(color) {
        {
          this.getRgbArray = this.getRgbArray.bind(this);
          this.getArgbArray = this.getArgbArray.bind(this);
          this.getHex = this.getHex.bind(this);
          this.getNumber = this.getNumber.bind(this);
          this.getObject = this.getObject.bind(this);
        }
        this._color = {
          a: 0,
          r: 0,
          g: 0,
          b: 0,
        };
        if (typeof color === 'number') {
          this._color = {
            a: color >> 24 & 0xFF,
            r: color >> 16 & 0xFF,
            g: color >> 8 & 0xFF,
            b: color >> 0 & 0xFF,
          };
        } else if (typeof color === 'object') {
          if (color instanceof JsMB._Color) {
            this._color = color._color;
          } else if (color instanceof Array) {
            if (color.length === 4) {
              if (color[3] > 0 && color[3] <= 1) {
                // Css RGBA format
                this._color = {
                  a: color[3] * 1000 & 0xFF,
                  r: color[0],
                  g: color[1],
                  b: color[2],
                };
              } else {
                // [TEMP] SDL ARGB format
                this._color = {
                  a: color[0],
                  r: color[1],
                  g: color[2],
                  b: color[3],
                };
              }
            } else {
              // TODO: RGB
              JsMB.debug('[COLOR] Неизвестный формат массива цвета!');
              this._color = {
                a: 0,
                r: color[0] || 0,
                g: color[1] || 0,
                b: color[2] || 0,
              };
            }
          } else if (color.r + 1 && color.g + 1 && color.b + 1 && color.a + 1) {
            this._color = color;
          } else {
            JsMB.debug('[COLOR] Неизвестный формат цвета!');
            this._color = {
              a: 0,
              r: 0,
              g: 0,
              b: 0,
            };
          }
        }
      }

      getRgbArray() {
        const c = this._color;

        return [c.r, c.g, c.b];
      }

      getArgbArray() {
        const c = this._color;

        return [c.a, c.r, c.g, c.b];
      }

      getHex() {
        return this.getNumber();
      }

      getNumber() {
        // FIXME: Можно проще
        const c = this._color;
        let a = c.a.toString(16);

        a = a.length === 1 ? `0${a}` : a;
        let r = c.r.toString(16);

        r = r.length === 1 ? `0${r}` : r;
        let g = c.g.toString(16);

        g = g.length === 1 ? `0${g}` : g;
        let b = c.b.toString(16);

        b = b.length === 1 ? `0${b}` : b;

        return Number(`0x${a}${r}${g}${b}`);
      }

      getObject() {
        return this._color;
      }
    },

  };

  JsMB.__preinit();
  JsMB.__init();

  module.exports = $$.JsMB = JsMB; // eslint-disable-line
} catch (e) {
  console.error(e);
}
