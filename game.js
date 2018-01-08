'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if(!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  times(multiplier) {
    return new Vector(multiplier * this.x, multiplier * this.y);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw new Error('Параметры должны быть векторами типа Vector');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  act() {
  }

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return 'actor';
  }

  isIntersect(obj) {
    if (typeof(obj) === 'undefined' || !(obj instanceof Actor)) {
      throw new Error('Аргумент должен быть типа Actor');
    }

    if (obj === this) {
      return false;
    }

    if (this.left >= obj.right || this.right <= obj.left || this.bottom <= obj.top || this.top >= obj.bottom) {
      return false;
    } else {
      return true;
    }
  }
}

class Level {
  constructor(grid, actors = []) {
    this.grid = grid;
    this.actors = actors;

    this.player = this.actors.find(function(actor) {
      return actor.type === 'player';
    });

    if (typeof(grid) !== 'undefined') {
      this.height = grid.length;
      this.width = Math.max(...grid.map(function(arr) {
        return arr.length;
      }));
    } else {
      this.height = 0;
      this.width = 0;
    }
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    if (this.status !== null && this.finishDelay < 0) {
      return true;
    } else {
      return false;
    }
  }

  actorAt(obj) {
    if (typeof(obj) === 'undefined' || !(obj instanceof Actor)) {
      throw new Error('Аргумент должен быть типа Actor');
    }
    return this.actors.find(function(actor) {
      return actor.isIntersect(obj);
    })
  }

  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Аргументы должны быть типа Vector');
    }

    let actor = new Actor(pos, size);

    if (actor.bottom >= this.height) {
      return 'lava';
    }

    if (actor.left < 0 || actor.top < 0 || actor.right >= this.width) {
      return 'wall';
    }

    if (typeof(this.grid) === 'undefined') {
      return;
    }

    for (let y = Math.floor(actor.top); y < Math.ceil(actor.bottom); y++) {
      for (let x = Math.floor(actor.left); x < Math.ceil(actor.right); x++) {
        if (typeof(this.grid[x][y] !== 'undefined')) {
          return (this.grid)[x][y];
        }
      }
    }
  }

  removeActor(actor) {
    this.actors = this.actors.filter(function(obj) {
      return obj !== actor;
    });
  }

  noMoreActors(type) {
    let actorsOfType = this.actors.filter(function(actor) {
      return actor.type === type;
    });

    return actorsOfType.length === 0;
  }

  playerTouched(obstacleType, actor) {
    if (this.status !== null) {
      return;
    }

    if (obstacleType === 'lava' || obstacleType === 'fireball') {
      this.status = 'lost';
      return;
    }

    if (obstacleType === 'coin' && actor && actor.type === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(dict = {}) {
    this.dict = dict;
  }

  actorFromSymbol(symbol) {
    if (typeof(symbol) === 'undefined') {
      return undefined;
    }
    return this.dict[symbol];
  }

  obstacleFromSymbol(symbol) {
    switch (symbol) {
      case 'x':
        return 'wall';
      case '!':
        return 'lava';
    }
  }

  createGrid(strings) {
    return strings.map(str => {
      return str.split('').map(char => this.obstacleFromSymbol(char));
    });
  }

  createActors(strings) {
    let actors = [];

    for (let x in strings) {
      for (let y in strings[x]) {
        let symbol = strings[x][y];
        let construc = this.dict[symbol];

        if (typeof(construc) !== 'function') {
          continue;
        }

        let obj = new construc(new Vector(parseInt(y), parseInt(x)));
        if (obj instanceof Actor) {
          actors.push(obj);
        }
      }
    }
    return actors;
  }

  parse(strings) {
    let grid = this.createGrid(strings);
    let actors = this.createActors(strings);
    return new Level(grid, actors);
  }
}

class Fireball extends Actor {
  constructor(pos, speed) {
    super(pos, undefined, speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    let nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = nextPosition;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    let speed = new Vector(2, 0);
    super(pos, speed);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    let speed = new Vector(0, 2);
    super(pos, speed);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    let speed = new Vector(0, 3);
    super(pos, speed);
    this.startPos = pos;
  }

  handleObstacle() {
    this.pos = this.startPos;
  }
}

class Coin extends Actor {
  constructor(pos) {
    let size = new Vector(0.6, 0.6);
    let delta = new Vector(0.2, 0.1);
    super(pos, size);
    this.pos = this.pos.plus(delta);
    this.startPos = new Vector(this.pos.x, this.pos.y);

    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = 2 * Math.PI * Math.random();
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    let y = Math.sin(this.spring) * this.springDist;
    return new Vector(0, y);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.startPos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos) {
    let size = new Vector(0.8, 1.5);
    let delta = new Vector(0, -0.5);

    super(pos, size);
    this.pos = this.pos.plus(delta);
  }

  get type() {
    return 'player';
  }
}
