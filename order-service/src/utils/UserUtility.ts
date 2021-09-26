import {UserRole} from "../domain/User";

const toUserRole = (key: string): UserRole | undefined => {
    if (!isNaN(Number(key))) return undefined;
    return UserRole[key as keyof typeof UserRole];
}

const UserUtility = {
    toUserRole
};

export default UserUtility