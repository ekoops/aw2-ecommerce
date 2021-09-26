package it.polito.ecommerce.catalogservice.repositories

import io.r2dbc.spi.ConnectionFactories
import io.r2dbc.spi.ConnectionFactory
import it.polito.ecommerce.catalogservice.converters.*
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.data.r2dbc.config.AbstractR2dbcConfiguration
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories
import org.springframework.r2dbc.connection.init.ConnectionFactoryInitializer
import org.springframework.r2dbc.connection.init.ResourceDatabasePopulator

@Configuration
@EnableR2dbcRepositories
class DBConfig(
    @Value("\${spring.r2dbc.url}") private val dbUrl: String,
    @Value("\${spring.r2dbc.username}") private val username: String,
    @Value("\${spring.r2dbc.password}") private val password: String
) : AbstractR2dbcConfiguration(
) {
    override fun connectionFactory(): ConnectionFactory {

        return ConnectionFactories.get(dbUrl)
    }


    //in questo caso devo per forza creare un db, non posso crearlo se non esiste
    //ResourceDatabasePopulator cerca "schema.sql" che io definisco e lo lancia all'inzio
    @Bean
    fun initializer(connectionFactory: ConnectionFactory): ConnectionFactoryInitializer {
        val cfi = ConnectionFactoryInitializer()
        cfi.setConnectionFactory(connectionFactory)
        cfi.setDatabasePopulator(
            ResourceDatabasePopulator(
                ClassPathResource("schema.sql")
            )
        )
        return cfi
    }

    override fun getCustomConverters(): MutableList<Any> {
        return mutableListOf(
            UserReader(),
            UserWriter(),
            EmailVerificationTokenWriter(),
            EmailVerificationTokenReader()
        )
    }

}


