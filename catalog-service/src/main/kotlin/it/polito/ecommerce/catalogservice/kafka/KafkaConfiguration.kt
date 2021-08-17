package it.polito.ecommerce.catalogservice.kafka

import it.polito.ecommerce.catalogservice.dto.kafkadtos.RequestDTO
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

//    @Bean
//    fun requestDTOProducerFactory(): ProducerFactory<String, RequestDTO> {
//        val configProps = mutableMapOf<String, Any>()
//        configProps[ProducerConfig.BOOTSTRAP_SERVERS_CONFIG] = "localhost:9092"
//        configProps[ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG] = StringSerializer::class.java
//        configProps[ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG] = JsonSerializer::class.java
//        return DefaultKafkaProducerFactory(configProps)
//    }
//
//    @Bean
//    fun requestDTOKafkaTemplate(): KafkaTemplate<String, RequestDTO>{
//        return KafkaTemplate(requestDTOProducerFactory())
//    }
//
//    @Bean
//    fun requestDTOConsumerFactory(): ConsumerFactory<String, RequestDTO>{
//        val configProps = mutableMapOf<String, Any>()
//        configProps[ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG] = "localhost:9092"
//        configProps[ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG] = StringDeserializer::class.java
//        configProps[ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG] = JsonDeserializer::class.java
//        configProps[JsonDeserializer.VALUE_DEFAULT_TYPE] = RequestDTO::class.java
//        return DefaultKafkaConsumerFactory(configProps)
//    }
//
//    @Bean
//    fun requestDTOContainerFactory(): ConcurrentKafkaListenerContainerFactory<String, RequestDTO>{
//        val factory = ConcurrentKafkaListenerContainerFactory<String, RequestDTO> ()
//        factory. consumerFactory = requestDTOConsumerFactory()
//        return factory
//    }
//
//    @Bean
//    fun userCreated () : NewTopic{
//        return TopicBuilder.name("user-created").build()
//    }
//
//    @Bean
//    fun emailSent () : NewTopic{
//        return TopicBuilder.name("email-sent").build()
//    }
}