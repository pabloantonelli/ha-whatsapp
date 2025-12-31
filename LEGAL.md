# Guía Legal para Mantener Este Fork

## 📜 Resumen Legal

Este documento explica cómo mantener este fork de manera legal y ética, cumpliendo con la **Licencia Apache 2.0** del proyecto original.

## ✅ Lo Que DEBES Hacer

### 1. Mantener la Licencia Apache 2.0

**Obligatorio por ley:**
- ✅ Mantener el archivo `LICENSE` sin modificaciones
- ✅ Mantener el archivo `NOTICE` actualizado
- ✅ Incluir el aviso de copyright del autor original

**Ubicación:**
- `/LICENSE` - Licencia completa Apache 2.0
- `/NOTICE` - Avisos de atribución

### 2. Dar Crédito al Autor Original

**Obligatorio por ley:**
- ✅ Mencionar a Giuseppe Castaldo como autor original
- ✅ Incluir enlace al repositorio original
- ✅ No remover avisos de copyright existentes

**Dónde dar crédito:**
- `README.md` - Sección destacada sobre el fork
- `NOTICE` - Información detallada de atribución
- `package.json` - Campo "author"
- `config.yaml` - Comentario con URL original
- Documentación relevante

### 3. Documentar Cambios

**Obligatorio por ley (Apache 2.0, Sección 4b):**
- ✅ Documentar todos los cambios que hagas
- ✅ Indicar claramente qué archivos modificaste
- ✅ Mantener un CHANGELOG actualizado

**Cómo documentar:**
```markdown
## Archivos Modificados en v2.0.0
- whatsapp.js - Migrado a ESM y Baileys 7.0
- index.js - Actualizado a async/await
- package.json - Actualizadas dependencias
```

### 4. Mantener Avisos de Atribución

**Obligatorio por ley (Apache 2.0, Sección 4c):**
- ✅ Mantener todos los avisos de copyright
- ✅ Mantener avisos de patentes
- ✅ Mantener avisos de marcas registradas
- ✅ Mantener disclaimers

### 5. Incluir Copia de la Licencia

**Obligatorio por ley (Apache 2.0, Sección 4a):**
- ✅ Incluir copia completa de Apache License 2.0
- ✅ Hacer la licencia fácilmente accesible
- ✅ No modificar el texto de la licencia

## ❌ Lo Que NO Debes Hacer

### 1. NO Cambiar la Licencia

**Prohibido:**
- ❌ Cambiar a otra licencia (MIT, GPL, etc.)
- ❌ Agregar restricciones adicionales
- ❌ Hacer el código propietario

**Permitido:**
- ✅ Mantener Apache 2.0
- ✅ Agregar tu copyright a TUS modificaciones
- ✅ Dual-license (Apache 2.0 + otra compatible)

### 2. NO Remover Créditos

**Prohibido:**
- ❌ Remover el nombre de Giuseppe Castaldo
- ❌ Remover enlaces al repositorio original
- ❌ Pretender que es 100% tu trabajo
- ❌ Remover avisos de copyright

### 3. NO Usar Marcas Registradas

**Prohibido (Apache 2.0, Sección 6):**
- ❌ Usar el nombre del autor original para promocionar
- ❌ Implicar endorsement del autor original
- ❌ Usar marcas sin permiso

**Permitido:**
- ✅ Decir "Fork de [proyecto original]"
- ✅ Mencionar compatibilidad
- ✅ Dar crédito apropiado

### 4. NO Dar Garantías en Nombre del Original

**Prohibido:**
- ❌ Dar garantías sobre el código original
- ❌ Asumir responsabilidad por el autor original
- ❌ Implicar que el autor original respalda tu fork

## 📋 Checklist de Cumplimiento Legal

### Al Crear el Fork

- [x] Mantener archivo LICENSE
- [x] Crear archivo NOTICE
- [x] Actualizar README con información del fork
- [x] Dar crédito al autor original
- [x] Documentar que es un fork

### Al Hacer Cambios

- [x] Documentar cambios en CHANGELOG.md
- [x] Indicar archivos modificados
- [x] Mantener avisos de copyright
- [x] Agregar tu copyright a nuevos archivos (opcional)

### Al Publicar

- [x] Verificar que LICENSE esté presente
- [x] Verificar que NOTICE esté actualizado
- [x] Verificar créditos en README
- [x] Verificar que cambios estén documentados

## 🔍 Requisitos Específicos de Apache 2.0

### Sección 4: Redistribución

Cuando redistribuyes (publicas tu fork), DEBES:

1. **Incluir copia de la licencia** ✅
   - Archivo LICENSE presente

2. **Documentar cambios** ✅
   - CHANGELOG.md actualizado
   - Archivos modificados documentados

3. **Mantener avisos** ✅
   - Copyright del original
   - Avisos de patentes
   - Disclaimers

