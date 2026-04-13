Este proyecto usa [Angular CLI](https://github.com/angular/angular-cli) version 19.2.6.
# 🧾 Home - Menús Digitales con Angular + Firebase

Este proyecto es una solución web para **crear y administrar menús digitales**, ideal para restaurantes, bares, cafeterías y comercios gastronómicos que buscan una alternativa moderna al menú físico. Desarrollado en **Angular** y respaldado por **Firebase**, ofrece una experiencia rápida, responsive y fácil de gestionar.

## 🚀 Características

- ✅ Menús digitales responsivos (mobile-first).
- ✅ Panel de administración para gestionar productos y categorías.
- ✅ Soporte para imágenes de productos.
- ✅ URLs únicas por cliente o restaurante.
- ✅ Almacenamiento en Firebase (Firestore + Storage).
- ✅ Autenticación segura (Firebase Auth).
- ✅ Deploy instantáneo con Firebase Hosting.

## 🛠️ Tecnologías utilizadas

- **Angular 19+**
- **Firebase (Firestore, Auth, Storage, Hosting)**
- **TypeScript**
- **Bootstrap 5** (mobile-first)
- **SCSS / CSS personalizados**
- **Angular Animations**
- **PrimeNG**

## 📦 Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/carloseguibegui/home.git
cd home
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura Firebase:

- Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
- Copia `src/environments/environment.example.ts` a `src/environments/environment.ts`.
- Completa tu configuración de Firebase en `src/environments/environment.ts`:

```ts
export const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
  measurementId: '...'
};
```

4. Ejecuta en modo desarrollo:

```bash
ng serve
```

Accede a la app en `http://localhost:4200`.

## 🔥 Despliegue en Firebase Hosting

1. Instala Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Inicia sesión:

```bash
firebase login
```

3. Inicializa el proyecto (si no lo hiciste aún):

```bash
firebase init
```

4. Build del proyecto:

```bash
ng build --configuration production
```

La hoja de estilos principal ya no depende de fuentes remotas para compilar, así que el build es reproducible sin acceso externo a Google Fonts.

5. Deploy:

```bash
firebase deploy
```

## 📁 Estructura de carpetas (resumen)

```
/src
 ├── app/
 │   ├── core/              # Servicios globales
 │   ├── shared/            # Componentes reutilizables
 │   ├── pages/             # Vistas principales
 │   ├── admin/             # Panel de administración
 │   └── cliente/           # Vista pública del menú
 ├── assets/
 └── environments/
```

## 🧪 Próximas funcionalidades

- [ ] Búsqueda de productos
- [ ] Filtros por categorías
- [ ] Multilenguaje (i18n)
- [ ] Dark mode
- [ ] Estadísticas de visitas y clics
- [ ] Modo QR para imprimir y escanear

## 📸 Demo

[http://marketingeros.online/](http://marketingeros.online/)
[http://marketingeros.online/menuonline/requeterico](http://marketingeros.online/menuonline/requeterico)

## 🙋‍♂️ Autor

Desarrollado por [Carlos Eguibegui](https://github.com/carloseguibegui)  
💼 Backend & Fullstack Developer | Especializado en soluciones web y migraciones de datos en la nube.

## 📄 Licencia

Este proyecto es privado y no está disponible para distribución, copia o uso.
