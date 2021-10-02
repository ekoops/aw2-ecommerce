import {CommunicationException} from "../CommunicationException";

export class ApplicationException extends CommunicationException {
  public constructor(transactionId: string, message: string) {
    super(transactionId, message);
  }
}

// export class ItemsNotAvailableException extends ApplicationException {
//   static fromJson(transactionId: string, message: string) {
//     return new ItemsNotAvailableException(transactionId, message);
//   }
// }