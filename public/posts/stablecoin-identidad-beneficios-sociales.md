# ¿Cómo podría una stablecoin basada en identidad transformar el acceso a beneficios sociales?

![Imagen de cabecera del post](/posts/2025-12-15-stablecoin-identidad-header.png)

_Fecha original: 15 de diciembre de 2025._

En los últimos años, blockchain dejó de ser solo un experimento financiero para convertirse en una tecnología capaz de resolver problemas reales.

Pero gran parte de la conversación pública sigue enfocada en DeFi, NFTs y protocolos globales. Mucho menos se discute cómo esta tecnología puede mejorar la vida cotidiana en Chile, especialmente en áreas donde el sistema actual es lento, ineficiente o poco equitativo.

En este post exploro una idea central del proyecto Admapu: una stablecoin chilena, pensada exclusivamente para ciudadanos verificados, para distribuir beneficios de forma más eficiente, privada y programable.

---

## Identidad privada + blockchain

Imagina un sistema en el que una persona puede demostrar que es ciudadana chilena (o que cumple una condición como “mayor de 65 años”) **sin revelar RUT ni datos personales**.

Eso es posible con **pruebas Zero-Knowledge (ZK)**: permiten verificar atributos sin exponer la identidad completa.

Combinado con una stablecoin vinculada al peso chileno, el resultado sería un activo digital:

- privado,
- verificable,
- programable,
- y con trazabilidad de los flujos.

La clave técnica es separar:

1. identidad real (off-chain),
2. validación criptográfica (on-chain).

---

## Casos de uso de alto impacto

### 1) Subsidios de salud para adultos mayores

Asignar mensualmente fondos a personas mayores de 65 años, con gasto restringido a farmacias y centros de salud autorizados.

Beneficios:

- menos fraude,
- mejor focalización,
- mejor trazabilidad del uso del beneficio.

### 2) Incentivos a estudiantes por desempeño

Recompensas automáticas según elegibilidad demostrada con pruebas ZK, utilizables en:

- materiales educativos,
- conectividad,
- transporte u otros convenios.

### 3) Respuesta ante desastres

Distribución casi inmediata de fondos a ciudadanos verificados en zonas afectadas, para consumo en comercios locales habilitados.

Esto reduce tiempos de respuesta y dependencia de mecanismos burocráticos tradicionales.

---

## ¿Por qué Ethereum y no una cadena desde cero?

### Seguridad de red

Ethereum es una de las redes más seguras y auditadas del ecosistema, con alto nivel de descentralización y años de operación bajo presión real.

### Ecosistema existente

Aprovecha herramientas maduras para construir más rápido:

- wallets ampliamente usadas,
- infraestructura ZK,
- librerías y frameworks de desarrollo,
- observabilidad y monitoreo.

### Estándares abiertos e interoperabilidad

Basarse en estándares como ERC-20 y otros EIPs relevantes simplifica la integración futura y mejora la auditabilidad pública.

---

## Estado del proyecto (al publicar este post)

CLPc nació como una prueba de concepto para una stablecoin orientada a ciudadanos chilenos verificados.

Ya existía una base técnica funcional en testnet, con:

- control de acceso por roles,
- mecanismos de pausa,
- restricciones de transferencias por verificación,
- arquitectura modular para evolucionar con seguridad.

Además, la verificación de elegibilidad fue diseñada bajo un enfoque ZK para preservar privacidad sin sacrificar cumplimiento de reglas.

---

## Desafíos reales

El principal desafío no es únicamente técnico; también es económico e institucional:

- auditar bien cuesta,
- operar de forma segura cuesta,
- y este tipo de sistema no está diseñado para especulación.

La intención del proyecto es demostrar viabilidad técnica y utilidad social, para habilitar una conversación seria sobre infraestructura pública digital con privacidad por diseño.

---

## Cierre

La tecnología ya está disponible.

El punto no es si se puede construir, sino si existe voluntad para aplicar estas herramientas al bien común: beneficios más eficientes, más trazables y más justos, sin comprometer privacidad ciudadana.

---

_Post adaptado desde la publicación original en LinkedIn y su versión en borisquiroz.dev._
