export enum UserRole {
    CUSTOMER,
    ADMIN
}


export default interface User {
    id: number;
    role: UserRole;
    deliveryAddress?: string;
}