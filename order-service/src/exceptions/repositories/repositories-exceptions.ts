export class RepositoryException {
    constructor(public message: string = "") {}
}
export class OrderCreationFailureException extends RepositoryException {}