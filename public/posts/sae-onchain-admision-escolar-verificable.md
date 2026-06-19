# Admisión escolar verificable: cómo llevar las reglas del SAE a infraestructura pública

_Fecha original: 19 de junio de 2026._

En Chile, el Sistema de Admisión Escolar (SAE) resuelve una pregunta sensible para miles de familias: en qué establecimiento podrá matricularse cada estudiante cuando la demanda supera a las vacantes disponibles.

La promesa del SAE es correcta: reemplazar entrevistas, pruebas, pagos encubiertos o selección arbitraria por un proceso común, con reglas conocidas y criterios de prioridad. Pero todavía hay un problema estructural: para la ciudadanía, el resultado sigue siendo una caja negra. Las familias reciben una asignación, pero no pueden verificar por sí mismas que las preferencias, cupos, prioridades y desempates fueron aplicados correctamente.

Admapu permite imaginar una versión distinta: un sistema de admisión que respete las mismas reglas públicas, pero donde cada etapa crítica quede comprometida criptográficamente y pueda auditarse sin exponer datos personales de niños, niñas ni apoderados.

---

## Qué hace hoy el SAE

El SAE centraliza las postulaciones a establecimientos públicos, municipales, SLEP, particulares subvencionados y otros establecimientos que reciben aportes del Estado.

El flujo general es:

1. el apoderado registra la postulación en una plataforma oficial;
2. ordena establecimientos por preferencia;
3. el sistema recibe vacantes declaradas por establecimiento y nivel;
4. si hay vacantes suficientes, todos los postulantes son admitidos;
5. si hay sobredemanda, se aplican prioridades legales y reglas de desempate;
6. el sistema publica resultados;
7. el apoderado acepta, acepta con lista de espera o rechaza;
8. finalmente ocurre la matrícula.

Las prioridades principales son:

- hermanos o hermanas ya matriculados en el establecimiento;
- estudiantes prioritarios, según las reglas de resguardo aplicables;
- hijos o hijas de funcionarios del establecimiento;
- exalumnos que quieran volver, salvo casos de expulsión;
- postulantes sin prioridad.

El mecanismo de asignación se puede modelar como una variante de aceptación diferida: cada estudiante intenta quedar en su mejor preferencia posible y cada establecimiento retiene cupos según capacidad, prioridad y desempate.

Eso es razonable desde el punto de vista de diseño público. El punto débil no es necesariamente la regla: es la verificabilidad.

---

## El problema: confianza sin prueba

El SAE actual exige confianza en varios puntos:

- que las preferencias no fueron alteradas después del cierre;
- que las vacantes publicadas son las que efectivamente usó el algoritmo;
- que las prioridades fueron validadas de manera correcta;
- que ningún postulante entró fuera de plazo;
- que el desempate fue ejecutado según la regla vigente;
- que la lista de espera respetó el orden generado por el proceso;
- que los cupos rechazados o liberados se reasignaron correctamente.

La familia afectada solo ve su resultado. No ve el conjunto completo de datos, no puede recomputar el proceso, y tampoco puede auditar si su posición relativa fue respetada.

Publicar todos los datos en bruto tampoco sería aceptable, porque el proceso contiene información sensible: identidad de menores de edad, condición socioeconómica, vínculos familiares, historial escolar y relaciones laborales.

Por eso la pregunta importante no es “¿blockchain o base de datos?”, sino:

> ¿Cómo hacemos que un proceso público sea verificable sin transformar datos personales en información pública?

---

## Una versión SAE-verifiable sobre Admapu

La alternativa no es poner toda la admisión escolar directamente on-chain. Eso sería caro, lento y riesgoso para la privacidad.

Una arquitectura más realista es híbrida:

- los datos personales y documentos se validan off-chain;
- las credenciales relevantes se emiten como pruebas verificables;
- las postulaciones se registran como commitments;
- las vacantes, calendario y versión del algoritmo quedan firmadas por la autoridad;
- el cálculo puede ejecutarse off-chain, pero con inputs cerrados y reproducibles;
- el resultado se publica mediante raíces Merkle y pruebas individuales verificables.

La cadena funciona como una capa de compromiso, auditoría y resolución de disputas. No reemplaza todos los sistemas del Estado: reduce los puntos donde una persona debe confiar ciegamente.

