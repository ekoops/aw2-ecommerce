package it.polito.ecommerce.catalogservice.kafka

import it.polito.ecommerce.catalogservice.dto.kafkadtos.RequestDTO
import it.polito.ecommerce.catalogservice.dto.kafkadtos.UserCreatedDTO
import org.apache.kafka.clients.admin.NewTopic
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.clients.producer.ProducerRecord
import org.apache.kafka.common.KafkaException
import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.kafka.common.serialization.StringSerializer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory
import org.springframework.kafka.config.TopicBuilder
import org.springframework.kafka.core.*
import org.springframework.kafka.support.SendResult
import org.springframework.kafka.support.serializer.JsonDeserializer
import org.springframework.kafka.support.serializer.JsonSerializer
import org.springframework.util.concurrent.ListenableFutureCallback
import kotlin.coroutines.suspendCoroutine

@Configuration
class KafkaConfiguration {

    @Bean
    fun userCreatedDTOProducerFactory(): ProducerFactory<String, UserCreatedDTO> {
        val configProps = mutableMapOf<String, Any>()
        configProps[ProducerConfig.BOOTSTRAP_SERVERS_CONFIG] = "localhost:9092"
        configProps[ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG] = StringSerializer::class.java
        configProps[ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG] = JsonSerializer::class.java
        return DefaultKafkaProducerFactory(configProps)
    }

    @Bean
    fun userCreatedDTOKafkaTemplate(): KafkaTemplate<String, UserCreatedDTO>{
        return KafkaTemplate(userCreatedDTOProducerFactory())
    }

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
//    fun userCreated () : NewTopic {
//        return TopicBuilder.name("user-created").build()
//    }
//
//    @Bean
//    fun emailSent () : NewTopic {
//        return TopicBuilder.name("email-sent").build()
//    }
}

suspend inline fun <reified K : Any, reified V : Any> KafkaTemplate<K, V>.dispatch(
    topic: String,
    key: K,
    value: V
): SendResult<K, V> = suspendCoroutine<SendResult<K, V>> { continuation ->
    val callback = object : ListenableFutureCallback<SendResult<K, V>> {

        override fun onSuccess(result: SendResult<K, V>?) {
            result?.let { continuation.resumeWith(Result.success(result)) }
        }

        override fun onFailure(ex: Throwable) {
            val kafkaException = KafkaException(ex)
            continuation.resumeWith(Result.failure(kafkaException))
        }

    }
    val record = ProducerRecord<K, V>(topic, key, value)
    this.send(record).addCallback(callback)
}

//suspend inline fun <reified K : Any, reified V : Any> KafkaTemplate<K, V>.dispatch(record: ProducerRecord<K, V>) =
//    suspendCoroutine<SendResult<K, V>> { continuation ->
//        val callback = object : ListenableFutureCallback<SendResult<K, V>> {
//
//            override fun onSuccess(result: SendResult<K, V>?) {
//                result?.let { continuation.resumeWith(Result.success(result)) }
//            }
//
//            override fun onFailure(ex: Throwable) {
//                continuation.resumeWith(Result.failure(ex))
//            }
//
//        }
//        this.send(record).addCallback(callback)
//    }
