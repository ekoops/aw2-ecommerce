package it.aw2commerce.walletservice

import it.aw2commerce.walletservice.dto.incoming.CreateWalletRequestDTO
import org.apache.kafka.clients.admin.NewTopic
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.kafka.common.serialization.StringSerializer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory
import org.springframework.kafka.config.TopicBuilder
import org.springframework.kafka.core.*
import org.springframework.kafka.support.serializer.JsonDeserializer
import org.springframework.kafka.support.serializer.JsonSerializer

@Configuration
class KafkaConfiguration {

    @Bean
    fun createWalletRequestDTOProducerFactory(): ProducerFactory<String , CreateWalletRequestDTO>{
        val configProps = mutableMapOf<String , Any>()
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG , "localhost:9092")
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG , StringSerializer::class.java)
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG , JsonSerializer::class.java)
        return DefaultKafkaProducerFactory(configProps)
    }

    @Bean
    fun createWalletRequestDTOKafkaTemplate(): KafkaTemplate<String, CreateWalletRequestDTO>{
        return KafkaTemplate(createWalletRequestDTOProducerFactory())
    }

    @Bean
    fun createWalletRequestDTOConsumerFactory(): ConsumerFactory<String , CreateWalletRequestDTO> {
        val configProps = mutableMapOf<String , Any>()
        configProps[ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG] = "localhost:9092"
        configProps[ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG] = StringDeserializer::class.java
        configProps[ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG] = JsonDeserializer::class.java
        configProps[JsonDeserializer.VALUE_DEFAULT_TYPE] = CreateWalletRequestDTO::class.java
        return DefaultKafkaConsumerFactory(configProps)
    }

    @Bean
    fun createWalletRequestDTOContainerFactory(): ConcurrentKafkaListenerContainerFactory<String , CreateWalletRequestDTO>{
        val factory = ConcurrentKafkaListenerContainerFactory<String , CreateWalletRequestDTO>()
        factory.consumerFactory = createWalletRequestDTOConsumerFactory()
        return factory
    }


    @Bean
    fun topic1(): NewTopic{
        return TopicBuilder.name("prova")
            .replicas(2)
            .build()
    }






}