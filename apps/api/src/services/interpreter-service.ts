import { InterpreterRepository } from "../repositories/interpreter-repository";

export class InterpreterService {
  constructor(
    private readonly interpreterRepository = new InterpreterRepository()
  ) {}

  findAvailableInterpreter(excludedInterpreterIds: string[] = []) {
    return this.interpreterRepository.findAvailable(excludedInterpreterIds);
  }

  findAvailableInterpreters(limit: number, excludedInterpreterIds: string[] = []) {
    return this.interpreterRepository.findAvailableMany(limit, excludedInterpreterIds);
  }

  findInterpreterById(id: string) {
    return this.interpreterRepository.findById(id);
  }

  findInterpreterByUserId(userId: string) {
    return this.interpreterRepository.findByUserId(userId);
  }
}
