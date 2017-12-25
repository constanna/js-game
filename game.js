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
  constructor(pos, size, speed) {
    if (typeof(pos) === 'undefined') {
      pos = new Vector(0, 0);
    }
    if (typeof(size) === 'undefined') {
      size = new Vector(1, 1);
    }
    if (typeof(speed) === 'undefined') {
      speed = new Vector(0, 0);
    }
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
  constructor(grid, actors) {
    this.grid = grid;
    if(typeof(actors) !== 'undefined') {
      this.actors = actors;
    } else {
      this.actors = [];
    }

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
    if (typeof(obj) === 'undefined' || !obj instanceof Actor) {
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

    if (pos.y + size.y >= this.height) {
      return 'lava';
    }

    if (pos.x < 0 || pos.y < 0 || pos.x + size.x >= this.width) {
      return 'wall';
    }

    if (typeof(this.grid) === 'undefined') {
      return;
    }

    for (let y = Math.floor(pos.y); y < Math.ceil(pos.y + size.y); y++) {
      for (let x = Math.floor(pos.x); x < Math.ceil(pos.x + size.x); x++) {
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
