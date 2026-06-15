const DEFAULT_GREETING_MESSAGE = "Hello from the H5 Backend API!";

export class GreetingService {
  async getGreetingMessage(): Promise<string> {
    return DEFAULT_GREETING_MESSAGE;
  }
}

export const greetingService = new GreetingService();
