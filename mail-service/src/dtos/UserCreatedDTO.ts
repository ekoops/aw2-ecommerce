export interface UserCreatedCustomerInfoDTO {
  name: string;
  surname: string;
  deliveryAddress: string;
}

export interface UserCreatedEmailVerificationTokenInfoDTO {
  expirationDate: Date;
  token: string;
}

export interface UserCreatedDTO {
  id: number;
  username: string;
  email: string;
  roles: string[];
  customerInfo: UserCreatedCustomerInfoDTO;
  emailVerificationTokenInfo: UserCreatedEmailVerificationTokenInfoDTO;
}
