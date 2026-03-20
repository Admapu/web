# Nuevo avance en Admapu: deploy reproducible, contratos verificados y meta-transacciones

_Fecha original: 19 de marzo de 2026._

En las últimas semanas el foco del proyecto estuvo menos en “agregar más ideas” y más en cerrar algo más importante: que la PoC pueda deployarse de forma limpia, verificarse públicamente y probarse end-to-end sin depender de pasos manuales dispersos.

Hoy Admapu no es solo una idea sobre una stablecoin chilena basada en identidad. También es una stack funcional en Sepolia con contratos deployados, verificados, con direcciones publicadas vía ENS y una webapp capaz de operar sobre ese estado.

A continuación, un pequeño resumen de los avances más relevantes.

---

## Qué quedó funcionando

La PoC en Sepolia ahora contempla explícitamente las piezas principales del flujo:

- `MockZKPassportVerifier`: un mock que simula la ZK proof de identidad, pero que ya está diseñado para ser reemplazado por una integración real. Aun estoy evaluando opciones, pero posiblemente será [zkPass](https://docs.zkpass.org/)
- `ZKPassportIdentityRegistryAdapter`: el adapter que conecta el verifier con el identity en Sepolia
- `CLPc`: el token ERC20, que ahora tiene un flujo de minting y burning más claro, con roles de minter y burner separados
- `ClaimCLPc`: el smart contract que permite a usuarios verificados reclamar CLPc
- `ERC2771Forwarder`: el smart contract que habilita meta-transacciones para una experiencia gasless

La parte importante no es solo que esos contratos existan, sino que ahora el repositorio principal tiene un flujo claro para deployarlos y dejarlos conectados entre sí. Antes, parte del proceso estaba documentado pero todavía dependía de pasos más manuales, especialmente para `ClaimCLPc` y el forwarder. Ahora eso quedó resuelto con scripts dedicados de Foundry.

---

## Deploy más limpio y reproducible

En el repo `admapu` agregué scripts específicos para completar el stack:

- `Deploy.s.sol` para verifier + adapter + token
- `DeployClaim.s.sol` para `ClaimCLPc`
- `DeployForwarder.s.sol` para `ERC2771Forwarder`

Además se actualizó la documentación para que el flujo real sea:

1. compilar y correr tests
2. desplegar contratos base
3. desplegar claim
4. desplegar forwarder
5. hacer wiring post-deploy
6. verificar contratos en Blockscout

Ese wiring post-deploy es importante porque hay dos pasos sin los cuales el sistema no queda realmente operativo:

- otorgar `MINTER_ROLE` al contrato `ClaimCLPc`,
- configurar el mismo `trustedForwarder` en `ClaimCLPc` y `CLPc`.

En otras palabras: el deploy ya no es solo “subir contratos”, sino dejarlos listos para usarse.

---

## Verificación pública y direcciones legibles

Otro avance relevante es que el set actual de contratos quedó verificado en Blockscout y asociado a subdominios ENS bajo `admapu.eth`.

Eso mejora la transparencia porque cualquier persona puede inspeccionar contratos y direcciones, y al mismo timepo se facilita la operabilidad del sistema, ya que ahora es mucho más fácil revisar el estado del sistema cuando las direcciones tienen nombres legibles tipo `<contract>.admapu.eth` en vez de un hash del cual nadie se acuerda.

Me parece que para una PoC que busca abrir conversación pública y técnica, esto no es un detalle menor. Publicar código fuente verificado y con direcciones estables hace que el proyecto sea auditable de verdad, no solo una demo.

---

## Meta-transacciones: el usuario puede no pagar gas

También quedó más claro el camino para una experiencia gasless. Espero.

El diseño actual usa `ERC2771Forwarder`, lo que permite que un relayer pague el gas en ETH y que el usuario final solo firme el mensaje. Esto es especialmente importante si la idea es que personas verificadas reciban CLPc para usarlo en contextos concretos como beneficios en farmacias, educación, alimentación saludable, y transferencias entre usuarios verificados.

La conclusión práctica es la siguiente:

- sí, la UX gasless es posible,
- no, el gas de Ethereum no se paga nativamente en CLPc,
- y el punto crítico no es solo técnico, sino operacional.

Si se financia un relayer, ese relayer necesita políticas claras respecto a límites de uso tanto globales como por usuario, porque de lo contrario se puede convertir en un problema de seguridad intersante. Si el relayer es un servicio centralizado, entonces se vuelve un punto de falla y un vector de ataque. Si el relayer es un servicio descentralizado, entonces se vuelve un problema de coordinación y gobernanza.

No es un problema insoluble, pero sí una capa que debe tratarse como infraestructura, no como un detalle de frontend. Y eso es algo que todavía falta construir, especialmente en términos de monitoreo, alertas y políticas de uso.

---

## Una lección práctica desde la webapp

En paralelo, apareció un problema típico de cualquier sistema que mezcla blockchain con producto real: no todo lo que se puede consultar on-chain conviene consultarlo en tiempo real desde el request path.

La página `/network-status` de la webapp estaba usando `eth_getLogs` para calcular métricas derivadas del verifier, como wallets únicas verificadas o revocadas. En la práctica eso empezó a gatillar errores `429 Too Many Requests` en Infura.

La solución por ahora fue simple y pragmática: Sacar cagando todo eso, porque en verdad no es información crítica para el funcionamiento de la PoC, y porque ese tipo de consultas no escala ni con RPCs más robustos ni con mejores índices.

Es una buena recordatoria de algo básico: una arquitectura útil no es solo la que funciona en el contrato, sino la que además se puede operar de forma estable con RPCs reales y presupuesto real.

---

## Qué demuestra esta etapa

Esta fase no demuestra todavía una stablecoin lista para producción.

Lo que sí demuestra es que el model de transferencias restringidas por identidad ya funciona. El flujo de claim está operatiro end-to-end. El stack puede deployarse y verificarse de forma pública. Y la experiencia gasless ya tiene una ruta técnica razonable.

Todavía faltan terminar temas grandes como reemplazar el verifier mock por una integración ZK real, fortalecer la seguridad y revisión de contratos, construir mejor indexing/observabilidad, y endurecer la capa de relayer.

El desarrollo sigue, preo al menos ya existe una base técnica mucho más coherente y reproducible.

---

## Cierre

Admapu sigue siendo una PoC. Eso no cambió, no cambiará.

Lo que cambió es el nivel de madurez del proyecto: hoy hay menos improvisación, más flujo reproducible y más claridad sobre dónde están los verdaderos desafíos.

La siguiente etapa no pasa tanto por agregar complejidad, sino por convertir esta base en una infraestructura más confiable: mejor verificación, mejores métricas, mejor operación y una integración ZK real que permita reemplazar el mock sin perder la simplicidad del modelo.

Ese sigue siendo el objetivo: una PoC que demuestre que un proyecto como este es técnicamente viable, y que construir tecnología basada en blockchain para resolver problemas sociales no es tan complicado como a veces se pinta.
