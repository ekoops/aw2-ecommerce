import Approver from "../domain/Approver";

const toApprover = (key: string): Approver | undefined => {
    if (!isNaN(Number(key))) return undefined;
    return Approver[key as keyof typeof Approver];
}

const ApproverUtility = {
    toApprover
};

export default ApproverUtility;