---

## Componentes técnicos

Una implementación inicial podría separar el sistema en ocho piezas.

### 1. Proceso de admisión

Un contrato `AdmissionProcess` define:

- año del proceso;
- calendario de postulación, cierre, resultados y matrícula;
- versión del algoritmo;
- autoridad firmante;
- estado del proceso: abierto, cerrado, calculado, publicado, impugnable o finalizado.

Esto evita cambios silenciosos de reglas después de que las familias ya postularon.

### 2. Registro de vacantes

Cada establecimiento publica cupos por nivel mediante datos firmados:

```text
schoolId, gradeId, seats, processId, signature
```

On-chain se guarda el hash o commitment de esa declaración. Si después hay una diferencia entre las vacantes publicadas y las usadas en el cálculo, la discrepancia es demostrable.

### 3. Postulación como commitment

El apoderado no necesita revelar públicamente su lista de preferencias. Puede publicar un compromiso:

```text
commitment = hash(studentSecret, processId, orderedPreferences, nonce)
```

Antes del cierre puede reemplazar su postulación. Después del cierre, el último commitment válido queda congelado.

Esto permite probar que una lista específica fue enviada antes del plazo, sin exponerla al público durante el proceso.

### 4. Credenciales de prioridad

Las prioridades no deberían ser simples declaraciones del usuario. Deben venir de credenciales firmadas por entidades autorizadas:

- hermano matriculado en el establecimiento;
- estudiante prioritario;
- hijo o hija de funcionario;
- exalumno habilitado para volver.

Idealmente, esas credenciales se usan con pruebas de conocimiento cero para demostrar “cumplo esta condición para este establecimiento” sin revelar RUT, domicilio, ingreso familiar ni otros datos sensibles.

### 5. Dataset cerrado

Al finalizar la postulación, el sistema publica un hash del dataset usado:

```text
applicationsRoot
vacanciesRoot
credentialsRoot
algorithmHash
```

Con esto, cualquier auditor puede verificar que el resultado corresponde a una foto específica del proceso y no a datos modificados después.

### 6. Cálculo reproducible

El algoritmo puede ejecutarse off-chain por costo y escala, pero debe ser determinístico y reproducible.

El flujo sería:

```text
1. ordenar postulantes por prioridad para cada colegio/curso;
2. aplicar desempate verificable dentro de cada grupo;
3. ejecutar aceptación diferida usando las preferencias de estudiantes;
4. generar asignaciones finales;
5. generar listas de espera para preferencias superiores;
6. publicar roots de resultados y pruebas individuales.
```

Si la regla de desempate incluye aleatoriedad, el seed debe ser público e impredecible antes del cierre. Por ejemplo:

```text
seed = hash(randomBeacon, processId, applicationsRoot, vacanciesRoot)
```

Si la regla vigente elimina la aleatoriedad, el contrato debe registrar exactamente la versión determinística aprobada.

### 7. Resultados con pruebas Merkle

El resultado no tiene que publicar el nombre de cada estudiante. Basta publicar una raíz:

```text
assignmentsRoot
waitlistRoot
```

Cada familia recibe una prueba privada que demuestra:

- que su postulación fue incluida;
- qué preferencia obtuvo;
- qué prioridades fueron consideradas;
- por qué no obtuvo una preferencia superior;
- cuál es su posición en lista de espera, si corresponde.

La familia puede verificar su caso sin abrir los datos del resto.

### 8. Ventana de impugnación

Antes de finalizar el proceso, debe existir un período de impugnación.

Ejemplos:

- una vacante usada no coincide con la vacante firmada;
- una postulación no aparece en el dataset cerrado;
- una credencial válida fue omitida;
- una asignación no corresponde al algoritmo publicado;
- una lista de espera saltó a un postulante.

La cadena no resuelve por sí sola todos los conflictos administrativos, pero sí permite presentar evidencia criptográfica clara y auditable.

---

## Por qué esta solución es superior al modelo actual

### 1. Verificabilidad individual

Hoy una familia puede consultar su resultado. En una versión verificable, además puede comprobar que el resultado se deriva de sus preferencias, sus prioridades y las reglas del proceso.

La diferencia es profunda: no es solo transparencia narrativa, es prueba.

