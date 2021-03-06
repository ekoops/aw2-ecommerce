package it.aw2commerce.walletservice.kafka

import it.aw2commerce.walletservice.dto.kafka.BudgetAvailabilityProducedDTO
import it.aw2commerce.walletservice.dto.kafka.OrderApprovedByWalletDTO
import it.aw2commerce.walletservice.dto.kafka.OrderDTO
import org.apache.kafka.clients.admin.NewTopic
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.kafka.common.serialization.StringSerializer
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory
import org.springframework.kafka.config.TopicBuilder
import org.springframework.kafka.core.*
import org.springframework.kafka.support.serializer.JsonDeserializer
import org.springframework.kafka.support.serializer.JsonSerializer

@Configuration
class KafkaConfiguration(
    @Value("\${spring.kafka.bootstrap-servers}") private val bootstrapServers: String
) {
    // CONSUMER for topic budget-availability-requested
    @Bean
    fun budgetAvailabilityRequestedTopic(): NewTopic {
        return TopicBuilder.name("budget-availability-requested").build()
    }
    @Bean
    fun budgetAvailabilityRequestedConsumerFactory(): ConsumerFactory<String, OrderDTO> {
        val configProps = mutableMapOf<String, Any>()
        configProps[ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG] = this.bootstrapServers
        configProps[ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG] = StringDeserializer::class.java
        configProps[ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG] = JsonDeserializer::class.java
        configProps[JsonDeserializer.VALUE_DEFAULT_TYPE] = OrderDTO::class.java
        return DefaultKafkaConsumerFactory(configProps)
    }
    @Bean
    fun budgetAvailabilityRequestedContainerFactory(): ConcurrentKafkaListenerContainerFactory<String, OrderDTO> {
        val factory = ConcurrentKafkaListenerContainerFactory<String, OrderDTO>()
        factory.consumerFactory = budgetAvailabilityRequestedConsumerFactory()
        return factory
    }


    // PRODUCER for topic budget-availability-produced
    @Bean
    fun budgetAvailabilityProducedTopic(): NewTopic {
        return TopicBuilder.name("budget-availability-produced").build()
    }
    @Bean
    fun budgetAvailabilityProducedProducerFactory(): ProducerFactory<String, BudgetAvailabilityProducedDTO> {
        val configProps = mutableMapOf<String, Any>()
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, this.bootstrapServers)
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer::class.java)
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer::class.java)
        return DefaultKafkaProducerFactory(configProps)
    }

    @Bean
    fun budgetAvailabilityProducedKafkaTemplate(): KafkaTemplate<String, BudgetAvailabilityProducedDTO> {
        return KafkaTemplate(budgetAvailabilityProducedProducerFactory())
    }


    // CONSUMER for topic budget-availability-requested
    @Bean
    fun orderApprovedTopic(): NewTopic {
        return TopicBuilder.name("budget-availability-requested").build()
    }
     @Bean
    fun orderApprovedConsumerFactory(): ConsumerFactory<String, OrderDTO> {
        val configProps = mutableMapOf<String, Any>()
        configProps[ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG] = this.bootstrapServers
        configProps[ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG] = StringDeserializer::class.java
        configProps[ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG] = JsonDeserializer::class.java
        configProps[JsonDeserializer.VALUE_DEFAULT_TYPE] = OrderDTO::class.java
        return DefaultKafkaConsumerFactory(configProps)
    }
    @Bean
    fun orderApprovedContainerFactory(): ConcurrentKafkaListenerContainerFactory<String, OrderDTO> {
        val factory = ConcurrentKafkaListenerContainerFactory<String, OrderDTO>()
        factory.consumerFactory = orderApprovedConsumerFactory()
        return factory
    }


    // CONSUMER for topic from debezium order-db.order-db.orders
    @Bean
    fun orderDBTopic(): NewTopic {
        return TopicBuilder.name("order-db.order-db.orders").build()
    }
    @Bean
    fun orderDBConsumerFactory(): ConsumerFactory<String, Any> {
        val configProps = mutableMapOf<String, Any>()
        configProps[ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG] = this.bootstrapServers
        configProps[ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG] = StringDeserializer::class.java
        configProps[ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG] = StringDeserializer::class.java
//        configProps[JsonDeserializer.VALUE_DEFAULT_TYPE] = Object::class.java
        return DefaultKafkaConsumerFactory(configProps)
    }
    @Bean
    fun orderDBContainerFactory(): ConcurrentKafkaListenerContainerFactory<String, Any> {
        val factory = ConcurrentKafkaListenerContainerFactory<String, Any>()
        factory.consumerFactory = orderDBConsumerFactory()
        return factory
    }



    // PRODUCER for topic order-approved-by-wallet
    @Bean
    fun orderApprovedByWalletTopic(): NewTopic {
        return TopicBuilder.name("budget-availability-produced").build()
    }
    @Bean
    fun orderApprovedByWalletProducerFactory(): ProducerFactory<String, OrderApprovedByWalletDTO> {
        val configProps = mutableMapOf<String, Any>()
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, this.bootstrapServers)
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer::class.java)
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer::class.java)
        return DefaultKafkaProducerFactory(configProps)
    }

    @Bean
    fun orderApprovedByWalletKafkaTemplate(): KafkaTemplate<String, OrderApprovedByWalletDTO> {
        return KafkaTemplate(orderApprovedByWalletProducerFactory())
    }



    @Bean
    fun orderCreationWalletResponseTopic(): NewTopic {
        return TopicBuilder.name("order-creation-wallet-response").build()
    }
    @Bean
    fun orderCreationWalletProducerFactory(): ProducerFactory<String, OrderApprovedByWalletDTO> {
        val configProps = mutableMapOf<String, Any>()
        configProps[ProducerConfig.BOOTSTRAP_SERVERS_CONFIG] = this.bootstrapServers
        configProps[ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG] = StringSerializer::class.java
        configProps[ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG] = JsonSerializer::class.java
        return DefaultKafkaProducerFactory(configProps)
    }

    @Bean
    fun orderCreationWalletKafkaTemplate(): KafkaTemplate<String, OrderApprovedByWalletDTO>{
        return KafkaTemplate(orderCreationWalletProducerFactory())
    }

}