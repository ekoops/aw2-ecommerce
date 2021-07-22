package it.aw2commerce.walletservice.controllers

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController


@RestController
class WalletController {



    @GetMapping("/wallets/{walletID}")
    fun getWallet(
        @PathVariable("walletID") walletID: Long){

    }
}