### 2. Auditoría pública sin sacrificar privacidad

El Estado no debería publicar datos sensibles de menores para ganar confianza. Con commitments, raíces Merkle y pruebas ZK, se puede auditar la integridad del proceso sin revelar información personal.

Esto permite separar dos cosas que normalmente se confunden:

- privacidad de las personas;
- auditabilidad del sistema.

### 3. Menos espacio para cambios opacos

Si las vacantes, postulaciones, algoritmo y resultados quedan comprometidos criptográficamente, cualquier cambio posterior deja huella.

Eso reduce disputas como:

- “mi postulación no fue considerada”;
- “el colegio tenía más cupos de los que aparecieron”;
- “se movió la lista de espera sin explicación”;
- “la regla cambió durante el proceso”.

### 4. Mejor trazabilidad de listas de espera

Las listas de espera son un punto especialmente sensible porque se mueven después del resultado principal. Una raíz de lista de espera y eventos de aceptación/rechazo permitirían verificar que cada cupo liberado se ofreció al siguiente postulante correcto.

### 5. Confianza institucional portable

Un sistema así no solo sirve para admisión escolar. La misma arquitectura puede aplicarse a beneficios sociales, subsidios, becas, vivienda, salud o programas municipales.

Admapu puede convertirse en una capa común para beneficios públicos verificables:

- identidad privada;
- elegibilidad demostrable;
- reglas públicas;
- resultados auditables;
- ejecución programable.

---

## Qué no debe hacerse

Una admisión escolar on-chain no debería:

- publicar RUTs;
- publicar condiciones socioeconómicas;
- exponer preferencias de cada familia;
- forzar a apoderados a manejar llaves cripto directamente;
- depender de una wallet como barrera de acceso;
- ejecutar todo el algoritmo en una red pública si eso aumenta costos sin mejorar garantías.

La experiencia de usuario debe seguir pareciéndose a una plataforma pública normal. La criptografía debe operar debajo, como infraestructura de confianza, no como una carga para las familias.

---

## Camino de implementación

Una prueba de concepto razonable para Admapu podría avanzar por etapas:

1. modelar colegios, niveles, vacantes y postulaciones ficticias;
2. implementar commitments de postulación;
3. implementar credenciales firmadas de prioridad;
4. ejecutar aceptación diferida off-chain;
5. publicar `applicationsRoot`, `vacanciesRoot`, `algorithmHash` y `assignmentsRoot`;
6. generar pruebas Merkle por estudiante;
7. construir una vista web donde una familia pueda verificar su resultado;
8. agregar impugnaciones basadas en evidencia;
9. evaluar ZK para prioridades sensibles.

La primera versión no necesita reemplazar al SAE real. Puede demostrar algo más acotado y potente: que las reglas de admisión pueden ser ejecutadas de manera reproducible y verificable, sin exponer datos personales.

---

## Conclusión

El SAE intenta resolver un problema público real: asignar cupos escolares de forma justa cuando no hay vacantes suficientes para todos. Pero una política pública de esta importancia no debería depender solo de confianza institucional.

Una implementación sobre Admapu permitiría conservar las reglas del sistema actual y agregar una capa que hoy falta: prueba criptográfica.

El resultado sería un modelo más transparente, más auditable y más robusto frente a errores o arbitrariedades, sin convertir la información de niños y familias en datos públicos.

Esa es la oportunidad: no “blockchain por blockchain”, sino infraestructura verificable para derechos sociales.

---

## Fuentes de referencia

- Sistema de Admisión Escolar: https://www.sistemadeadmisionescolar.cl/
- Cómo funciona el proceso SAE: https://www.sistemadeadmisionescolar.cl/como_funciona_el_proceso.html
- Criterios de prioridad, Ayuda Mineduc: https://www.ayudamineduc.cl/ficha/criterios-de-prioridad
- Quiénes deben postular, Ayuda Mineduc: https://www.ayudamineduc.cl/ficha/quienes-deben-postular-al-sistema-de-admision-escolar
- Ley 20.845 de Inclusión Escolar: https://www.bcn.cl/leychile/navegar?idNorma=1078172
- Decreto 152, Reglamento del Sistema de Admisión Escolar: https://www.bcn.cl/leychile/navegar?idNorma=1093444
