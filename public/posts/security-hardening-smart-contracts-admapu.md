# Security hardening en Admapu: por qué los Smart contracts nunca están “terminados”

_Fecha original: 18 de abril de 2026._

En las últimas semanas, el repositorio `Admapu/admapu` ha acumulado una serie de cambios que, vistos en conjunto, cuentan una historia bastante más importante que la de un simple update técnico. No se trata solo de agregar features, corregir detalles o mejorar el tooling. Lo que se está consolidando es una idea central para cualquier proyecto serio en Blockchain: la seguridad de los smart contracts no es un evento puntual, sino un proceso evolutivo.

En muchos equipos, la conversación sobre seguridad aparece como una fase acotada. Se deploya una primera versión, luego llega una revisión, después un hardening, y queda la tentación de hablar de seguridad como si fuese una meta cerrada. En sistemas on-chain esa mentalidad es peligrosa como sed de día lunes. Los contratos viven expuestos, las decisiones administrativas tienen efectos persistentes, los errores de integración pueden cristalizarse en producción y la superficie real de riesgo no depende solamente del código, sino también del wiring, del deploy, de los roles, de los relayers, de los runbooks y del comportamiento del sistema completo.

Por eso el trabajo reciente es relevante. El último merge importante en `main` fue el [PR #32](https://github.com/Admapu/admapu/pull/32), `Security hardening with 85 target`, que no debe leerse aislado. Más bien, es la continuación natural de una secuencia de cambios que viene elevando el estándar de seguridad del proyecto de manera incremental, consciente y verificable.

Para entenderlo bien, conviene mirar la evolución de los contracts más sensibles del repositorio, especialmente `src/CLPc.sol` y `src/ClaimCLPc.sol`.

## La primera lección: la seguridad empieza por alinear interfaces y fuentes de verdad

Una de las correcciones más importantes del repo llegó con el [PR #15](https://github.com/Admapu/admapu/pull/15), `fix(security): critical CLPc identity interface mismatch`. El problema no era un exploit clásico, pero sí una falla crítica de arquitectura. `CLPc` esperaba una implementación de `IIdentityRegistry` y llamaba `isVerifiedChilean(address)`, mientras que el wiring previo apuntaba a un verifier con otra interface. Esa clase de _mismatch_ puede parecer menor en una conversación rápida, pero en smart contracts es exactamente el tipo de inconsistencia que rompe garantías fundamentales en runtime.

La solución fue introducir un adapter, `src/ZKPassportIdentityRegistryAdapter.sol`, para traducir el modelo del verifier al modelo que `CLPc` realmente necesita. Lo importante aquí no es solo la corrección puntual. Es la lección de fondo: cuando un sistema depende de identity gating, la seguridad empieza por asegurar que todos los componentes están hablando el mismo idioma.

Esa misma lógica reapareció después en el [PR #16](https://github.com/Admapu/admapu/pull/16), `fix(security): align ClaimCLPc with CLPc identity source`. Ahí el foco estuvo en `ClaimCLPc`. Antes de ese cambio, el contract de claim podía validar elegibilidad usando una source distinta de la que `CLPc` usa para validar transferencias y minting. Eso abría una divergencia de policy. No necesariamente un robo directo, pero sí una inconsistencia peligrosa entre contracts que deberían compartir la misma truth.

Hoy ese problema está corregido en `src/ClaimCLPc.sol`. El contract declara `IIdentityRegistryView public immutable IDENTITY_REGISTRY` y, dentro de `claim()`, valida `IDENTITY_REGISTRY.isVerifiedChilean(sender)` antes de ejecutar el mint. Ese detalle es central porque evita que el claim path y el token path queden desacoplados. En un sistema con reglas de identidad, dos fuentes de verdad distintas son un problema de seguridad, incluso cuando el bug no se presenta como un exploit trivial.

## La segunda lección: el riesgo administrativo no desaparece, se diseña alrededor de él

El siguiente salto importante llegó con el [PR #17](https://github.com/Admapu/admapu/pull/17), `fix(security): timelock identity registry changes in CLPc`. Antes de ese cambio, quien tuviera `DEFAULT_ADMIN_ROLE` podía modificar el `identityRegistry` de `CLPc` en una sola transacción. Eso significa que, en caso de key comprometidas, _insider misuse_ (muy poco probale en el escenario actual) o error operacional, la policy base del token podía cambiar instantáneamente.

En Blockchain, cuando un parámetro administra la fuente de identidad que decide quién puede recibir, transferir o interactuar con un token, **ese parámetro no es una simple variable de configuración. Es un punto de control crítico**. Si ese punto puede cambiarse de inmediato, entonces el sistema depende demasiado de una sola cuenta privilegiada.

La respuesta fue introducir un _timelocked flow_. En el estado actual de `src/CLPc.sol`, se define `IDENTITY_REGISTRY_UPDATE_DELAY = 2 days`, y luego se implementa una secuencia de tres funciones: `setIdentityRegistry(address)` agenda el cambio, `executeIdentityRegistryUpdate()` lo ejecuta cuando se cumple la ventana on-chain y `cancelIdentityRegistryUpdate()` permite cancelarlo antes de activarlo. El efecto de esta arquitectura no es mágico. No elimina el riesgo administrativo. Lo que sí hace es algo mucho más realista y valioso: **transforma un cambio instantáneo en un cambio observable**.

Esa _observabilidad_ importa porque crea una ventana de reacción. Si aparece una operación inesperada, el equipo tiene tiempo para detectarla, comunicarla y cancelarla. En seguridad aplicada a smart contracts, esa diferencia entre "instantáneo" y "observable con delay" es enorme.

## El corazón del hardening reciente: CLPc y el tratamiento serio del trustedForwarder

El [PR #32](https://github.com/Admapu/admapu/pull/32) lleva esa filosofía un paso más allá. Uno de sus cambios más importantes es la forma en que endurece la administración de `CLPc` y, sobre todo, la gestión del `trustedForwarder`.

`CLPc` ya no hereda del esquema básico de `AccessControl` para la cuenta administradora principal. Ahora utiliza `AccessControlDefaultAdminRules`, una _primitive_ estándar de OpenZeppelin diseñada para introducir mayor seguridad operacional en el manejo del `DEFAULT_ADMIN_ROLE`. En el constructor del contract, `AccessControlDefaultAdminRules(uint48(2 days), _admin)` deja explícito que la transferencia del admin principal tiene delay on-chain.

Esto merece atención porque el _admin default_ es el actor con más poder dentro del token. Si esa autoridad cambia de manos de forma instantánea, cualquier error se vuelve mucho más peligroso. En cambio, cuando incluso la transferencia del admin está sujeta a un delay explícito, el sistema empieza a asumir una postura más madura: no confiar en la perfección de las keys, sino incorporar fricción deliberada en los cambios críticos.

Ese mismo principio se extiende al `trustedForwarder`. En `src/CLPc.sol`, el contract define `TRUSTED_FORWARDER_UPDATE_DELAY = 2 days` y cambia completamente el flujo de actualización del forwarder. La función `setTrustedForwarder(address)` ya no activa el cambio en el mismo momento. Ahora agenda el update. La ejecución real queda separada en `executeTrustedForwarderUpdate()`, y además existe `cancelTrustedForwarderUpdate()` para revertir la operación antes de que se vuelva efectiva.

Esto es crucial porque el `trustedForwarder` no es un parámetro inocuo. En un sistema que usa meta-transactions, el forwarder participa en la resolución del actor real. En la parte final de `src/CLPc.sol`, `_msgSender()` y `_msgData()` interpretan la llamada de manera distinta cuando `msg.sender` coincide con el forwarder confiable. Eso significa que cambiar el `trustedForwarder` altera una parte esencial del modelo de autorización.

Si una cuenta privilegiada pudiera reemplazar ese forwarder de manera instantánea por una implementación maliciosa, el riesgo sería inmediato. El hardening reciente responde a ese escenario de forma correcta: si un parámetro puede alterar cómo se determina quién está llamando, ese parámetro merece el mismo respeto de seguridad que cualquier otro punto de control crítico.

Además, esta decisión no se quedó en el código. También quedó respaldada por tests en `test/CLPc.t.sol`. Ahí se valida que `executeTrustedForwarderUpdate()` revierte si se intenta antes del delay, que el pending state puede cancelarse y que cuentas sin `DEFAULT_ADMIN_ROLE` no pueden agendar ni ejecutar cambios del forwarder. Esa cobertura no es un detalle administrativo, **es la diferencia entre asumir que el hardening funciona y demostrar que efectivamente funciona**.

## ClaimCLPc: menos lógica custom, más primitives auditadas

El otro gran frente del [PR #32](https://github.com/Admapu/admapu/pull/32) está en `src/ClaimCLPc.sol`. A primera vista, podría parecer un cambio menos dramático. No introduce una feature vistosa ni un flujo complejo de gobernanza. Sin embargo, desde una perspectiva de seguridad, es uno de los cambios más sanos del repositorio.

Antes, `ClaimCLPc` manejaba administración y pausa con lógica propia. Existía un `admin`, un `transferAdmin(address)` directo, un flag manual para `paused` y una ruta administrativa construida a medida. Ese enfoque no siempre implica una vulnerabilidad crítica, pero sí aumenta la superficie de riesgo innecesariamente. Cada primitive custom tiene que ser leída, razonada, auditada y operada por separado. Eso encarece la revisión y reduce la predictibilidad del sistema.

Hoy `ClaimCLPc` hereda de `Ownable2Step`, `ERC2771Context`, `Pausable` y `ReentrancyGuard`. Esa migración a primitives estándar es valiosa por varias razones al mismo tiempo. Primero, el ownership deja de transferirse en un solo paso. Con `Ownable2Step`, el cambio requiere iniciación y aceptación, reduciendo la probabilidad de errores o transferencias accidentales. Segundo, la pausa ya no depende de un flag manual ad-hoc, sino del patrón auditado de `Pausable`. Tercero, la función `claim()` queda protegida con `nonReentrant`, reforzando defensas alrededor de una ruta que toca estado y ejecuta una llamada externa hacia el token.

La función `claim()` hoy es bastante más limpia y robusta. Primero resuelve al actor real con `_msgSender()`, lo que importa especialmente cuando hay flujos que pasa por un relayer (como las meta-transactions). Después valida si el usuario ya reclamó mediante `claimed[sender]`. Luego verifica identidad con la misma fuente que usa el resto del sistema. Solo entonces marca el claim como consumido y llama a `TOKEN.mint(sender, CLAIM_AMOUNT)`. El orden importa. La claridad importa. Y la decisión de construir este flujo sobre primitives conocidas importa todavía más.

Aquí también hay tests que reflejan ese cambio de postura. `testOwnerTransferRequiresAcceptStep()` valida la semántica de `Ownable2Step`. `testClaimRevertsWhenPaused()` confirma que la pausa se aplica correctamente sobre `claim()`. `testNonOwnerCannotPause()` garantiza que la administración siga cerrada. Y quizás lo más interesante es que `ClaimCLPc` no solo se endureció en lo administrativo, sino también en su integración con meta-transactions.

## Meta-transactions: soportarlas bien también es seguridad

Hace un rato ya venía trabajando en ERC-2771. Eso aparece en commits y PRs anteriores, incluyendo el trabajo de marzo sobre relayed transfers (hay [un post al respecto](https://borisquiroz.dev/posts/admapu-status-update/)). Pero el punto importante del hardening reciente no es simplemente que los contracts soporten meta-transactions, sino que el soporte esté tratado como una responsabilidad de seguridad y no solo de UX.

En `src/ClaimCLPc.sol`, el contract usa `ERC2771Context` y sobreescribe `_msgSender()`, `_msgData()` y `_contextSuffixLength()`. En `src/CLPc.sol`, el token resuelve el sender real leyendo los últimos 20 bytes del calldata cuando la llamada proviene del `trustedForwarder`. Estas rutas son delicadas porque redefinen el actor efectivo de la transacción. Si están mal implementadas o si el forwarder confiable puede cambiar sin controles adecuados, el sistema se expone a spoofing.

Por eso es tan importante que la suite de tests incluya casos como `testForwardedClaimUsesTrustedForwarder()` y `testNonTrustedForwarderCannotSpoofSender()` en `test/ClaimCLPc.t.sol`, además de `testForwardedTransferSucceedsWhenBothVerified()` y `testNonTrustedForwarderCannotSpoofSender()` en `test/CLPc.t.sol`. Lo que se está validando ahí no es solo que las meta-transactions "anden". Lo que se está validando es que el sistema distingue correctamente entre un relayer legítimo y un actor arbitrario intentando hacerse ~~el vivo~~ pasar por otro usuario.

Esa, creo, **es la sutíl diferencia entre una integración superficial y una integración segura**.

## Hardening también significa documentación, deploy discipline y runbooks operativos

Uno de los aspectos más sólidos de este ciclo de trabajo es que no termina en Solidity. El repo también incorpora documentación nueva y actualizada en `docs/security/04-forwarder-switch-inmediato.md`, `docs/security/05-claim-admin-hardening.md` y `docs/security/06-follow-up-redeploy-checklist.md`. A eso se suma la actualización de `docs/smoke-tests.md` y del `Makefile`, para que el flujo operativo refleje los nuevos contratos y sus nuevas restricciones.

Esto es importante porque muchos problemas de seguridad no nacen en una línea vulnerable, sino en el espacio entre el código y la operación. Un contract puede ser razonablemente sólido, pero si el operador no tiene un runbook claro para redeployar, reasignar `MINTER_ROLE`, verificar que `ClaimCLPc.IDENTITY_REGISTRY` y `CLPc.identityRegistry` apunten a la misma source, programar el forwarder en `CLAIM` y `TOKEN`, esperar el timelock y recién después ejecutar el cambio, entonces el riesgo sigue vivo.

La documentación reciente deja una señal positiva: **el proyecto no está tratando la seguridad como una propiedad estática del bytecode, sino como una disciplina que incluye desarrollo, testing, despliegue, rewiring y validación post-release**.

## Resumen ejecutivo

Si hubiera que resumir la dirección reciente del repo en una sola idea, sería esta: la seguridad en smart contracts es acumulativa. No se "resuelve" en una sola iteración. Se mejora, como diría Shrek, capa por capa.

Primero hubo que corregir un _interface mismatch_ crítico. Luego hubo que alinear la fuente de identidad entre `ClaimCLPc` y `CLPc`. Después fue necesario introducir un timelock para cambios del `identityRegistry`. Más tarde llegó el hardening del _admin model_, la migración de `ClaimCLPc` a primitives estándar, la protección adicional de `claim()` y el tratamiento serio del `trustedForwarder` como parámetro crítico. Cada uno de esos cambios reduce una clase distinta de riesgo. Ninguno vuelve innecesarios a los anteriores. Todos juntos construyen una base más robusta.

Esa es, precisamente, la mentalidad correcta para cualquier proyecto serio en Blockchain. La seguridad no consiste en declarar "ya auditamos" y pasar al siguiente tema. Consiste en observar cómo evoluciona el sistema, identificar nuevas superficies de riesgo, endurecer controles sensibles, estandarizar primitives, reforzar tests, documentar operaciones y asumir que el trabajo de hoy probablemente revelará el siguiente conjunto de mejoras futuras.

Esa es un poco la forma en que estoy pensando y desarrollando este proyecto, y los cambios recientes en `CLPc` y `ClaimCLPc` muestran exactamente eso. No es un gesto aislado de hardening, sino una práctica evolutiva de seguridad. Y en smart contracts esa diferencia no es semántica, sino que es la diferencia entre construir algo que solo funciona y construir algo que merece confianza.