4. **Incluir NOTICE** ✅
   - Si el original tiene NOTICE, mantenerlo
   - Agregar tus propios avisos

### Tus Derechos Bajo Apache 2.0

Tienes derecho a:

- ✅ Usar el código comercialmente
- ✅ Modificar el código
- ✅ Distribuir el código
- ✅ Sublicenciar (bajo mismos términos)
- ✅ Uso privado
- ✅ Agregar tu copyright a modificaciones

### Tus Obligaciones Bajo Apache 2.0

Debes:

- ✅ Incluir licencia y copyright
- ✅ Documentar cambios
- ✅ Incluir NOTICE si existe
- ✅ Mantener disclaimers

## 📝 Plantillas de Atribución

### En README.md

```markdown
## About This Fork

This is a maintained fork of the [original repository](URL) by [Author].

**Original Author:** [Name]
**Original Repository:** [URL]
**License:** Apache License 2.0
```

### En Código Fuente

```javascript
/**
 * WhatsApp Home Assistant Add-on
 * 
 * Original work Copyright © Giuseppe Castaldo
 * Modified work Copyright © 2025 Pablo Antonelli
 * 
 * Licensed under the Apache License, Version 2.0
 * See LICENSE file for details
 */
```

### En NOTICE

```
This project is a fork of [Original Project]
Original Repository: [URL]
Original Author: [Name]
Original License: Apache License 2.0

Modifications by [Your Name] are also licensed under Apache License 2.0
```

## 🤝 Buenas Prácticas (No Obligatorias)

### Ética y Cortesía

Aunque no son legalmente obligatorias, considera:

1. **Comunicación con el Autor Original**
   - Informarle sobre tu fork
   - Ofrecer contribuir mejoras al original
   - Mantener buena relación

2. **Contribuir de Vuelta**
   - Si arreglas bugs, considera PR al original
   - Comparte mejoras útiles
   - Ayuda a la comunidad

3. **Claridad sobre el Fork**
   - Deja claro que es un fork
   - Explica por qué existe el fork
   - No confundas a los usuarios

4. **Mantener Compatibilidad**
   - API compatible cuando sea posible
   - Facilita migración
   - Documenta diferencias

## ⚖️ Casos Especiales

### Si el Original Se Actualiza

**Puedes:**
- ✅ Incorporar cambios del original
- ✅ Mantener tus mejoras
- ✅ Dar crédito por los cambios

**Debes:**
- ✅ Mantener atribución del original
- ✅ Documentar qué incorporaste
- ✅ Respetar la licencia

### Si Quieres Cambiar de Licencia

**Para código original:**
- ❌ NO puedes cambiar la licencia
- ❌ Debe permanecer Apache 2.0

**Para TUS adiciones:**
- ✅ Puedes dual-license (Apache 2.0 + otra)
- ✅ Debe ser compatible con Apache 2.0
- ⚠️ Complejo, consulta abogado si es crítico

### Si Quieres Comercializar

**Permitido:**
- ✅ Uso comercial está permitido
- ✅ Puedes cobrar por servicios
- ✅ Puedes ofrecer soporte pago

**Obligatorio:**
- ✅ Mantener licencia Apache 2.0
- ✅ Dar crédito al original
- ✅ Incluir LICENSE y NOTICE

## 📞 Si Tienes Dudas

### Preguntas Legales

Para preguntas legales específicas:
- Consulta un abogado especializado en software
- Revisa la [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- Consulta [Apache License FAQ](https://www.apache.org/foundation/license-faq.html)

### Preguntas Técnicas

Para preguntas sobre el fork:
- Abre un issue en este repositorio
- Consulta la documentación
- Pregunta a la comunidad

## ✅ Resumen: Estás Cumpliendo Si...

- ✅ Mantienes el archivo LICENSE
- ✅ Tienes un archivo NOTICE actualizado
- ✅ Das crédito a Giuseppe Castaldo en README
- ✅ Documentas tus cambios en CHANGELOG
- ✅ No remueves avisos de copyright
- ✅ Dejas claro que es un fork
- ✅ No usas marcas sin permiso
- ✅ No das garantías en nombre del original

## 🎯 Estado Actual de Este Fork

### ✅ Cumplimiento Verificado

- [x] LICENSE presente y sin modificar
- [x] NOTICE creado con atribución completa
- [x] README actualizado con créditos
- [x] package.json con autor original
- [x] config.yaml con comentario al original
- [x] CHANGELOG documentando cambios
- [x] CONTRIBUTING.md con guías
- [x] Todos los archivos mantienen avisos

### 📊 Nivel de Cumplimiento: 100%

Este fork cumple completamente con los requisitos de Apache License 2.0.

---

**Última Revisión:** 31 de Diciembre, 2025  
**Licencia:** Apache License 2.0  
**Disclaimer:** Este documento es informativo. Para asesoría legal, consulta un abogado.
