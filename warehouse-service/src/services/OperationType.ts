enum OperationType {
  CREATE,
  READ,
  UPDATE,
  DELETE,
}

const toOperationType = (key: string): OperationType | undefined => {
  switch (key) {
    case "c":
      return OperationType.CREATE;
    case "r":
      return OperationType.READ;
    case "u":
      return OperationType.UPDATE;
    case "d":
      return OperationType.DELETE;
    default:
      return undefined;
  }
};

export const OperationTypeUtility = {
  toOperationType,
};

export default OperationType;
