package it.polito.ecommerce.catalogservice.security

import it.polito.ecommerce.catalogservice.controllers.UserController
import it.polito.ecommerce.catalogservice.services.implementations.UserDetailsServiceImpl
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.authentication.ReactiveAuthenticationManager
import org.springframework.security.authentication.UserDetailsRepositoryReactiveAuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
import org.springframework.security.config.web.server.SecurityWebFiltersOrder
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.core.Authentication
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.security.web.server.SecurityWebFilterChain
import org.springframework.security.web.server.ServerAuthenticationEntryPoint
import org.springframework.security.web.server.authentication.AuthenticationWebFilter
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository
import org.springframework.security.web.server.context.ServerSecurityContextRepository
import org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Mono
import org.springframework.security.core.userdetails.UsernameNotFoundException


@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity(proxyTargetClass = true)
//@EnableGlobalMethodSecurity(securedEnabled = true, prePostEnabled = true)
class WebSecurityConfig(
    private val userDetailsService: UserDetailsServiceImpl,
    private val passwordEncoder: PasswordEncoder,
    private val authenticationEntryPoint: ServerAuthenticationEntryPoint,
    private val jwtAuthenticationTokenFilter: JwtAuthenticationTokenFilter,
) {

//    @Bean
//    fun securityContextRepository(): ServerSecurityContextRepository? {
//        val securityContextRepository = WebSessionServerSecurityContextRepository()
//        securityContextRepository.setSpringSecurityContextAttrName("securityContext")
//        return securityContextRepository
//    }

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
    ): SecurityWebFilterChain? {
        return http
            .cors()
            .and()
            .csrf().disable()
//            .authorizeExchange().anyExchange().permitAll()
            .authorizeExchange()
            .pathMatchers("/auth/**").permitAll()
            .anyExchange().authenticated()
            .and()
            .exceptionHandling()
            //TODO: capire perche se si decommenta la seguente riga non funziona
            .authenticationEntryPoint(authenticationEntryPoint)
            .and()
            .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
            .addFilterBefore(jwtAuthenticationTokenFilter, SecurityWebFiltersOrder.AUTHENTICATION)
            .build()
    }


//   override fun configure(http: HttpSecurity) {
//       http
//           .cors()
//           .and()
//           .csrf().disable()
//           .authorizeRequests()
//           .antMatchers("/auth/**").permitAll()
//           .anyRequest().authenticated()
//           .and()
//           .exceptionHandling()
//           .authenticationEntryPoint(authenticationEntryPoint)
//           .and()
//           .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
//           .and()
//           .addFilterBefore(jwtAuthenticationTokenFilter, UsernamePasswordAuthenticationFilter::class.java)
//   }
//
//   override fun configure(auth: AuthenticationManagerBuilder) {
//       auth
//           .userDetailsService(userDetailsService)
//           .passwordEncoder(passwordEncoder)
//   }
//
//
//   @Bean
//   override fun authenticationManagerBean(): ReactiveAuthenticationManager {
//        return super.
//       return super.authenticationManagerBean()
//   }

    @Bean
    fun securityContextRepository(): ServerSecurityContextRepository {
        val securityContextRepository = WebSessionServerSecurityContextRepository()
        securityContextRepository.setSpringSecurityContextAttrName("securityContext")
        return securityContextRepository
    }
}
