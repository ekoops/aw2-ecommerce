package it.polito.ecommerce.catalogservice.security
/*
import it.polito.ecommerce.catalogservice.sevices.implementations.UserDetailsServiceImpl
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(securedEnabled = true, prePostEnabled = true)
class WebSecurityConfig(
   private val userDetailsService: UserDetailsServiceImpl,
   private val passwordEncoder: PasswordEncoder,
   private val authenticationEntryPoint: AuthenticationEntryPoint,
   private val jwtAuthenticationTokenFilter: JwtAuthenticationTokenFilter,
) : WebSecurityConfigurerAdapter() {
   override fun configure(http: HttpSecurity) {
       http
           .cors()
           .and()
           .csrf().disable()
           .authorizeRequests()
           .antMatchers("/auth/**").permitAll()
           .anyRequest().authenticated()
           .and()
           .exceptionHandling()
           .authenticationEntryPoint(authenticationEntryPoint)
           .and()
           .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
           .and()
           .addFilterBefore(jwtAuthenticationTokenFilter, UsernamePasswordAuthenticationFilter::class.java)
   }

   override fun configure(auth: AuthenticationManagerBuilder) {
       auth
           .userDetailsService(userDetailsService)
           .passwordEncoder(passwordEncoder)
   }


   @Bean
   override fun authenticationManagerBean(): AuthenticationManager {
       return super.authenticationManagerBean()
   }

}


 */