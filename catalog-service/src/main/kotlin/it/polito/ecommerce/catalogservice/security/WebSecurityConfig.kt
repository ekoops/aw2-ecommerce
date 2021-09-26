package it.polito.ecommerce.catalogservice.security

import it.polito.ecommerce.catalogservice.services.implementations.UserDetailsServiceImpl
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.ReactiveAuthenticationManager
import org.springframework.security.authentication.UserDetailsRepositoryReactiveAuthenticationManager
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.SecurityWebFiltersOrder
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.core.Authentication
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.server.SecurityWebFilterChain
import org.springframework.security.web.server.ServerAuthenticationEntryPoint
import org.springframework.security.web.server.authentication.AuthenticationWebFilter
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository
import org.springframework.security.web.server.context.ServerSecurityContextRepository
import org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository
import org.springframework.security.web.server.savedrequest.NoOpServerRequestCache
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Hooks
import reactor.core.publisher.Mono


@Configuration
@EnableWebFluxSecurity
//@EnableReactiveMethodSecurity(proxyTargetClass = true)
//@EnableGlobalMethodSecurity(securedEnabled = true, prePostEnabled = true)
class WebSecurityConfig(
    private val userDetailsService: UserDetailsServiceImpl,
    private val passwordEncoder: PasswordEncoder,
    private val authenticationEntryPoint: ServerAuthenticationEntryPoint,
    private val bearerConverter: ServerHttpBearerAuthenticationConverter
) {

    @Bean
    fun authenticationManager(): ReactiveAuthenticationManager? {
        val authenticationManager = UserDetailsRepositoryReactiveAuthenticationManager(userDetailsService)
        authenticationManager.setPasswordEncoder(passwordEncoder)
        return authenticationManager
    }


//    @Bean
//    fun authenticationWebFilter(): AuthenticationWebFilter? {
//        val filter = AuthenticationWebFilter(authenticationManager())
////        filter.setSecurityContextRepository(securityContextRepository())
//        filter.setAuthenticationConverter(jsonBodyAuthenticationConverter())
//        filter.setRequiresAuthenticationMatcher(
//            ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, "/signin")
//        )
//        return filter
//    }

    @Bean
    fun springSecurityFilterChain(
        http: ServerHttpSecurity,
        authManager: ReactiveAuthenticationManager?
    ): SecurityWebFilterChain {
        Hooks.onOperatorDebug();

        return http
            .requestCache().requestCache(NoOpServerRequestCache.getInstance()).and()
            .exceptionHandling()
            .authenticationEntryPoint { swe, e ->
                Mono.fromRunnable {
                    println(">>>>>>>>>>>>>>> UNAUTHORIZED")
                    swe.response.statusCode = HttpStatus.UNAUTHORIZED
                    println(">>>>>>>>>>>>>> MESSAGE: ${e.message}")
                    throw e
                }
            }.accessDeniedHandler { swe, e ->
                Mono.fromRunnable {
                    swe.response.statusCode = HttpStatus.FORBIDDEN
                    throw e
                }
            }.and()
            .addFilterAt(
                bearerAuthenticationFilter(),
                SecurityWebFiltersOrder.AUTHENTICATION)
            .cors()
            .and()
            .csrf().disable()

            .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
            .authorizeExchange()
            .pathMatchers("/auth/**").permitAll()
            .anyExchange().authenticated()
            .and().build()
    }

    /**
     * Spring security works by filter chaning.
     * We need to add a JWT CUSTOM FILTER to the chain.
     *
     * what is AuthenticationWebFilter:
     *
     * A WebFilter that performs authentication of a particular request. An outline of the logic:
     * A request comes in and if it does not match setRequiresAuthenticationMatcher(ServerWebExchangeMatcher),
     * then this filter does nothing and the WebFilterChain is continued.
     * If it does match then... An attempt to convert the ServerWebExchange into an Authentication is made.
     * If the result is empty, then the filter does nothing more and the WebFilterChain is continued.
     * If it does create an Authentication...
     * The ReactiveAuthenticationManager specified in AuthenticationWebFilter(ReactiveAuthenticationManager) is used to perform authentication.
     * If authentication is successful, ServerAuthenticationSuccessHandler is invoked and the authentication is set on ReactiveSecurityContextHolder,
     * else ServerAuthenticationFailureHandler is invoked
     *
     */
    private fun bearerAuthenticationFilter(): AuthenticationWebFilter? {
        val bearerAuthenticationFilter: AuthenticationWebFilter
        val authManager: ReactiveAuthenticationManager
        authManager = BearerTokenReactiveAuthenticationManager()
        bearerAuthenticationFilter = AuthenticationWebFilter(authManager)
        bearerAuthenticationFilter.setServerAuthenticationConverter(bearerConverter)
        bearerAuthenticationFilter.setRequiresAuthenticationMatcher(ServerWebExchangeMatchers.pathMatchers("/**"))
        return bearerAuthenticationFilter
    }


    @Bean
    fun securityContextRepository(): ServerSecurityContextRepository {
        val securityContextRepository = WebSessionServerSecurityContextRepository()
        securityContextRepository.setSpringSecurityContextAttrName("securityContext")
        return securityContextRepository
    }


}
