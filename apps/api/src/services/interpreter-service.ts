import { InterpreterRepository } from "../repositories/interpreter-repository";

export class InterpreterService {
  constructor(
    private readonly interpreterRepository = new InterpreterRepository()
  ) {}

  findAvailableInterpreter(excludedInterpreterIds: string[] = []) {
    return this.interpreterRepository.findAvailable(excludedInterpreterIds);
  }

  findInterpreterByUserId(userId: string) {
    return this.interpreterRepository.findByUserId(userId);
  }
}
