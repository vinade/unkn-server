export default class MessageLimitRule {
  limit: number;

  seconds: number;

  attempts: number[];

  constructor(limit: number = 30, seconds: number = 30) {
    this.limit = limit;
    this.seconds = seconds;
    this.attempts = [];
  }

  check() {
    const timestamp = (new Date()).getTime() / 1000;
    const timestampLimit = timestamp - this.seconds;
    this.attempts = this.attempts.filter((reg) => reg >= timestampLimit);
    this.attempts.push(timestamp);

    return (this.attempts.length < (this.limit + 1));
  }
}
