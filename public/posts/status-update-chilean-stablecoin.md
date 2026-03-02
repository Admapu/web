# Status update: Chilean stablecoin

![Imagen de cabecera del post](/posts/2026-02-17-status-update-header.jpg)

_Fecha original: 17 de febrero de 2026._

Después de algunos meses trabajando en horas libres, ya existe una primera versión funcional de la PoC que permite interactuar con smart contracts reales, validar elegibilidad de usuarios y operar minting/transferencias con reglas explícitas.

No está listo para producción (ni busca estarlo todavía), pero sí en un punto donde se puede probar con flujos reales end-to-end.

---

## Estado actual

La capa on-chain está operativa en **Ethereum Sepolia**:

- token `CLPc` desplegado,
- verifier desplegado (por ahora, mock),
- direcciones asociadas a ENS bajo `admapu.eth` para facilitar verificación y lectura.

Además existe una webapp funcional en `app.admapu.xyz` para validar el flujo mínimo:

- login con wallet (Privy),
- lectura on-chain de elegibilidad,
- consulta de balance CLPc.

---

## Tooling y flujo reproducible

El repositorio principal (`Admapu/admapu`) ya incluye tooling con **Foundry + Makefile** para operar sobre testnet:

- verificar/revocar usuarios,
- setear flags de edad,
- consultar estado,
- mintear CLPc,
- transferir entre wallets verificadas.

No son solo contratos desplegados: hay flujo reproducible sobre red pública.

---

## Punto pendiente clave: ZK real

La arquitectura está preparada para integrar verificación criptográfica real (por ejemplo, vía ZKPassport), pero esa capa todavía no está implementada.

Hoy la validación sigue en mock para habilitar pruebas funcionales del sistema completo.

---

## Próximos pasos

- Reemplazar mock por integración ZK real.
- Fortalecer seguridad de contratos y auditoría.
- Implementar monitoreo.
- Extender lógica de contratos (claim, distribución, reglas por perfil, etc.).

---

## Nota de arquitectura y costos

Un punto importante de esta etapa es el costo operativo:

- contratos en Sepolia (costos de gas muy bajos para test),
- web y webapp en Cloudflare Workers (serverless/global),
- operación total de la PoC con costos cercanos a cero.

Esto valida no solo viabilidad técnica, también viabilidad económica para una prueba de concepto orientada a impacto social.

---

Si quieres revisar código o colaborar en la integración ZK, el código está en [github.com/Admapu](https://github.com/Admapu).

_Post adaptado desde la publicación original en LinkedIn._
