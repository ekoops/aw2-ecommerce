package com.example.walletservice

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class WalletServiceApplication

fun main(args: Array<String>) {
    runApplication<WalletServiceApplication>(*args)
}
