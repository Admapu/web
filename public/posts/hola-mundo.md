# Hola mundo 👋

Bienvenido al primer post del **blog de Admapu**.

> Este post existe para mostrar _todos_ los estilos comunes de Markdown en la web.

## Texto básico

Esto es **bold**.

Esto es *italic*.

Esto es ***bold + italic***.

Esto es <u>underline</u> (usando HTML inline).

Esto es ~~tachado~~.

También puedo mezclar: **texto importante con _énfasis_ y <u>subrayado</u>**.

## Emojis 😎🚀🧉

- ✅ Todo funcionando
- ⚠️ Atención a detalles
- 🔒 Seguridad primero
- 🧠 Aprendizaje continuo

## Listas

### Lista con viñetas

- Item uno
- Item dos
  - sub-item A
  - sub-item B

### Lista numerada

1. Diseñar
2. Implementar
3. Probar
4. Deployar

## Links

- [Repositorio Admapu](https://github.com/Admapu)
- [App Admapu](https://app.admapu.xyz)

## Código

Inline: `claim()`

Bloque:

```solidity
function claim() external {
    require(!paused, "Paused");
    require(!claimed[msg.sender], "AlreadyClaimed");
    require(VERIFIER.isVerified(msg.sender), "NotVerified");

    claimed[msg.sender] = true;
    TOKEN.mint(msg.sender, CLAIM_AMOUNT);
}
```

## Tabla

| Campo | Valor |
|---|---|
| Red | Sepolia |
| Token | CLPc |
| Claim | Habilitado |

## Checklist

- [x] Endpoint `/blog`
- [x] Render de markdown
- [x] Post "hola mundo"
- [ ] Segundo post técnico

## Cita técnica

> "Primero que funcione. Luego que sea seguro. Luego que sea bello." — ingeniería pragmática

---

Gracias por leer. Si llegaste hasta aquí: **hola, mundo** 🌍
