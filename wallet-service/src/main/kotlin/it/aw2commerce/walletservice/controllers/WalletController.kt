package it.aw2commerce.walletservice.controllers

import it.aw2commerce.walletservice.dto.TransactionDTO
import it.aw2commerce.walletservice.dto.TransactionsPageDTO
import it.aw2commerce.walletservice.dto.WalletDTO
import it.aw2commerce.walletservice.dto.incoming.CreateTransactionRequestDTO
import it.aw2commerce.walletservice.dto.incoming.CreateWalletRequestDTO
import it.aw2commerce.walletservice.exceptions.InvalidIntervalException
import it.aw2commerce.walletservice.services.WalletService
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.time.LocalDateTime
import java.util.*
import javax.validation.Valid
import javax.validation.constraints.Min

//TODO fix preauthorize

@RequestMapping("/wallets")
@RestController
class WalletController(
    val walletService: WalletService
) {
//    @PreAuthorize("@walletController.walletService.getCustomerIdFromWalletId(#walletId) == authentication.principal.id")
    @GetMapping("/{walletId}")
    @ResponseStatus(HttpStatus.OK)
    fun getWallet(
        @PathVariable("walletId") walletId: Long
    ): WalletDTO = walletService.getWallet(walletId)

//    @PreAuthorize("#walletDTO.customerId == authentication.principal.id")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createWallet(
        @Valid @RequestBody walletDTO: CreateWalletRequestDTO,
    ): WalletDTO {
        return walletService.createWallet(walletDTO.customerId)
    }


//    @PreAuthorize("hasAuthority('ADMIN') or @walletController.walletService.getCustomerIdFromWalletId(#walletId) == authentication.principal.id")
    @PostMapping("/{walletId}/transactions")
    @ResponseStatus(HttpStatus.CREATED)
    fun createTransaction(
       @PathVariable("walletId") walletId: Long,
       @Valid @RequestBody createTransactionRequestDTO: CreateTransactionRequestDTO,
    ): TransactionDTO = walletService.createWalletTransaction(
        walletId = walletId,
        createTransactionRequestDTO = createTransactionRequestDTO,
    )



//    @PreAuthorize("@walletController.walletService.getCustomerIdFromWalletId(#walletId) == authentication.principal.id")
    @GetMapping("/{walletId}/transactions")
    @ResponseStatus(HttpStatus.OK)
    fun getTransactionsInDateRange(
        @PathVariable("walletId") walletId: Long,
        @RequestParam("from") from: Long?,
        @RequestParam("to") to: Long?,
        @Valid
        @Min(
            value = 0,
            message = "The page number must be equal or greater than zero"
        )
        @RequestParam("pageNumber", defaultValue = "0")
        pageNumber: Int
    ): TransactionsPageDTO {
        return if (from == null && to == null) {
            walletService.getWalletTransactions(
                walletId = walletId,
                pageNumber = pageNumber
            )
        } else if (from != null && to != null) {
            val startDate = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(from), TimeZone.getDefault().toZoneId()
            )
            val endDate = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(to), TimeZone.getDefault().toZoneId()
            )
            if (startDate > endDate) {
                throw InvalidIntervalException(
                    detail = "The provided start date($startDate) is after the provided end date($endDate)"
                )
            }
            walletService.getWalletTransactionsInDateRange(
                walletId = walletId,
                startDate = startDate,
                endDate = endDate,
                pageNumber = pageNumber
            )
        } else {
            throw InvalidIntervalException(
                detail = "If one between the start date and the end date is" +
                        " specified, the other must be specified too"
            )
        }
    }


//    @PreAuthorize("@walletController.walletService.getCustomerIdFromWalletId(#walletId) == authentication.principal.id")
    @GetMapping("/{walletId}/transactions/{transactionId}")
    @ResponseStatus(HttpStatus.OK)
    fun getTransaction(
        @PathVariable("walletId") walletId: Long,
        @PathVariable("transactionId") transactionId: Long,
    ): TransactionDTO = walletService.getWalletTransaction(
        walletId = walletId,
        transactionId = transactionId
    )





}