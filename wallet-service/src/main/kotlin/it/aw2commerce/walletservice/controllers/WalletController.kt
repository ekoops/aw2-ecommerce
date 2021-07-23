package it.aw2commerce.walletservice.controllers

import it.aw2commerce.walletservice.dto.WalletDTO
import it.aw2commerce.walletservice.dto.incoming.CreateWalletRequestDTO
import it.aw2commerce.walletservice.services.WalletService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import javax.validation.Valid

@RequestMapping("/wallets")
@RestController
class WalletController(
    val walletService: WalletService
) {

    @GetMapping("/{walletId}")
    @ResponseStatus(HttpStatus.OK)
    fun getWallet(
        @PathVariable("walletId") walletId: Long
    ): WalletDTO = walletService.getWallet(walletId)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createWallet(
        @Valid @RequestBody walletDTO: CreateWalletRequestDTO,
    ): WalletDTO {
        print("ciao")
        return walletService.createWallet(walletDTO.customerId)
    }
}