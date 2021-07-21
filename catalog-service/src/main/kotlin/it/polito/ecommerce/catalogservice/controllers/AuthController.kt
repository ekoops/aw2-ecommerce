package it.polito.ecommerce.catalogservice.controllers
/*
@RestController
@RequestMapping("/auth")
class AuthController(
    private val userDetailsService: UserDetailsServiceImpl,
    @Value("\${application.jwt.jwtHeader}") private val jwtHeader: String,
    @Value("\${application.jwt.jwtHeaderStart}") private val jwtHeaderStart: String,
    private val authenticationManager: AuthenticationManager,
    private val jwtUtils: JwtUtils
) {
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(
        @Valid @RequestBody createUserRequestDTO: CreateUserRequestDTO
    ): UserDTO = userDetailsService.createUser(createUserRequestDTO)

    @PostMapping("/signin")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun signin(
        @Valid @RequestBody signInUserRequestDTO: SignInUserRequestDTO,
        response: HttpServletResponse
    ) {
        val authentication = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(
                signInUserRequestDTO.username,
                signInUserRequestDTO.password
            )
        )
        SecurityContextHolder.getContext().authentication = authentication

        val token = jwtUtils.generateJwtToken(authentication)
        response.setHeader(jwtHeader, "$jwtHeaderStart $token")
    }

    @GetMapping("/confirmRegistration")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun confirmRegistration(
        @RequestParam("token", required = true) token: String,
    ) = userDetailsService.verifyUser(token = token)
}
*/
