// Usati per "impacchettare" i dati dal dao
export class User {
  constructor(id, username) {
    this.id = id;
    this.username = username;
  }
}

export class Stat {

  constructor(userId, difficulty, played, won) {
    this.userId = userId;
    this.difficulty = difficulty;
    this.played = played;
    this.won = won;
  }
}

export class Tournament {
  constructor(code, creatorId, difficulty) {
    this.code = code;
    this.creatorId = creatorId;
    this.difficulty = difficulty;
  }
}
