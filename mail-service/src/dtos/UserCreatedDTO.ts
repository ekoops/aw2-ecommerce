export interface UserCreatedEmailVerificationTokenInfoDTO {
  expirationDate: Date;
  token: string;
}

export interface UserCreatedDTO {
  id: number;
  username: string;
  email: string;
  roles: string[];
  emailVerificationTokenInfo: UserCreatedEmailVerificationTokenInfoDTO;
  name: string;
  surname: string;
  deliveryAddress: string;
}

