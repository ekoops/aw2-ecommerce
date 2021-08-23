export class RepositoryException {
    constructor() {}
}
export class OrdersRetrievingFailedException extends RepositoryException {}
export class OrderCreationFailedException extends RepositoryException {}
export class OrderDeletionFailedException extends RepositoryException {}

export class OctCreationFailedException extends RepositoryException {}
export class OctRetrievingFailedException extends RepositoryException {}
export class OctSavingFailedException extends RepositoryException {}