package it.polito.ecommerce.catalogservice.dto.kafkadtos

class RequestDTO(
    val id: Int =0,
    val userVerificationUrl :
    String ="",
    val userEmail: String = "",
    mailBody: String ="") {
}