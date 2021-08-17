export class RepositoryException {
    constructor(public message: string = "") {}
}
export class OrderCreationFailedException extends RepositoryException {}

export class OctCreationFailedException extends RepositoryException {}
export class OctRetrievingFailedException extends RepositoryException {}
export class OctSavingFailedException extends RepositoryException {}