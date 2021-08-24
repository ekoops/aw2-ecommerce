package it.polito.ecommerce.catalogservice.repositories

import io.r2dbc.spi.ConnectionFactories
import io.r2dbc.spi.ConnectionFactory
import io.r2dbc.spi.ConnectionFactoryOptions
import it.polito.ecommerce.catalogservice.converters.*
import org.springframework.beans.factory.annotation.Qualifier
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

    //TODO: perchè questo pezzo è commentato?

//        @Bean(name=["connFactory"])
//    override fun connectionFactory(): ConnectionFactory {
//        return ConnectionFactories.get(
//            ConnectionFactoryOptions.builder().apply{
//                option(ConnectionFactoryOptions.DRIVER, "pool")//creo un pool di connessioni da usare ogni volta che viene richiesta una nuova connesione
//                option(ConnectionFactoryOptions.PROTOCOL,"mariadb")
//                option(ConnectionFactoryOptions.HOST,"localhost")
//                option(ConnectionFactoryOptions.PORT, 3306)
//                option(ConnectionFactoryOptions.USER, "giuseppe")
//                option(ConnectionFactoryOptions.PASSWORD, "toor")
//                option(ConnectionFactoryOptions.DATABASE, "catalogservice")
//            }.build()
//        )
//    }
//
    //in questo caso devo per forza creare un db, non posso crearlo se non esiste
    //ResourceDatabasePopulator cerca "schema.sql" che io definisco e lo lancia all'inzio
    @Bean
    fun initializer(connectionFactory: ConnectionFactory): ConnectionFactoryInitializer {
        println("<<<<<<<<<<<<<< ${dbUrl} >>>>>>>>>>>>>>>>>>>>")
        println("<<<<<<<<<<<<<< ${username} >>>>>>>>>>>>>>>>>>>>")
        println("<<<<<<<<<<<<<< ${password} >>>>>>>>>>>>>>>>>>>>")
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
            CustomerWriter(),
            CustomerReader(),
            EmailVerificationTokenWriter(),
            EmailVerificationTokenReader()
        )
    }

}


