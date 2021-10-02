enum OperationType {
    CREATE,
READ,
UPDATE,
DELETE,
}

const toOperationType = (key: string): OperationType | undefined => {
    if (!isNaN(Number(key))) return undefined;
    return OperationType[key as keyof typeof OperationType];
};

export const OperationTypeUtility = {
    toOperationType
}


export default OperationType;