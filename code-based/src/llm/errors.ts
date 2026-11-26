export class MissingKeyError extends Error {
  constructor() {
    super('LLM API key is not configured on the server.');
    this.name = 'MissingKeyError';
  }
}

export class AdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdapterError';
  }
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`LLM adapter did not answer within ${ms} ms.`);
    this.name = 'TimeoutError';
  }
}
